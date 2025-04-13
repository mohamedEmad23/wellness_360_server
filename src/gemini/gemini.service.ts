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
      generationConfig: {
        temperature: 0.2, // Lower temperature for more consistent, structured output
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8000,
      },
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
   * Uses special system prompts to ensure consistent output format
   */
  async generateStructuredWorkoutPlan(prompt: string): Promise<any> {
    try {
      // System prompt specifically designed to get well-formed JSON
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

      // Set higher temperature for diversity but enforce strict response format
      const generationResult = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: structuredPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
        },
      });

      const responseText = generationResult.response.text();

      // Try to parse the JSON response
      try {
        const jsonObject = JSON.parse(responseText);

        // Validate the structure
        if (!this.validateWorkoutPlanStructure(jsonObject)) {
          throw new Error(
            'Generated workout plan does not match required structure',
          );
        }

        return jsonObject;
      } catch (parseError) {
        this.logger.error('Error parsing JSON response', parseError);

        // Try to extract JSON from the response if it's wrapped in markdown code blocks or has additional text
        const jsonMatch =
          responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
          responseText.match(/```\s*([\s\S]*?)\s*```/) ||
          responseText.match(/{[\s\S]*?}/);

        if (jsonMatch) {
          const extractedJson = jsonMatch[1] || jsonMatch[0];
          try {
            const parsedJson = JSON.parse(extractedJson.trim());

            // Validate structure even for extracted JSON
            if (!this.validateWorkoutPlanStructure(parsedJson)) {
              throw new Error(
                'Extracted workout plan does not match required structure',
              );
            }

            return parsedJson;
          } catch (e) {
            this.logger.error('Failed to parse extracted JSON', e);
            throw new Error('Could not parse workout plan JSON: ' + e.message);
          }
        } else {
          throw new Error(
            'Response did not contain valid JSON: ' + parseError.message,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error generating structured workout plan', error);
      throw new Error(
        `Failed to generate structured workout plan: ${error.message}`,
      );
    }
  }

  /**
   * Validates that the generated workout plan matches the expected structure
   */
  private validateWorkoutPlanStructure(plan: any): boolean {
    if (!plan || typeof plan !== 'object') return false;
    if (!plan.name || typeof plan.name !== 'string') return false;
    if (!plan.description || typeof plan.description !== 'string') return false;
    if (!Array.isArray(plan.workoutDays) || plan.workoutDays.length === 0)
      return false;

    // Validate each workout day
    for (const day of plan.workoutDays) {
      if (!day.day || typeof day.day !== 'string') return false;
      if (!day.focus || typeof day.focus !== 'string') return false;
      if (!Array.isArray(day.exercises) || day.exercises.length === 0)
        return false;

      // Validate each exercise
      for (const exercise of day.exercises) {
        if (!exercise.name || typeof exercise.name !== 'string') return false;
        if (!exercise.sets || typeof exercise.sets !== 'number') return false;
        if (!exercise.reps || typeof exercise.reps !== 'string') return false;
        if (!Array.isArray(exercise.targetMuscles)) return false;
        if (!Array.isArray(exercise.requiredEquipment)) return false;
      }
    }

    return true;
  }
}
