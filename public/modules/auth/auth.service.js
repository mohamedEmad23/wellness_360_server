"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
const axios_1 = require("axios");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.BadRequestException('Email already exists');
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
                isEmailVerified: user.isEmailVerified,
            },
            message: 'Registration successful. Please verify your email with the OTP sent to your email address.',
        };
    }
    async login(loginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isEmailVerified) {
            const otp = this.generateOtp();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 5 * 60000);
            await this.usersService.updateById(user._id.toString(), {
                currentOtp: otp,
                emailVerificationOtpCreatedAt: now,
                emailVerificationOtpExpiresAt: expiresAt,
            });
            await this.sendOtpEmail(user.email, otp);
            throw new common_1.UnauthorizedException({
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
    async generateTokens(userId, email) {
        const accessToken = await this.jwtService.signAsync({
            sub: userId,
            email,
        }, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '1d',
        });
        return {
            accessToken,
        };
    }
    async verifyEmail(verifyEmailDto) {
        const { email, otp } = verifyEmailDto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isEmailVerified) {
            return {
                message: 'Email already verified',
                isEmailVerified: true,
            };
        }
        if (!user.currentOtp || user.currentOtp !== otp) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        const now = new Date();
        if (!user.emailVerificationOtpExpiresAt || user.emailVerificationOtpExpiresAt < now) {
            throw new common_1.BadRequestException('OTP expired. Please request a new one.');
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
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            ...tokens,
        };
    }
    async resendOtp(resendOtpDto) {
        const { email } = resendOtpDto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
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
            throw new common_1.BadRequestException('Please wait at least 1 minute before requesting a new OTP');
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
    generateOtp() {
        return (0, crypto_1.randomInt)(100000, 999999).toString();
    }
    async sendOtpEmail(email, otp) {
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
            await axios_1.default.post(`http://email-sender-orcin-mu.vercel.app/send-email`, emailBody, { headers });
        }
        catch (error) {
            console.error('Email sending error:', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException({
                statusCode: 500,
                errorCode: 'EMAIL_SEND_ERROR',
                message: 'Failed to send the OTP email. Please try again later.',
            });
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map