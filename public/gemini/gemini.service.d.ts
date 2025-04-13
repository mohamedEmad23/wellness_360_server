import { ConfigService } from '@nestjs/config';
import { GetAIMessageDTO } from './model/get-ai-response.dto';
export declare class GeminiService {
    private readonly googleAI;
    private readonly model;
    private chatSessions;
    private readonly logger;
    private cleanupInterval;
    constructor(configService: ConfigService);
    onModuleDestroy(): void;
    private getChatSession;
    private cleanupSessions;
    generateContent(data: GetAIMessageDTO): Promise<{
        sessionId: string;
        response: string;
    }>;
    generateWorkoutPlan(prompt: string): Promise<string>;
    generateStructuredWorkoutPlan(prompt: string): Promise<any>;
    private validateWorkoutPlanStructure;
}
