import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import axios from 'axios';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Injectable()
export class AuthService {
  // Use environment variable for secret password
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // Generate OTP for email verification
    const otp = this.generateOtp();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60000); // OTP expires in 5 minutes
    
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      currentOtp: otp,
      emailVerificationOtpCreatedAt: now,
      emailVerificationOtpExpiresAt: expiresAt,
      isEmailVerified: false,
    });

    // Send OTP to user's email
    await this.sendOtpEmail(user.email, otp);

    return {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        dob: user.dob,
        age: user.age,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        goal: user.goal,
        dailyCalories: user.dailyCalories,
        caloriesLeft: user.caloriesLeft,
        isEmailVerified: user.isEmailVerified,
      },
      message: 'Registration successful. Please verify your email with the OTP sent to your email address.',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Generate new OTP if needed
      const otp = this.generateOtp();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60000); // OTP expires in 5 minutes
      
      // Update user with new OTP
      await this.usersService.updateById(user._id.toString(), {
        currentOtp: otp,
        emailVerificationOtpCreatedAt: now,
        emailVerificationOtpExpiresAt: expiresAt,
      });
      
      // Send OTP to user's email
      await this.sendOtpEmail(user.email, otp);
      
      throw new UnauthorizedException({
        message: 'Email not verified. A new verification code has been sent to your email.',
        isEmailVerified: false,
      });
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email);
    return {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '1d', 
      },
    );

    return {
      accessToken,
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;
    
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    if (user.isEmailVerified) {
      return {
        message: 'Email already verified',
        isEmailVerified: true,
      };
    }
    
    // Check if OTP is valid
    if (!user.currentOtp || user.currentOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }
    
    // Check if OTP is expired
    const now = new Date();
    if (!user.emailVerificationOtpExpiresAt || user.emailVerificationOtpExpiresAt < now) {
      throw new BadRequestException('OTP expired. Please request a new one.');
    }
    
    // Mark email as verified and clear OTP data
    await this.usersService.updateById(user._id.toString(), {
      isEmailVerified: true,
      currentOtp: null,
      emailVerificationOtpCreatedAt: null,
      emailVerificationOtpExpiresAt: null,
    });
    
    // Generate tokens for automatic login after verification
    const tokens = await this.generateTokens(user._id.toString(), user.email);
    
    return {
      message: 'Email verified successfully',
      isEmailVerified: true,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ...tokens,
    };
  }
  
  async resendOtp(resendOtpDto: ResendOtpDto) {
    const { email } = resendOtpDto;
    
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    if (user.isEmailVerified) {
      return {
        message: 'Email already verified',
        isEmailVerified: true,
      };
    }
    
    // Check if last OTP was sent less than 1 minute ago
    const now = new Date();
    if (user.emailVerificationOtpCreatedAt && 
        (now.getTime() - user.emailVerificationOtpCreatedAt.getTime()) < 60000) {
      throw new BadRequestException('Please wait at least 1 minute before requesting a new OTP');
    }
    
    // Generate new OTP
    const otp = this.generateOtp();
    const expiresAt = new Date(now.getTime() + 5 * 60000); // OTP expires in 5 minutes
    
    // Update user with new OTP
    await this.usersService.updateById(user._id.toString(), {
      currentOtp: otp,
      emailVerificationOtpCreatedAt: now,
      emailVerificationOtpExpiresAt: expiresAt,
    });
    
    // Send OTP to user's email
    await this.sendOtpEmail(user.email, otp);
    
    return {
      message: 'A new verification code has been sent to your email',
    };
  }
  
  private generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

  // Send OTP via email
  private async sendOtpEmail(email: string, otp: string) {
    const emailBody = {
      to: email,
      subject: 'Email Verification OTP',
      text: `Your OTP for email verification is: ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Thank you for registering with our service. To complete your registration, please use the following OTP:</p>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code is valid for 5 minutes only.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    const headers = {
      Authorization: `Bearer ${this.configService.get('SECRET_PASSWORD') || 'your-secret-password'}`,
      'Content-Type': 'application/json',
    };

    try {
      await axios.post(`http://email-sender-orcin-mu.vercel.app/send-email`, emailBody, { headers });
    } catch (error) {
      console.error('Email sending error:', error.response?.data || error.message);
      throw new InternalServerErrorException({
        statusCode: 500,
        errorCode: 'EMAIL_SEND_ERROR',
        message: 'Failed to send the OTP email. Please try again later.',
      });
    }
  }
}
