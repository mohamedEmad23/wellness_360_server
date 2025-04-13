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
var AiWorkoutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiWorkoutService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const gemini_service_1 = require("../../../gemini/gemini.service");
let AiWorkoutService = AiWorkoutService_1 = class AiWorkoutService {
    constructor(configService, geminiService) {
        this.configService = configService;
        this.geminiService = geminiService;
        this.logger = new common_1.Logger(AiWorkoutService_1.name);
    }
    async generateWorkoutPlan(requestDto, fitnessProfile) {
        try {
            const aiPrompt = this.buildWorkoutPrompt(requestDto, fitnessProfile);
            const workoutPlanData = await this.callAiService(aiPrompt);
            const workoutPlan = this.parseAiWorkoutResponse(workoutPlanData, requestDto);
            return {
                ...workoutPlan,
                isAiGenerated: true,
            };
        }
        catch (error) {
            this.logger.error('Error generating workout plan:', error);
            throw error;
        }
    }
    buildWorkoutPrompt(requestDto, fitnessProfile) {
        const userContext = fitnessProfile
            ? `
      User Profile:
      - Fitness Level: ${fitnessProfile.fitnessLevel}
      - Fitness Goals: ${fitnessProfile.fitnessGoals.join(', ')}
      - Preferred Activities: ${fitnessProfile.preferredActivities.join(', ')}
      - Available Equipment: ${fitnessProfile.availableEquipment.join(', ')}
      - Has Gym Access: ${fitnessProfile.hasGymAccess ? 'Yes' : 'No'}
      - Workout Days Per Week: ${fitnessProfile.availableWorkoutDays}
      - Preferred Workout Duration: ${fitnessProfile.preferredWorkoutDuration} minutes
      ${fitnessProfile.hasInjuries ? `- Injuries/Limitations: ${fitnessProfile.injuries.join(', ')}` : ''}
      ${fitnessProfile.height ? `- Height: ${fitnessProfile.height} cm` : ''}
      ${fitnessProfile.weight ? `- Weight: ${fitnessProfile.weight} kg` : ''}
      ${fitnessProfile.targetWeight ? `- Target Weight: ${fitnessProfile.targetWeight} kg` : ''}
    `
            : '';
        return `
    Generate a detailed ${requestDto.workoutType} workout plan with the following characteristics:
    
    ${userContext}
    
    Request Details:
    - Workout Type: ${requestDto.workoutType}
    - Difficulty Level: ${requestDto.difficulty}
    - Primary Goals: ${requestDto.goals.join(', ')}
    ${requestDto.targetAreas ? `- Target Areas: ${requestDto.targetAreas.join(', ')}` : ''}
    - Plan Duration: ${requestDto.duration} weeks
    - Workout Frequency: ${requestDto.daysPerWeek} days per week
    - Session Duration: ${requestDto.workoutDuration} minutes
    ${requestDto.availableEquipment ? `- Available Equipment: ${requestDto.availableEquipment.join(', ')}` : ''}
    ${requestDto.limitations ? `- Injuries/Limitations: ${requestDto.limitations.join(', ')}` : ''}
    - Gym Access: ${requestDto.hasGymAccess ? 'Yes' : 'No'}
    
    Make sure all workout days have a consistent structure with:
    1. The day designation (like "Day 1")
    2. A focus area for that day
    3. A warm-up section
    4. A list of exercises with sets, reps, rest periods, target muscles and required equipment
    5. A cooldown section
    6. Total duration in minutes
    7. Any helpful notes for that day's workout
    
    Make the plan progressive over the weeks, increasing intensity appropriately based on the difficulty level.
    `;
    }
    async callAiService(prompt) {
        try {
            return await this.geminiService.generateStructuredWorkoutPlan(prompt);
        }
        catch (error) {
            this.logger.error('Error calling AI service:', error);
            throw new Error(`Failed to generate workout plan: ${error.message}`);
        }
    }
    parseAiWorkoutResponse(aiResponse, requestDto) {
        try {
            const workoutPlan = aiResponse;
            if (!workoutPlan.name ||
                !workoutPlan.workoutDays ||
                !Array.isArray(workoutPlan.workoutDays)) {
                throw new Error('Invalid workout plan format returned from AI');
            }
            return {
                name: workoutPlan.name,
                description: workoutPlan.description,
                type: requestDto.workoutType,
                difficulty: requestDto.difficulty,
                goals: requestDto.goals,
                targetAreas: requestDto.targetAreas || [],
                workoutDays: this.normalizeWorkoutDays(workoutPlan.workoutDays),
                duration: requestDto.duration,
                averageWorkoutTime: requestDto.workoutDuration,
                requiresEquipment: this.planRequiresEquipment(workoutPlan.workoutDays),
                requiredEquipment: this.getRequiredEquipment(workoutPlan.workoutDays),
            };
        }
        catch (error) {
            this.logger.error('Error parsing AI response:', error);
            throw new Error('Failed to parse AI-generated workout plan');
        }
    }
    normalizeWorkoutDays(workoutDays) {
        return workoutDays.map((day) => {
            return {
                day: day.day || 'Workout Day',
                focus: day.focus || 'Full Body',
                warmup: day.warmup || 'Light cardio and dynamic stretching for 5 minutes',
                exercises: day.exercises?.map((exercise) => ({
                    name: exercise.name,
                    description: exercise.description || '',
                    sets: exercise.sets || 3,
                    reps: exercise.reps || '8-12',
                    restBetweenSets: exercise.restBetweenSets || '60 seconds',
                    targetMuscles: exercise.targetMuscles || [],
                    requiredEquipment: exercise.requiredEquipment || [],
                    notes: exercise.notes || '',
                    imageUrl: exercise.imageUrl || '',
                    videoUrl: exercise.videoUrl || '',
                })) || [],
                cooldown: day.cooldown || 'Static stretching for 5 minutes',
                duration: day.duration || 45,
                notes: day.notes || '',
            };
        });
    }
    planRequiresEquipment(workoutDays) {
        for (const day of workoutDays) {
            for (const exercise of day.exercises) {
                if (exercise.requiredEquipment &&
                    exercise.requiredEquipment.length > 0) {
                    const filteredEquipment = exercise.requiredEquipment.filter((item) => !['none', 'bodyweight', 'body weight', 'no equipment'].includes(item.toLowerCase()));
                    if (filteredEquipment.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    getRequiredEquipment(workoutDays) {
        const equipmentSet = new Set();
        for (const day of workoutDays) {
            for (const exercise of day.exercises) {
                if (exercise.requiredEquipment &&
                    exercise.requiredEquipment.length > 0) {
                    const filteredEquipment = exercise.requiredEquipment.filter((item) => !['none', 'bodyweight', 'body weight', 'no equipment'].includes(item.toLowerCase()));
                    filteredEquipment.forEach((item) => equipmentSet.add(item));
                }
            }
        }
        return Array.from(equipmentSet);
    }
};
exports.AiWorkoutService = AiWorkoutService;
exports.AiWorkoutService = AiWorkoutService = AiWorkoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        gemini_service_1.GeminiService])
], AiWorkoutService);
//# sourceMappingURL=ai-workout.service.js.map