import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            _id: unknown;
            email: string;
            firstName: string;
            lastName: string;
            isEmailVerified: boolean;
        };
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            _id: unknown;
            email: string;
            firstName: string;
            lastName: string;
            isEmailVerified: true;
        };
    }>;
    private generateTokens;
    verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{
        message: string;
        isEmailVerified: boolean;
    } | {
        accessToken: string;
        message: string;
        isEmailVerified: boolean;
        user: {
            _id: unknown;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
    resendOtp(resendOtpDto: ResendOtpDto): Promise<{
        message: string;
        isEmailVerified: boolean;
    } | {
        message: string;
        isEmailVerified?: undefined;
    }>;
    private generateOtp;
    private sendOtpEmail;
}
