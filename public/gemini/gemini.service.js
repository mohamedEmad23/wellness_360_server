"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GeminiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const GEMINI_MODEL = 'gemini-1.5-flash';
const SESSION_TIMEOUT = 30 * 60 * 1000;
let GeminiService = GeminiService_1 = class GeminiService {
    constructor(configService) {
        this.chatSessions = {};
        this.logger = new common_1.Logger(GeminiService_1.name);
        const geminiApiKey = configService.get('GEMINI_API_KEY');
        if (!geminiApiKey) {
            this.logger.warn('GEMINI_API_KEY not found in environment variables');
        }
        this.googleAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
        this.model = this.googleAI.getGenerativeModel({
            model: GEMINI_MODEL,
        });
        this.cleanupInterval = setInterval(() => this.cleanupSessions(), 10 * 60 * 1000);
    }
    onModuleDestroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
    getChatSession(sessionId) {
        let sessionIdToUse = sessionId ?? (0, uuid_1.v4)();
        let sessionData = this.chatSessions[sessionIdToUse];
        if (!sessionData) {
            sessionData = {
                session: this.model.startChat(),
                lastUsed: Date.now(),
            };
            this.chatSessions[sessionIdToUse] = sessionData;
        }
        else {
            sessionData.lastUsed = Date.now();
        }
        return {
            sessionId: sessionIdToUse,
            chatSession: sessionData.session,
        };
    }
    cleanupSessions() {
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
    async generateContent(data) {
        try {
            const { sessionId, chatSession } = this.getChatSession(data.sessionId);
            const response = await chatSession.sendMessage(data.prompt);
            return {
                sessionId,
                response: await response.response.text(),
            };
        }
        catch (error) {
            this.logger.error('Error generating content', error);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }
    async generateWorkoutPlan(prompt) {
        try {
            const generationResult = await this.model.generateContent(prompt);
            return generationResult.response.text();
        }
        catch (error) {
            this.logger.error('Error generating workout plan', error);
            throw new Error(`Failed to generate workout plan: ${error.message}`);
        }
    }
    async generateStructuredWorkoutPlan(prompt) {
        try {
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
            const generationResult = await this.model.generateContent(structuredPrompt);
            const responseText = generationResult.response.text();
            try {
                return JSON.parse(responseText);
            }
            catch (parseError) {
                this.logger.error('Error parsing JSON response', parseError);
                const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                    responseText.match(/```\n([\s\S]*?)\n```/) ||
                    responseText.match(/{[\s\S]*?}/);
                if (jsonMatch) {
                    try {
                        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
                    }
                    catch (e) {
                        throw new Error('Could not parse workout plan JSON');
                    }
                }
                else {
                    throw new Error('Response did not contain valid JSON');
                }
            }
        }
        catch (error) {
            this.logger.error('Error generating structured workout plan', error);
            throw new Error(`Failed to generate structured workout plan: ${error.message}`);
        }
    }
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = GeminiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiService);
//# sourceMappingURL=gemini.service.js.map