export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    currentOtp?: string;
    emailVerificationOtpCreatedAt?: Date;
    emailVerificationOtpExpiresAt?: Date;
    isEmailVerified?: boolean;
    constructor(partial?: Partial<CreateUserDto>);
}
