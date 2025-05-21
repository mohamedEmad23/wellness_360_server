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
          "description": "Exercise description including specific form cues and detailed instructions",
          "sets": 3,
          "reps": "8-12",
          "restBetweenSets": "60 seconds",
          "targetMuscles": ["muscle1", "muscle2"],
          "requiredEquipment": ["equipment1", "equipment2"],
          "notes": "Additional notes, form tips, and variations"
        }
      ],
      "cooldown": "Cooldown description",
      "duration": 45,
      "notes": "Additional notes"
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Create a complete 7-DAY WORKOUT PLAN with exactly 7 days (Day 1 through Day 7)
2. Include appropriate rest or active recovery days as part of the 7-day plan
3. For rest days, include the day, focus as "Rest and Recovery", and notes for recovery activities
4. The plan must include all 7 days of the week, not just workout days

Generate a scientifically-based, progressive workout plan following these requirements:
${prompt}

The plan should be comprehensive, with each exercise having detailed descriptions including:
1. Starting position
2. Movement pattern
3. Breathing instructions
4. Common mistakes to avoid
5. Progression variations
6. Specific form cues

Rest days should be strategically placed based on muscle groups worked. Include progressive overload principles.

IMPORTANT: Return a JSON object that exactly matches the structure shown above, with NO ADDITIONAL text, comments, code blocks or explanations. ONLY RETURN VALID, PARSEABLE JSON with EXACTLY 7 days.`;

      const generationResult = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: structuredPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          responseMimeType: 'application/json',
        },
      });

      const responseText = generationResult.response.text();
      
      try {
        const parsedResponse = JSON.parse(responseText);
        
        // Verify that we have exactly 7 days
        if (!parsedResponse.workoutDays || parsedResponse.workoutDays.length !== 7) {
          this.logger.warn(`AI returned ${parsedResponse.workoutDays?.length || 0} days instead of 7. Adjusting...`);
          
          // Initialize workout days if missing
          if (!parsedResponse.workoutDays) {
            parsedResponse.workoutDays = [];
          }
          
          // Add days until we have 7
          while (parsedResponse.workoutDays.length < 7) {
            const dayNumber = parsedResponse.workoutDays.length + 1;
            parsedResponse.workoutDays.push({
              day: `Day ${dayNumber}`,
              focus: "Rest and Recovery",
              warmup: "Light stretching and mobility work",
              exercises: [],
              cooldown: "Foam rolling and static stretching",
              duration: 20,
              notes: "Rest days are crucial for recovery and muscle growth. Stay hydrated and focus on good nutrition."
            });
          }
          
          // Truncate if we somehow have more than 7 days
          if (parsedResponse.workoutDays.length > 7) {
            parsedResponse.workoutDays = parsedResponse.workoutDays.slice(0, 7);
          }
        }
        
        return parsedResponse;
      } catch (parseError) {
        this.logger.error('Error parsing AI response as JSON', parseError);
        throw new Error('Invalid JSON format in AI response');
      }
    } catch (error) {
      this.logger.error('Error generating structured workout plan', error);
      throw new Error(
        `Failed to generate structured workout plan: ${error.message}`,
      );
    }
  }
}
