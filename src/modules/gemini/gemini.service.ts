import {
  ChatSession,
  GenerativeModel,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { GetAIMessageDTO } from './model/get-ai-response.dto';

const GEMINI_MODEL = 'gemini-1.5-flash';
const SESSION_TIMEOUT = 30 * 60 * 1000;

@Injectable()
export class GeminiService {
  private readonly googleAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private chatSessions: {
    [sessionId: string]: { session: ChatSession; lastUsed: number };
  } = {};
  private readonly logger = new Logger(GeminiService.name);
  private cleanupInterval: NodeJS.Timeout;

  constructor(configService: ConfigService) {
    const geminiApiKey = configService.get<string>('GEMINI_API_KEY');
    if (!geminiApiKey) {
      this.logger.warn('GEMINI_API_KEY not found in environment variables');
    }
    this.googleAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.googleAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8000,
      },
    });

    this.cleanupInterval = setInterval(
      () => this.cleanupSessions(),
      10 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  private getChatSession(sessionId?: string) {
    let sessionIdToUse = sessionId ?? v4();
    let sessionData = this.chatSessions[sessionIdToUse];

    if (!sessionData) {
      sessionData = {
        session: this.model.startChat(),
        lastUsed: Date.now(),
      };
      this.chatSessions[sessionIdToUse] = sessionData;
    } else {
      sessionData.lastUsed = Date.now();
    }

    return {
      sessionId: sessionIdToUse,
      chatSession: sessionData.session,
    };
  }

  private cleanupSessions() {
    const now = Date.now();
    let cleanupCount = 0;

    for (const sessionId in this.chatSessions) {
      if (now - this.chatSessions[sessionId].lastUsed > SESSION_TIMEOUT) {
        delete this.chatSessions[sessionId];
        cleanupCount++;
      }
    }

    if (cleanupCount > 0) {
      this.logger.debug(`Cleaned up ${cleanupCount} inactive chat sessions`);
    }
  }

  async generateContent(data: GetAIMessageDTO) {
    try {
      const { sessionId, chatSession } = this.getChatSession(data.sessionId);
      const response = await chatSession.sendMessage(data.prompt);
      return {
        sessionId,
        response: await response.response.text(),
      };
    } catch (error) {
      this.logger.error('Error generating content', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async generateWorkoutPlan(prompt: string): Promise<string> {
    try {
      const generationResult = await this.model.generateContent(prompt);
      return generationResult.response.text();
    } catch (error) {
      this.logger.error('Error generating workout plan', error);
      throw new Error(`Failed to generate workout plan: ${error.message}`);
    }
  }

  async generateStructuredWorkoutPlan(prompt: string): Promise<string> {
    try {
      const structuredPrompt = `
You are a fitness expert AI that generates workout plans. You must always respond with VALID JSON only.
The JSON must strictly follow this exact structure without ANY additional text or explanation:

{
  "name": "Name of Plan",
  "description": "Brief description of the plan",
  "workoutDays": [
    {
      "day": "Day 1",
      "focus": "Target area",
      "warmup": "Warmup description",
      "exercises": [
        {
          "name": "Exercise name",
          "description": "Exercise description",
          "sets": 3,
          "reps": "8-12",
          "restBetweenSets": "60 seconds",
          "targetMuscles": ["muscle1", "muscle2"],
          "requiredEquipment": ["equipment1", "equipment2"]
        }
      ],
      "cooldown": "Cooldown description",
      "duration": 45,
      "notes": "Additional notes"
    }
  ]
}

Generate a detailed workout plan based on the following requirements:
${prompt}

IMPORTANT: Return a JSON object that exactly matches the structure shown above, with NO ADDITIONAL text, comments, code blocks or explanations. ONLY RETURN VALID, PARSEABLE JSON.`;

      const generationResult = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: structuredPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          responseMimeType: 'application/json',
        },
      });

      const responseText = generationResult.response.text();
  
      return JSON.parse(responseText);
    } catch (error) {
      this.logger.error('Error generating structured workout plan', error);
      throw new Error(
        `Failed to generate structured workout plan: ${error.message}`,
      );
    }
  }
}
