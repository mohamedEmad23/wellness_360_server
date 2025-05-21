import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { GenerateWorkoutPlanDto } from '../dto/generate-workout-plan.dto';
import { FitnessProfile } from '../interfaces/fitness-profile.interface';
import { WorkoutDay, WorkoutPlan } from '../interfaces/workout-plan.interface';
import { GeminiService } from '../../gemini/gemini.service';
import { SleepLog } from '../../../infrastructure/database/schemas/sleepLog.schema';
import { FoodLog } from '../../../infrastructure/database/schemas/foodLog.schema';
import { UserActivity } from '../../../infrastructure/database/schemas/userActivity.schema';

@Injectable()
export class AiWorkoutService {
  private readonly logger = new Logger(AiWorkoutService.name);

  constructor(
    private readonly geminiService: GeminiService,
    @InjectModel(SleepLog.name) private sleepLogModel: Model<SleepLog>,
    @InjectModel(FoodLog.name) private foodLogModel: Model<FoodLog>,
    @InjectModel(UserActivity.name) private userActivityModel: Model<UserActivity>,
  ) {}

  async generateWorkoutPlan(
    requestDto: GenerateWorkoutPlanDto,
    fitnessProfile?: FitnessProfile,
    userId?: string,
  ): Promise<Partial<WorkoutPlan>> {
    try {
      // Get additional user data if userId is provided
      let sleepData = [];
      let nutritionData = [];
      let activityData = [];
      
      if (userId) {
        // Get the last 7 days of sleep data
        sleepData = await this.sleepLogModel
          .find({ userID: userId })
          .sort({ startTime: -1 })
          .limit(7)
          .exec();
          
        // Get the last 7 days of nutrition data
        nutritionData = await this.foodLogModel
          .find({ userId })
          .sort({ date: -1 })
          .limit(14)
          .exec();
          
        // Get the last 7 days of activity data
        activityData = await this.userActivityModel
          .find({ user: userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('activity', 'name met')
          .exec();
      }

      const aiPrompt = this.buildWorkoutPrompt(
        requestDto, 
        fitnessProfile, 
        sleepData, 
        nutritionData, 
        activityData
      );
      
      this.logger.debug(`Generated AI Prompt: ${aiPrompt}`);
      
      const workoutPlanData = await this.callAiService(aiPrompt);
      const workoutPlan = this.parseAiWorkoutResponse(workoutPlanData, requestDto);

      return {
        ...workoutPlan,
        isAiGenerated: true,
      };
    } catch (error) {
      this.logger.error(`Error generating workout plan: ${error.message}`, error.stack);
      throw error;
    }
  }

  private buildWorkoutPrompt(
    requestDto: GenerateWorkoutPlanDto,
    fitnessProfile?: FitnessProfile,
    sleepData?: any[],
    nutritionData?: any[],
    activityData?: any[],
  ): string {
    // Build user profile context
    const userContext = fitnessProfile ? `
      User Profile:
      - Age: ${fitnessProfile.age || 'Not specified'}
      - Gender: ${fitnessProfile.gender || 'Not specified'}
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

    // Process sleep data if available
    let sleepContext = '';
    if (sleepData && sleepData.length > 0) {
      const avgSleepDuration = sleepData.reduce((sum, log) => sum + log.duration, 0) / sleepData.length;
      const avgSleepRating = sleepData.reduce((sum, log) => sum + log.rating, 0) / sleepData.length;
      
      sleepContext = `
      Sleep Data (Last ${sleepData.length} days):
      - Average Sleep Duration: ${avgSleepDuration.toFixed(1)} hours
      - Average Sleep Quality: ${avgSleepRating.toFixed(1)}/5
      - Sleep Pattern: ${avgSleepDuration < 6 ? 'Insufficient' : avgSleepDuration < 7 ? 'Fair' : 'Good'}
      `;
    }

    // Process nutrition data if available
    let nutritionContext = '';
    if (nutritionData && nutritionData.length > 0) {
      const avgCalories = nutritionData.reduce((sum, log) => sum + log.calories, 0) / nutritionData.length;
      const avgProtein = nutritionData.reduce((sum, log) => sum + log.protein, 0) / nutritionData.length;
      const avgCarbs = nutritionData.reduce((sum, log) => sum + log.carbs, 0) / nutritionData.length;
      const avgFats = nutritionData.reduce((sum, log) => sum + log.fats, 0) / nutritionData.length;
      
      nutritionContext = `
      Nutrition Data (Last ${nutritionData.length} logs):
      - Average Daily Calories: ${avgCalories.toFixed(0)} kcal
      - Average Daily Protein: ${avgProtein.toFixed(0)} g
      - Average Daily Carbs: ${avgCarbs.toFixed(0)} g
      - Average Daily Fats: ${avgFats.toFixed(0)} g
      - Macro Ratio (P/C/F): ${Math.round((avgProtein * 4 / avgCalories) * 100)}% / ${Math.round((avgCarbs * 4 / avgCalories) * 100)}% / ${Math.round((avgFats * 9 / avgCalories) * 100)}%
      `;
    }

    // Process activity data if available
    let activityContext = '';
    if (activityData && activityData.length > 0) {
      const activities = activityData.map(a => a.activity.name);
      const uniqueActivities = [...new Set(activities)];
      const totalDuration = activityData.reduce((sum, a) => sum + a.duration, 0);
      const avgDuration = totalDuration / activityData.length;
      
      activityContext = `
      Recent Activity Data:
      - Recent Activities: ${uniqueActivities.join(', ')}
      - Average Workout Duration: ${avgDuration.toFixed(0)} minutes
      - Total Active Minutes (Last ${activityData.length} workouts): ${totalDuration} minutes
      `;
    }

    return `
    Generate a comprehensive 7-day ${requestDto.workoutType} workout plan with the following characteristics:
    
    ${userContext}
    ${sleepContext}
    ${nutritionContext}
    ${activityContext}
    
    Request Details:
    - Workout Type: ${requestDto.workoutType}
    - Difficulty Level: ${requestDto.difficulty}
    - Primary Goals: ${requestDto.goals.join(', ')}
    ${requestDto.targetAreas?.length ? `- Target Areas: ${requestDto.targetAreas.join(', ')}` : ''}
    - Plan Duration: ${requestDto.duration} weeks
    - Weekly Structure: Full 7-day plan (including appropriate rest/active recovery days)
    - Session Duration: ${requestDto.workoutDuration} minutes
    ${requestDto.availableEquipment?.length ? `- Available Equipment: ${requestDto.availableEquipment.join(', ')}` : ''}
    ${requestDto.limitations?.length ? `- Injuries/Limitations: ${requestDto.limitations.join(', ')}` : ''}
    - Gym Access: ${requestDto.hasGymAccess ? 'Yes' : 'No'}

    Create a complete 7-day workout plan (Day 1 through Day 7) that includes:
    1. Specific day designation (e.g., "Day 1", "Day 2", etc.)
    2. Focus area for each day
    3. A warm-up section (5-10 minutes)
    4. A detailed list of exercises with:
       - Exercise name
       - Clear description of how to perform it
       - Sets and reps or duration
       - Rest periods between sets
       - Target muscle groups
       - Required equipment
       - Proper form cues
    5. A cooldown section (5 minutes)
    6. Total duration in minutes
    7. Helpful notes for that day's workout

    IMPORTANT: The plan MUST include all 7 days of the week, with appropriate rest or active recovery days strategically placed.

    The plan should be:
    - Progressive over the ${requestDto.duration} weeks, with appropriate intensity increases
    - Balanced for all muscle groups while emphasizing the target areas
    - Appropriate for the user's fitness level
    - Considerate of any injuries or limitations
    - Include recovery techniques and mobility work

    Provide scientific reasoning for the workout selections based on the user's goals and data.`;
  }

  private async callAiService(prompt: string): Promise<any> {
    try {
      return await this.geminiService.generateStructuredWorkoutPlan(prompt);
    } catch (error) {
      this.logger.error(`AI service error: ${error.message}`, error.stack);
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
      this.logger.error(`Parse error: ${error.message}`, error.stack);
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
