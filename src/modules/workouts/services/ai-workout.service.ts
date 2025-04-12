import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateWorkoutPlanDto } from '../dto/generate-workout-plan.dto';
import { FitnessProfile } from '../interfaces/fitness-profile.interface';
import {
  Exercise,
  WorkoutDay,
  WorkoutPlan,
} from '../interfaces/workout-plan.interface';
import { GeminiService } from '../../../gemini/gemini.service';

@Injectable()
export class AiWorkoutService {
  private readonly logger = new Logger(AiWorkoutService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Generates a workout plan using AI based on user preferences and goals
   */
  async generateWorkoutPlan(
    requestDto: GenerateWorkoutPlanDto,
    fitnessProfile?: FitnessProfile,
  ): Promise<Partial<WorkoutPlan>> {
    try {
      // Combine request DTO with fitness profile data if available
      const aiPrompt = this.buildWorkoutPrompt(requestDto, fitnessProfile);

      // Call AI service to generate workout plan
      const workoutPlanData = await this.callAiService(aiPrompt);

      // Parse and validate the AI response
      const workoutPlan = this.parseAiWorkoutResponse(
        workoutPlanData,
        requestDto,
      );

      return {
        ...workoutPlan,
        isAiGenerated: true,
      };
    } catch (error) {
      this.logger.error('Error generating workout plan:', error);
      throw error;
    }
  }

  /**
   * Builds a detailed prompt for the AI service based on user preferences and goals
   */
  private buildWorkoutPrompt(
    requestDto: GenerateWorkoutPlanDto,
    fitnessProfile?: FitnessProfile,
  ): string {
    // Combine workout request with user profile if available
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

    // Build the main prompt
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

  /**
   * Calls the AI service with the generated prompt
   */
  private async callAiService(prompt: string): Promise<any> {
    try {
      // Use the Gemini service to generate a structured workout plan
      return await this.geminiService.generateStructuredWorkoutPlan(prompt);
    } catch (error) {
      this.logger.error('Error calling AI service:', error);

      // Fallback to mock data if Gemini fails (useful for development/testing)
      this.logger.warn('Falling back to mock workout plan data');
      return this.getMockWorkoutResponse();
    }
  }

  /**
   * Parses and validates the AI response
   */
  private parseAiWorkoutResponse(
    aiResponse: any,
    requestDto: GenerateWorkoutPlanDto,
  ): Partial<WorkoutPlan> {
    try {
      // If the response is a string (JSON), parse it
      const workoutPlan =
        typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;

      // Basic validation - ensure it has required fields
      if (
        !workoutPlan.name ||
        !workoutPlan.workoutDays ||
        !Array.isArray(workoutPlan.workoutDays)
      ) {
        throw new Error('Invalid workout plan format returned from AI');
      }

      // Additional validation and data transformation as needed
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
    } catch (error) {
      this.logger.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI-generated workout plan');
    }
  }

  /**
   * Determines if the workout plan requires equipment
   */
  private planRequiresEquipment(workoutDays: WorkoutDay[]): boolean {
    for (const day of workoutDays) {
      for (const exercise of day.exercises) {
        if (
          exercise.requiredEquipment &&
          exercise.requiredEquipment.length > 0
        ) {
          // Filter out "bodyweight" or "none" from required equipment
          const filteredEquipment = exercise.requiredEquipment.filter(
            (item) =>
              !['none', 'bodyweight', 'body weight', 'no equipment'].includes(
                item.toLowerCase(),
              ),
          );
          if (filteredEquipment.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Gets a unique list of all equipment required for the plan
   */
  private getRequiredEquipment(workoutDays: WorkoutDay[]): string[] {
    const equipmentSet = new Set<string>();

    for (const day of workoutDays) {
      for (const exercise of day.exercises) {
        if (
          exercise.requiredEquipment &&
          exercise.requiredEquipment.length > 0
        ) {
          // Filter out "bodyweight" or "none" from required equipment
          const filteredEquipment = exercise.requiredEquipment.filter(
            (item) =>
              !['none', 'bodyweight', 'body weight', 'no equipment'].includes(
                item.toLowerCase(),
              ),
          );
          filteredEquipment.forEach((item) => equipmentSet.add(item));
        }
      }
    }

    return Array.from(equipmentSet);
  }

  /**
   * Mock workout response for development/testing
   * In production, this would be replaced by the actual AI service response
   */
  private getMockWorkoutResponse(): any {
    return {
      name: 'Progressive Strength Building Plan',
      description:
        'A 4-week progressive strength training program designed to build overall strength and muscle definition. Each week increases in intensity to ensure continuous progress.',
      workoutDays: [
        {
          day: 'Day 1',
          focus: 'Upper Body',
          warmup:
            '5 minutes of light cardio followed by arm circles, shoulder rotations, and push-up preps',
          exercises: [
            {
              name: 'Push-ups',
              description:
                'Start in a plank position with hands shoulder-width apart. Lower body until chest nearly touches the floor, then push back up.',
              sets: 3,
              reps: '8-12',
              restBetweenSets: '60 seconds',
              targetMuscles: ['chest', 'shoulders', 'triceps'],
              requiredEquipment: ['none'],
            },
            {
              name: 'Dumbbell Rows',
              description:
                'Bend at waist with one knee on bench, pull dumbbell up to side of body keeping elbow close to torso.',
              sets: 3,
              reps: '10 per arm',
              restBetweenSets: '60 seconds',
              targetMuscles: ['back', 'biceps'],
              requiredEquipment: ['dumbbells', 'bench'],
            },
            {
              name: 'Overhead Press',
              description:
                'Stand with feet shoulder-width apart, press dumbbells overhead until arms are fully extended.',
              sets: 3,
              reps: '8-10',
              restBetweenSets: '90 seconds',
              targetMuscles: ['shoulders', 'triceps'],
              requiredEquipment: ['dumbbells'],
            },
            {
              name: 'Bicep Curls',
              description:
                'Stand with dumbbells at sides, palms facing forward. Curl weights toward shoulders.',
              sets: 3,
              reps: '10-12',
              restBetweenSets: '60 seconds',
              targetMuscles: ['biceps'],
              requiredEquipment: ['dumbbells'],
            },
            {
              name: 'Tricep Dips',
              description:
                'Using a chair or bench, place hands on edge with fingers forward. Lower body by bending arms, then push back up.',
              sets: 3,
              reps: '10-15',
              restBetweenSets: '60 seconds',
              targetMuscles: ['triceps'],
              requiredEquipment: ['bench or chair'],
            },
          ],
          cooldown:
            '5 minutes of gentle stretching focusing on the chest, back, and arms',
          duration: 45,
          notes:
            'Focus on proper form rather than lifting heavy. Increase weights gradually as you get stronger.',
        },
        {
          day: 'Day 2',
          focus: 'Lower Body',
          warmup:
            '5 minutes of jumping jacks and high knees followed by leg swings and ankle rotations',
          exercises: [
            {
              name: 'Goblet Squats',
              description:
                'Hold dumbbell close to chest, squat down with back straight until thighs are parallel to ground.',
              sets: 4,
              reps: '10-12',
              restBetweenSets: '90 seconds',
              targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
              requiredEquipment: ['dumbbell or kettlebell'],
            },
            {
              name: 'Romanian Deadlifts',
              description:
                'Stand with dumbbells in front of thighs, hinge at hips while keeping back straight, lowering weights along legs.',
              sets: 3,
              reps: '10-12',
              restBetweenSets: '90 seconds',
              targetMuscles: ['hamstrings', 'glutes', 'lower back'],
              requiredEquipment: ['dumbbells'],
            },
            {
              name: 'Walking Lunges',
              description:
                'Step forward into lunge position, lower back knee toward floor, then push up and forward into next lunge.',
              sets: 3,
              reps: '10 per leg',
              restBetweenSets: '60 seconds',
              targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
              requiredEquipment: ['none'],
            },
            {
              name: 'Calf Raises',
              description:
                'Stand with feet shoulder-width apart, raise heels off ground by extending ankles.',
              sets: 3,
              reps: '15-20',
              restBetweenSets: '45 seconds',
              targetMuscles: ['calves'],
              requiredEquipment: ['none'],
            },
          ],
          cooldown:
            '5 minutes of stretching focusing on the quadriceps, hamstrings, and calves',
          duration: 40,
          notes:
            'Maintain proper posture throughout all exercises. For added intensity, hold dumbbells during lunges and calf raises.',
        },
        {
          day: 'Day 3',
          focus: 'Full Body & Core',
          warmup:
            '5 minutes of jumping rope or jogging in place, followed by dynamic stretches',
          exercises: [
            {
              name: 'Dumbbell Squat to Press',
              description:
                'Hold dumbbells at shoulder height, squat down, as you rise press weights overhead.',
              sets: 3,
              reps: '10-12',
              restBetweenSets: '90 seconds',
              targetMuscles: ['quadriceps', 'glutes', 'shoulders'],
              requiredEquipment: ['dumbbells'],
            },
            {
              name: 'Renegade Rows',
              description:
                'Start in push-up position with hands on dumbbells, perform a row by pulling one dumbbell up while balancing on the other arm.',
              sets: 3,
              reps: '8 per arm',
              restBetweenSets: '60 seconds',
              targetMuscles: ['back', 'core', 'shoulders'],
              requiredEquipment: ['dumbbells'],
            },
            {
              name: 'Plank',
              description:
                'Hold a forearm plank position with body in a straight line from head to heels.',
              sets: 3,
              reps: '30-60 seconds',
              restBetweenSets: '45 seconds',
              targetMuscles: ['core', 'shoulders'],
              requiredEquipment: ['none'],
            },
            {
              name: 'Russian Twists',
              description:
                'Sit with knees bent and feet off the floor, twist torso to touch the ground on each side.',
              sets: 3,
              reps: '20 total (10 per side)',
              restBetweenSets: '45 seconds',
              targetMuscles: ['obliques', 'core'],
              requiredEquipment: ['dumbbell (optional)'],
            },
            {
              name: 'Glute Bridges',
              description:
                'Lie on back with knees bent, lift hips toward ceiling by squeezing glutes.',
              sets: 3,
              reps: '15',
              restBetweenSets: '45 seconds',
              targetMuscles: ['glutes', 'hamstrings', 'lower back'],
              requiredEquipment: ['none'],
            },
          ],
          cooldown: '5-10 minutes of full body stretching',
          duration: 45,
          notes:
            "Focus on engaging your core throughout all exercises, even when it's not the primary muscle group being targeted.",
        },
      ],
    };
  }
}
