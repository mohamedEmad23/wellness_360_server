import { ConfigService } from '@nestjs/config';
import { GenerateWorkoutPlanDto } from '../dto/generate-workout-plan.dto';
import { FitnessProfile } from '../interfaces/fitness-profile.interface';
import { WorkoutPlan } from '../interfaces/workout-plan.interface';
import { GeminiService } from '../../../gemini/gemini.service';
export declare class AiWorkoutService {
    private readonly configService;
    private readonly geminiService;
    private readonly logger;
    constructor(configService: ConfigService, geminiService: GeminiService);
    generateWorkoutPlan(requestDto: GenerateWorkoutPlanDto, fitnessProfile?: FitnessProfile): Promise<Partial<WorkoutPlan>>;
    private buildWorkoutPrompt;
    private callAiService;
    private parseAiWorkoutResponse;
    private planRequiresEquipment;
    private getRequiredEquipment;
    private getMockWorkoutResponse;
}
