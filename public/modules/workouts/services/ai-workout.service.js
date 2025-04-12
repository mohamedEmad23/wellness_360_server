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
    
    Please create a structured workout plan that includes:
    1. A name and brief description for the overall plan
    2. For each workout day:
       - Day designation (e.g., "Day 1" or "Monday")
       - Focus area (e.g., "Upper Body", "Lower Body", "Full Body", "Cardio", etc.)
       - Warm-up activities
       - A sequence of exercises with sets, reps (or time), and rest periods
       - Cooldown activities
       - Total expected duration
    3. For each exercise:
       - Name
       - Brief description of proper form
       - Sets, reps/time
       - Rest between sets
       - Target muscles
       - Required equipment (if any)
    `;
    }
    async callAiService(prompt) {
        try {
            return await this.geminiService.generateStructuredWorkoutPlan(prompt);
        }
        catch (error) {
            this.logger.error('Error calling AI service:', error);
            this.logger.warn('Falling back to mock workout plan data');
            return this.getMockWorkoutResponse();
        }
    }
    parseAiWorkoutResponse(aiResponse, requestDto) {
        try {
            const workoutPlan = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
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
                workoutDays: workoutPlan.workoutDays,
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
    getMockWorkoutResponse() {
        return {
            name: 'Progressive Strength Building Plan',
            description: 'A 4-week progressive strength training program designed to build overall strength and muscle definition. Each week increases in intensity to ensure continuous progress.',
            workoutDays: [
                {
                    day: 'Day 1',
                    focus: 'Upper Body',
                    warmup: '5 minutes of light cardio followed by arm circles, shoulder rotations, and push-up preps',
                    exercises: [
                        {
                            name: 'Push-ups',
                            description: 'Start in a plank position with hands shoulder-width apart. Lower body until chest nearly touches the floor, then push back up.',
                            sets: 3,
                            reps: '8-12',
                            restBetweenSets: '60 seconds',
                            targetMuscles: ['chest', 'shoulders', 'triceps'],
                            requiredEquipment: ['none'],
                        },
                        {
                            name: 'Dumbbell Rows',
                            description: 'Bend at waist with one knee on bench, pull dumbbell up to side of body keeping elbow close to torso.',
                            sets: 3,
                            reps: '10 per arm',
                            restBetweenSets: '60 seconds',
                            targetMuscles: ['back', 'biceps'],
                            requiredEquipment: ['dumbbells', 'bench'],
                        },
                        {
                            name: 'Overhead Press',
                            description: 'Stand with feet shoulder-width apart, press dumbbells overhead until arms are fully extended.',
                            sets: 3,
                            reps: '8-10',
                            restBetweenSets: '90 seconds',
                            targetMuscles: ['shoulders', 'triceps'],
                            requiredEquipment: ['dumbbells'],
                        },
                        {
                            name: 'Bicep Curls',
                            description: 'Stand with dumbbells at sides, palms facing forward. Curl weights toward shoulders.',
                            sets: 3,
                            reps: '10-12',
                            restBetweenSets: '60 seconds',
                            targetMuscles: ['biceps'],
                            requiredEquipment: ['dumbbells'],
                        },
                        {
                            name: 'Tricep Dips',
                            description: 'Using a chair or bench, place hands on edge with fingers forward. Lower body by bending arms, then push back up.',
                            sets: 3,
                            reps: '10-15',
                            restBetweenSets: '60 seconds',
                            targetMuscles: ['triceps'],
                            requiredEquipment: ['bench or chair'],
                        },
                    ],
                    cooldown: '5 minutes of gentle stretching focusing on the chest, back, and arms',
                    duration: 45,
                    notes: 'Focus on proper form rather than lifting heavy. Increase weights gradually as you get stronger.',
                },
                {
                    day: 'Day 2',
                    focus: 'Lower Body',
                    warmup: '5 minutes of jumping jacks and high knees followed by leg swings and ankle rotations',
                    exercises: [
                        {
                            name: 'Goblet Squats',
                            description: 'Hold dumbbell close to chest, squat down with back straight until thighs are parallel to ground.',
                            sets: 4,
                            reps: '10-12',
                            restBetweenSets: '90 seconds',
                            targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
                            requiredEquipment: ['dumbbell or kettlebell'],
                        },
                        {
                            name: 'Romanian Deadlifts',
                            description: 'Stand with dumbbells in front of thighs, hinge at hips while keeping back straight, lowering weights along legs.',
                            sets: 3,
                            reps: '10-12',
                            restBetweenSets: '90 seconds',
                            targetMuscles: ['hamstrings', 'glutes', 'lower back'],
                            requiredEquipment: ['dumbbells'],
                        },
                        {
                            name: 'Walking Lunges',
                            description: 'Step forward into lunge position, lower back knee toward floor, then push up and forward into next lunge.',
                            sets: 3,
                            reps: '10 per leg',
                            restBetweenSets: '60 seconds',
                            targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
                            requiredEquipment: ['none'],
                        },
                        {
                            name: 'Calf Raises',
                            description: 'Stand with feet shoulder-width apart, raise heels off ground by extending ankles.',
                            sets: 3,
                            reps: '15-20',
                            restBetweenSets: '45 seconds',
                            targetMuscles: ['calves'],
                            requiredEquipment: ['none'],
                        },
                    ],
                    cooldown: '5 minutes of stretching focusing on the quadriceps, hamstrings, and calves',
                    duration: 40,
                    notes: 'Maintain proper posture throughout all exercises. For added intensity, hold dumbbells during lunges and calf raises.',
                },
                {
                    day: 'Day 3',
                    focus: 'Full Body & Core',
                    warmup: '5 minutes of jumping rope or jogging in place, followed by dynamic stretches',
                    exercises: [
                        {
                            name: 'Dumbbell Squat to Press',
                            description: 'Hold dumbbells at shoulder height, squat down, as you rise press weights overhead.',
                            sets: 3,
                            reps: '10-12',
                            restBetweenSets: '90 seconds',
                            targetMuscles: ['quadriceps', 'glutes', 'shoulders'],
                            requiredEquipment: ['dumbbells'],
                        },
                        {
                            name: 'Renegade Rows',
                            description: 'Start in push-up position with hands on dumbbells, perform a row by pulling one dumbbell up while balancing on the other arm.',
                            sets: 3,
                            reps: '8 per arm',
                            restBetweenSets: '60 seconds',
                            targetMuscles: ['back', 'core', 'shoulders'],
                            requiredEquipment: ['dumbbells'],
                        },
                        {
                            name: 'Plank',
                            description: 'Hold a forearm plank position with body in a straight line from head to heels.',
                            sets: 3,
                            reps: '30-60 seconds',
                            restBetweenSets: '45 seconds',
                            targetMuscles: ['core', 'shoulders'],
                            requiredEquipment: ['none'],
                        },
                        {
                            name: 'Russian Twists',
                            description: 'Sit with knees bent and feet off the floor, twist torso to touch the ground on each side.',
                            sets: 3,
                            reps: '20 total (10 per side)',
                            restBetweenSets: '45 seconds',
                            targetMuscles: ['obliques', 'core'],
                            requiredEquipment: ['dumbbell (optional)'],
                        },
                        {
                            name: 'Glute Bridges',
                            description: 'Lie on back with knees bent, lift hips toward ceiling by squeezing glutes.',
                            sets: 3,
                            reps: '15',
                            restBetweenSets: '45 seconds',
                            targetMuscles: ['glutes', 'hamstrings', 'lower back'],
                            requiredEquipment: ['none'],
                        },
                    ],
                    cooldown: '5-10 minutes of full body stretching',
                    duration: 45,
                    notes: "Focus on engaging your core throughout all exercises, even when it's not the primary muscle group being targeted.",
                },
            ],
        };
    }
};
exports.AiWorkoutService = AiWorkoutService;
exports.AiWorkoutService = AiWorkoutService = AiWorkoutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        gemini_service_1.GeminiService])
], AiWorkoutService);
//# sourceMappingURL=ai-workout.service.js.map