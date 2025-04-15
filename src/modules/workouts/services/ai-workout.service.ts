import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateWorkoutPlanDto } from '../dto/generate-workout-plan.dto';
import { FitnessProfile } from '../interfaces/fitness-profile.interface';
import { WorkoutDay, WorkoutPlan } from '../interfaces/workout-plan.interface';
import { GeminiService } from '../../gemini/gemini.service';

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

  /**
   * Calls the AI service with the generated prompt
   */
  private async callAiService(prompt: string): Promise<any> {
    try {
      // Use the Gemini service to generate a structured workout plan
      return await this.geminiService.generateStructuredWorkoutPlan(prompt);
    } catch (error) {
      this.logger.error('Error calling AI service:', error);
      throw new Error(`Failed to generate workout plan: ${error.message}`);
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
      // If the response is already a parsed object, use it directly
      const workoutPlan = aiResponse;

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
        workoutDays: this.normalizeWorkoutDays(workoutPlan.workoutDays),
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
   * Normalizes workout days to ensure all have a consistent structure
   */
  private normalizeWorkoutDays(workoutDays: any[]): WorkoutDay[] {
    return workoutDays.map((day) => {
      // Ensure all required fields are present with defaults if missing
      return {
        day: day.day || 'Workout Day',
        focus: day.focus || 'Full Body',
        warmup:
          day.warmup || 'Light cardio and dynamic stretching for 5 minutes',
        exercises:
          day.exercises?.map((exercise) => ({
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
}
