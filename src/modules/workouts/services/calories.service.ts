import { Injectable, Logger } from '@nestjs/common';
import { WorkoutDay, Exercise } from '../interfaces/workout-plan.interface';

// Default MET values for different exercise types
const DEFAULT_MET_VALUES = {
  strength: 3.5,
  cardio: 7.0,
  hiit: 8.0,
  circuit: 6.0,
  flexibility: 2.5,
  rest: 1.2,
  warmup: 3.0,
  cooldown: 2.0
};

// Default intensity multipliers
const INTENSITY_MULTIPLIERS = {
  low: 0.8,
  moderate: 1.0,
  high: 1.2
};

@Injectable()
export class CaloriesService {
  private readonly logger = new Logger(CaloriesService.name);

  /**
   * Calculate calories burned for a workout day
   * Formula: Calories = MET × Weight(kg) × Duration(hours)
   */
  calculateCaloriesBurned(
    workoutDay: WorkoutDay, 
    userWeight: number, // in kg
    userAge?: number,
    userGender?: string
  ): number {
    try {
      if (!workoutDay.exercises || workoutDay.exercises.length === 0) {
        return this.calculateRestDayCalories(workoutDay, userWeight);
      }

      // Calculate total workout duration in hours
      const totalDuration = workoutDay.duration || 45; // Default to 45 minutes if not specified
      const durationInHours = totalDuration / 60;
      
      // Determine intensity level if not provided
      const intensityLevel = workoutDay.intensityLevel || this.determineIntensityLevel(workoutDay);
      const intensityMultiplier = INTENSITY_MULTIPLIERS[intensityLevel] || 1.0;
      
      // Calculate calories for each exercise and sum them up
      let totalCalories = 0;
      
      // Calculate warmup calories (typically 5-10 minutes)
      if (workoutDay.warmup) {
        const warmupDuration = 7.5 / 60; // Assume 7.5 minutes (average of 5-10)
        totalCalories += DEFAULT_MET_VALUES.warmup * userWeight * warmupDuration * intensityMultiplier;
      }
      
      // Calculate exercise calories
      const exercisesCount = workoutDay.exercises.length;
      if (exercisesCount > 0) {
        // Estimate time per exercise in hours
        const exerciseTime = (totalDuration - 15) / 60 / exercisesCount; // Subtract warm-up and cool-down time (approx 15 min)
        
        // Sum up calories for each exercise
        workoutDay.exercises.forEach(exercise => {
          const metValue = exercise.metValue || this.getDefaultMetValue(exercise, workoutDay.focus);
          totalCalories += metValue * userWeight * exerciseTime * intensityMultiplier;
        });
      }
      
      // Calculate cooldown calories (typically 5 minutes)
      if (workoutDay.cooldown) {
        const cooldownDuration = 5 / 60; // Assume 5 minutes
        totalCalories += DEFAULT_MET_VALUES.cooldown * userWeight * cooldownDuration * intensityMultiplier;
      }
      
      // Apply age and gender adjustments if available
      totalCalories = this.applyDemographicAdjustments(totalCalories, userAge, userGender);
      
      // Round to nearest whole number
      return Math.round(totalCalories);
    } catch (error) {
      this.logger.error(`Error calculating calories: ${error.message}`, error.stack);
      return 0;
    }
  }
  
  /**
   * Calculate calories burned for a rest day
   */
  private calculateRestDayCalories(workoutDay: WorkoutDay, userWeight: number): number {
    // For rest days, assume light activity for about 20 minutes
    const duration = workoutDay.duration || 20;
    const durationInHours = duration / 60;
    return Math.round(DEFAULT_MET_VALUES.rest * userWeight * durationInHours);
  }
  
