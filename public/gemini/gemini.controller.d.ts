import { GeminiService } from './gemini.service';
import { GetAIMessageDTO } from './model/get-ai-response.dto';
export declare class GeminiController {
    private readonly geminiService;
    constructor(geminiService: GeminiService);
    generateContent(data: GetAIMessageDTO): Promise<{
        sessionId: string;
        response: string;
    }>;
}
