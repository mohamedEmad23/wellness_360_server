export declare class RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    gender?: 'male' | 'female';
    dob?: Date;
    age?: number;
    height: number;
    weight: number;
    activityLevel?: string;
    goal?: 'lose' | 'maintain' | 'gain';
    dailyCalories?: number;
    caloriesLeft?: number;
    constructor(partial?: Partial<RegisterDto>);
}