  /**
   * Determine exercise intensity level based on workout characteristics
   */
  private determineIntensityLevel(workoutDay: WorkoutDay): 'low' | 'moderate' | 'high' {
    // Check focus area keywords
    const focus = workoutDay.focus.toLowerCase();
    if (focus.includes('hiit') || focus.includes('high intensity') || focus.includes('power')) {
      return 'high';
    }
    
    if (focus.includes('light') || focus.includes('recovery') || focus.includes('mobility')) {
      return 'low';
    }
    
    // Check exercise count and types
    const exercises = workoutDay.exercises || [];
    const highIntensityExercises = exercises.filter(e => 
      e.name.toLowerCase().includes('sprint') || 
      e.name.toLowerCase().includes('jump') ||
      e.name.toLowerCase().includes('burpee')
    );
    
    if (highIntensityExercises.length > 3 || (exercises.length > 0 && highIntensityExercises.length / exercises.length > 0.3)) {
      return 'high';
    }
    
    // Default to moderate
    return 'moderate';
  }
  
  /**
   * Get default MET value based on exercise type and workout focus
   */
  private getDefaultMetValue(exercise: Exercise, workoutFocus: string): number {
    const exerciseName = exercise.name.toLowerCase();
    const focus = workoutFocus.toLowerCase();
    
    // Check for known exercise types
    if (exerciseName.includes('run') || exerciseName.includes('sprint') || exerciseName.includes('jog')) {
      return 8.0; // Running
    }
    
    if (exerciseName.includes('walk')) {
      return 3.5; // Walking
    }
    
    if (exerciseName.includes('cycle') || exerciseName.includes('bike')) {
      return 7.5; // Cycling
    }
    
    if (exerciseName.includes('swim')) {
      return 6.0; // Swimming
    }
    
    if (exerciseName.includes('burpee')) {
      return 8.0; // Burpees
    }
    
    if (exerciseName.includes('jump')) {
      return 7.0; // Jumping exercises
    }
    
    if (exerciseName.includes('squat') || exerciseName.includes('lunge') || exerciseName.includes('deadlift')) {
      return 5.0; // Lower body strength
    }
    
    if (exerciseName.includes('push') || exerciseName.includes('pull') || exerciseName.includes('press')) {
      return 4.0; // Upper body strength
    }
    
    if (exerciseName.includes('plank') || exerciseName.includes('crunch') || exerciseName.includes('sit-up')) {
      return 3.5; // Core exercises
    }
    
    if (exerciseName.includes('stretch') || exerciseName.includes('yoga')) {
      return 2.5; // Flexibility
    }
    
    // Use focus-based fallback
    if (focus.includes('cardio') || focus.includes('endurance')) {
      return DEFAULT_MET_VALUES.cardio;
    }
    
    if (focus.includes('strength') || focus.includes('muscle')) {
      return DEFAULT_MET_VALUES.strength;
    }
    
    if (focus.includes('hiit')) {
      return DEFAULT_MET_VALUES.hiit;
    }
    
    if (focus.includes('circuit')) {
      return DEFAULT_MET_VALUES.circuit;
    }
    
    if (focus.includes('flex') || focus.includes('mobility')) {
      return DEFAULT_MET_VALUES.flexibility;
    }
    
    // Default fallback
    return DEFAULT_MET_VALUES.strength;
  }
  
  /**
   * Apply age and gender-based adjustments to calorie calculations
   */
  private applyDemographicAdjustments(calories: number, age?: number, gender?: string): number {
    let adjustedCalories = calories;
    
    // Age-based adjustment (metabolism decreases with age)
    if (age) {
      if (age < 30) {
        adjustedCalories *= 1.1; // Younger people burn more calories
      } else if (age > 50) {
        adjustedCalories *= 0.9; // Older people burn fewer calories
      }
    }
    
    // Gender-based adjustment
    if (gender) {
      if (gender.toLowerCase() === 'male') {
        adjustedCalories *= 1.1; // Men typically burn more calories due to higher muscle mass
      } else if (gender.toLowerCase() === 'female') {
        adjustedCalories *= 0.9; // Women typically burn fewer calories
      }
    }
    
    return adjustedCalories;
  }
} 