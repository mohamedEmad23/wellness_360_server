import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        user: {
            _id: unknown;
            email: string;
            firstName: string;
            lastName: string;
            gender: "male" | "female";
            dob: Date;
            age: number;
            height: number;
            weight: number;
            activityLevel: "sedentary" | "lightly active" | "moderately active" | "very active";
            goal: "maintain" | "lose" | "gain";
            dailyCalories: number;
            caloriesLeft: number;
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
}
