import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserActivity, UserActivityDocument } from '../../../infrastructure/database/schemas/userActivity.schema';
import { Activity } from '../../../infrastructure/database/schemas/activity.schema';
import { WorkoutPlan, WorkoutDay, Exercise } from '../interfaces/workout-plan.interface';

@Injectable()
export class ActivityTrackingService {
  private readonly logger = new Logger(ActivityTrackingService.name);

  constructor(
    @InjectModel(UserActivity.name)
    private userActivityModel: Model<UserActivityDocument>,
    
    @InjectModel(Activity.name)
    private activityModel: Model<Activity>,
  ) {}

  /**
   * Record completed workout day in user activities
   */
  async recordWorkoutActivity(
    userId: string,
    workoutPlan: WorkoutPlan,
    dayIndex: number,
    caloriesBurned: number
  ): Promise<void> {
    try {
      const workoutDay = workoutPlan.workoutDays[dayIndex];
      if (!workoutDay) {
        this.logger.warn(`Workout day with index ${dayIndex} not found in plan ${workoutPlan._id}`);
        return;
      }
      
      // Create an activity for the workout day
      await this.createWorkoutDayActivity(userId, workoutPlan, workoutDay, caloriesBurned);
      
      // Record individual exercises as activities
      if (workoutDay.exercises && workoutDay.exercises.length > 0) {
        await this.recordExerciseActivities(userId, workoutPlan, workoutDay);
      }
      
      this.logger.debug(`Recorded workout activities for user ${userId}, day ${dayIndex} of plan ${workoutPlan._id}`);
    } catch (error) {
      this.logger.error(`Error recording workout activity: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Create a user activity for the completed workout day
   */
  private async createWorkoutDayActivity(
    userId: string,
    workoutPlan: WorkoutPlan,
    workoutDay: WorkoutDay,
    caloriesBurned: number
  ): Promise<UserActivityDocument> {
    // Find or create a workout activity type
    let workoutActivity = await this.activityModel.findOne({ name: 'Workout' });
    
    if (!workoutActivity) {
      workoutActivity = await this.activityModel.create({
        name: 'Workout',
        met: 5.0 // Default MET value for general workout
      });
    }
    
    // Create user activity for the workout day
    const userActivity = new this.userActivityModel({
      user: new Types.ObjectId(userId),
      activity: workoutActivity._id,
      title: `${workoutPlan.name}: ${workoutDay.day} - ${workoutDay.focus}`,
      duration: workoutDay.duration || 45, // Default to 45 minutes if not specified
      caloriesBurned: caloriesBurned
    });
    
    return await userActivity.save();
  }
  
  /**
   * Record individual exercises as activities
   */
  private async recordExerciseActivities(
    userId: string,
    workoutPlan: WorkoutPlan,
    workoutDay: WorkoutDay
  ): Promise<void> {
    // Calculate approximate time per exercise
    const totalDuration = workoutDay.duration || 45; // Default to 45 minutes
    const exerciseCount = workoutDay.exercises.length;
    const timePerExercise = Math.floor(totalDuration / exerciseCount);
    
    // Process each exercise
    for (const exercise of workoutDay.exercises) {
      await this.recordExerciseActivity(userId, workoutPlan, workoutDay, exercise, timePerExercise);
    }
  }
  
  /**
   * Record a single exercise as a user activity
   */
  private async recordExerciseActivity(
    userId: string,
    workoutPlan: WorkoutPlan,
    workoutDay: WorkoutDay,
    exercise: Exercise,
    duration: number
  ): Promise<void> {
    try {
      // Find or create an activity for this exercise type
      let exerciseActivity = await this.activityModel.findOne({ 
        name: { $regex: new RegExp(exercise.name, 'i') } 
      });
      
      if (!exerciseActivity) {
        exerciseActivity = await this.activityModel.create({
          name: exercise.name,
          met: exercise.metValue || 3.5 // Use the exercise MET value or default
        });
      }
      
      // Calculate calories for this specific exercise
      // This is simplified - in reality would need user weight, etc.
      const caloriesPerExercise = Math.round((exerciseActivity.met * 3.5 * duration) / 60);
      
      // Create user activity for the exercise
      const userActivity = new this.userActivityModel({
        user: new Types.ObjectId(userId),
        activity: exerciseActivity._id,
        title: `${exercise.name} (${workoutDay.day} - ${workoutPlan.name})`,
        duration: duration,
        caloriesBurned: caloriesPerExercise
      });
      
      await userActivity.save();
    } catch (error) {
      this.logger.error(`Error recording exercise activity: ${error.message}`, error.stack);
    }
  }
} 