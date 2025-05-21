import { 
  BadRequestException, 
  Injectable, 
  UnauthorizedException, 
  InternalServerErrorException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomInt, randomBytes } from 'crypto';
import axios from 'axios';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ReauthenticateDto } from './dto/reauthenticate.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ReauthSession } from '../../infrastructure/database/schemas/reauth-session.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(ReauthSession.name) private reauthSessionModel: Model<ReauthSession>
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const otp = this.generateOtp();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60000);
    
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      currentOtp: otp,
      emailVerificationOtpCreatedAt: now,
      emailVerificationOtpExpiresAt: expiresAt,
      isEmailVerified: false,
    });

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
  
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    if (!user.isEmailVerified) {
      throw new UnauthorizedException({
        message: 'Email not verified. Please verify your email to login.',
        isEmailVerified: false,
      });
    }
  
    const tokens = await this.generateTokens(user._id.toString(), user.email);
  
    return {
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        isProfileCompleted: user.isProfileCompleted || false,
      },
      access_token: tokens.access_token,
    };
  }
  
  private async generateTokens(userId: string, email: string) {
    const access_token = await this.jwtService.signAsync(
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
      access_token: access_token,
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
        isProfileCompleted: user.isProfileCompleted || false,
      };
    }
    
    if (!user.currentOtp || user.currentOtp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }
    
    const now = new Date();
    if (!user.emailVerificationOtpExpiresAt || user.emailVerificationOtpExpiresAt < now) {
      throw new BadRequestException('OTP expired. Please request a new one.');
    }
    
    await this.usersService.updateById(user._id.toString(), {
      isEmailVerified: true,
      currentOtp: null,
      emailVerificationOtpCreatedAt: null,
      emailVerificationOtpExpiresAt: null,
    });
    
    const tokens = await this.generateTokens(user._id.toString(), user.email);
    
    return {
      message: 'Email verified successfully',
      isEmailVerified: true,
      isProfileCompleted: user.isProfileCompleted || false,
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
    
    const now = new Date();
    if (user.emailVerificationOtpCreatedAt && 
        (now.getTime() - user.emailVerificationOtpCreatedAt.getTime()) < 60000) {
      throw new BadRequestException('Please wait at least 1 minute before requesting a new OTP');
    }
    
    const otp = this.generateOtp();
    const expiresAt = new Date(now.getTime() + 5 * 60000);
    
    await this.usersService.updateById(user._id.toString(), {
      currentOtp: otp,
      emailVerificationOtpCreatedAt: now,
      emailVerificationOtpExpiresAt: expiresAt,
    });
    
    await this.sendOtpEmail(user.email, otp);
    
    return {
      message: 'A new verification code has been sent to your email',
    };
  }
  
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message: 'If the email exists in our system, you will receive a password reset code',
      };
    }
    
    const now = new Date();
    if (user.emailVerificationOtpCreatedAt && 
        (now.getTime() - user.emailVerificationOtpCreatedAt.getTime()) < 60000) {
      throw new BadRequestException('Please wait at least 1 minute before requesting a new code');
    }
    
    const otp = this.generateOtp();
    const expiresAt = new Date(now.getTime() + 5 * 60000);
    
    await this.usersService.updateById(user._id.toString(), {
      currentOtp: otp,
      emailVerificationOtpCreatedAt: now,
      emailVerificationOtpExpiresAt: expiresAt,
    });
    
    await this.sendPasswordResetEmail(user.email, otp);
    
    return {
      message: 'If the email exists in our system, you will receive a password reset code',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;
    
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset code');
    }
    
    if (!user.currentOtp || user.currentOtp !== otp) {
      throw new BadRequestException('Invalid or expired password reset code');
    }
    
    const now = new Date();
    if (!user.emailVerificationOtpExpiresAt || user.emailVerificationOtpExpiresAt < now) {
      throw new BadRequestException('Password reset code has expired. Please request a new one');
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updateById(user._id.toString(), {
      password: hashedPassword,
      currentOtp: null,
      emailVerificationOtpCreatedAt: null,
      emailVerificationOtpExpiresAt: null,
    });
    
    return {
      message: 'Password reset successful. You can now login with your new password',
    };
  }

  private generateReauthToken(): string {
    return randomBytes(32).toString('hex');
  }

  async reauthenticate(userId: string, reauthenticateDto: ReauthenticateDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      reauthenticateDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Delete any existing sessions for this user
    await this.reauthSessionModel.deleteMany({ userId: user._id });

    // Generate new reauth session
    const token = this.generateReauthToken();
    const now = new Date();
    const session = await this.reauthSessionModel.create({
      userId: user._id,
      token,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes expiry
      used: false,
    });

    return {
      message: 'Reauthentication successful',
      reauthToken: session.token,
      expiresAt: session.expiresAt,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    // Find and validate the reauth session
    const session = await this.reauthSessionModel.findOne({
      userId,
      token: changePasswordDto.reauthToken,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired reauthentication token');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Mark the session as used before making any changes
    session.used = true;
    await session.save();

    try {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

      // Update the password
      await this.usersService.updateById(userId, {
        password: hashedPassword,
      });

      // Clean up old sessions
      await this.reauthSessionModel.deleteMany({ userId });

      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      // In case of error, ensure the session is deleted
      await this.reauthSessionModel.deleteMany({ userId });
      throw error;
    }
  }

  private generateOtp(): string {
    return randomInt(100000, 999999).toString();
  }

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

  private async sendPasswordResetEmail(email: string, otp: string) {
    const emailBody = {
      to: email,
      subject: 'Password Reset Code',
      text: `Your password reset code is: ${otp}. It is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>You have requested to reset your password. Use the following code to reset your password:</p>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code is valid for 5 minutes only.</p>
          <p>If you didn't request this code, please ignore this email and make sure your account is secure.</p>
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
        message: 'Failed to send the password reset code. Please try again later.',
      });
    }
  }
}
