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
// Session timeout in milliseconds (30 minutes)
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
    });

    // Setup session cleanup every 10 minutes
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
      // Update last used timestamp
      sessionData.lastUsed = Date.now();
    }

    return {
      sessionId: sessionIdToUse,
      chatSession: sessionData.session,
    };
  }

  /**
   * Cleanup inactive chat sessions to prevent memory leaks
   */
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

  /**
   * Generate content with the Gemini model
   */
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

  /**
   * Generate a workout plan using Gemini AI
   * This method is specifically for workout recommendations
   */
  async generateWorkoutPlan(prompt: string): Promise<string> {
    try {
      // Create a new session for each workout plan (no need to maintain session for one-off generations)
      const generationResult = await this.model.generateContent(prompt);
      return generationResult.response.text();
    } catch (error) {
      this.logger.error('Error generating workout plan', error);
      throw new Error(`Failed to generate workout plan: ${error.message}`);
    }
  }

  /**
   * Generate a structured workout plan with JSON output
   */
  async generateStructuredWorkoutPlan(prompt: string): Promise<any> {
    try {
      // Use a system prompt to ensure JSON output format
      const structuredPrompt = `
            You are a fitness expert AI that generates workout plans.
            Generate a detailed workout plan based on the following requirements:
            ${prompt}
            
            Format your response as a valid JSON object with the following structure:
            {
              "name": "Plan name",
              "description": "Plan description",
              "workoutDays": [
                {
                  "day": "Day 1",
                  "focus": "Target area",
                  "warmup": "Warmup description",
                  "exercises": [
                    {
                      "name": "Exercise name",
                      "description": "Exercise description",
                      "sets": number,
                      "reps": "rep range or time",
                      "restBetweenSets": "rest period",
                      "targetMuscles": ["muscle1", "muscle2"],
                      "requiredEquipment": ["equipment1", "equipment2"]
                    }
                  ],
                  "cooldown": "Cooldown description",
                  "duration": minutes,
                  "notes": "Additional notes"
                }
              ]
            }`;

      const generationResult =
        await this.model.generateContent(structuredPrompt);
      const responseText = generationResult.response.text();

      // Try to parse the JSON response
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error('Error parsing JSON response', parseError);
        // If we can't parse JSON, try to extract it from the text (Gemini sometimes adds explanations)
        const jsonMatch =
          responseText.match(/```json\n([\s\S]*?)\n```/) ||
          responseText.match(/```\n([\s\S]*?)\n```/) ||
          responseText.match(/{[\s\S]*?}/);

        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[1] || jsonMatch[0]);
          } catch (e) {
            throw new Error('Could not parse workout plan JSON');
          }
        } else {
          throw new Error('Response did not contain valid JSON');
        }
      }
    } catch (error) {
      this.logger.error('Error generating structured workout plan', error);
      throw new Error(
        `Failed to generate structured workout plan: ${error.message}`,
      );
    }
  }
}
