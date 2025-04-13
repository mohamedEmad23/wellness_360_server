export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gender?: 'male' | 'female';
    dob?: Date;
    age?: number;
    height: number;
    weight: number;
    activityLevel?: string;
    goal?: 'lose' | 'maintain' | 'gain';
    dailyCalories?: number;
    caloriesLeft?: number;
    currentOtp?: string;
    emailVerificationOtpCreatedAt?: Date;
    emailVerificationOtpExpiresAt?: Date;
    isEmailVerified?: boolean;
    constructor(partial?: Partial<CreateUserDto>);
}
