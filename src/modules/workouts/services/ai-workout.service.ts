import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateWorkoutPlanDto } from '../dto/generate-workout-plan.dto';
import { FitnessProfile } from '../interfaces/fitness-profile.interface';
import { WorkoutDay, WorkoutPlan } from '../interfaces/workout-plan.interface';
import { GeminiService } from '../../gemini/gemini.service';

@Injectable()
export class AiWorkoutService {

  constructor(
    private readonly geminiService: GeminiService,
  ) {}

  async generateWorkoutPlan(
    requestDto: GenerateWorkoutPlanDto,
    fitnessProfile?: FitnessProfile,
  ): Promise<Partial<WorkoutPlan>> {
    try {
      const aiPrompt = this.buildWorkoutPrompt(requestDto, fitnessProfile);
      const workoutPlanData = await this.callAiService(aiPrompt);
      const workoutPlan = this.parseAiWorkoutResponse(workoutPlanData, requestDto);

      return {
        ...workoutPlan,
        isAiGenerated: true,
      };
    } catch (error) {
      throw error;
    }
  }

  private buildWorkoutPrompt(
    requestDto: GenerateWorkoutPlanDto,
    fitnessProfile?: FitnessProfile,
  ): string {
    const userContext = fitnessProfile ? `
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
    ` : '';

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

    Make the plan progressive over the weeks, increasing intensity appropriately based on the difficulty level.`;
  }

  private async callAiService(prompt: string): Promise<any> {
    try {
      return await this.geminiService.generateStructuredWorkoutPlan(prompt);
    } catch (error) {
      throw new Error(`Failed to generate workout plan: ${error.message}`);
    }
  }

  private parseAiWorkoutResponse(
    aiResponse: any,
    requestDto: GenerateWorkoutPlanDto,
  ): Partial<WorkoutPlan> {
    try {
      const workoutPlan = aiResponse;

      if (!workoutPlan.name || !Array.isArray(workoutPlan.workoutDays)) {
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
    } catch (error) {
      throw new Error('Failed to parse AI-generated workout plan');
    }
  }

  private normalizeWorkoutDays(workoutDays: any[]): WorkoutDay[] {
    return workoutDays.map((day) => ({
      day: day.day || 'Workout Day',
      focus: day.focus || 'Full Body',
      warmup: day.warmup || 'Light cardio and dynamic stretching for 5 minutes',
      exercises: (day.exercises || []).map((exercise) => ({
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
      })),
      cooldown: day.cooldown || 'Static stretching for 5 minutes',
      duration: day.duration || 45,
      notes: day.notes || '',
    }));
  }

  private planRequiresEquipment(workoutDays: WorkoutDay[]): boolean {
    return workoutDays.some((day) =>
      day.exercises.some((exercise) =>
        (exercise.requiredEquipment || []).some((item) =>
          !['none', 'bodyweight', 'body weight', 'no equipment'].includes(
            item.toLowerCase(),
          ),
        ),
      ),
    );
  }

  private getRequiredEquipment(workoutDays: WorkoutDay[]): string[] {
    const equipmentSet = new Set<string>();

    workoutDays.forEach((day) => {
      day.exercises.forEach((exercise) => {
        (exercise.requiredEquipment || [])
          .filter((item) =>
            !['none', 'bodyweight', 'body weight', 'no equipment'].includes(
              item.toLowerCase(),
            ),
          )
          .forEach((item) => equipmentSet.add(item));
      });
    });

    return Array.from(equipmentSet);
  }
}
