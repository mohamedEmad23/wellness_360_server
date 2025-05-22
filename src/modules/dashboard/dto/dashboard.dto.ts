import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
  @ApiProperty({ description: 'Total number of workouts' })
  totalWorkouts: number;

  @ApiProperty({ description: 'Total number of sleep logs' })
  totalSleepLogs: number;

  @ApiProperty({ description: 'Total number of food logs' })
  totalFoodLogs: number;

  @ApiProperty({ description: 'Weekly workouts count' })
  weeklyWorkouts: number;

  @ApiProperty({ description: 'Weekly sleep logs count' })
  weeklySleepLogs: number;

  @ApiProperty({ description: 'Weekly food logs count' })
  weeklyFoodLogs: number;

  @ApiProperty({ description: 'Completion rates for tracking targets' })
  completionRate: {
    workouts: number;
    sleepLogs: number;
    foodLogs: number;
  };
}

export class UserProfileDto {
  @ApiProperty({ description: 'User full name' })
  name: string;

  @ApiProperty({ description: 'User height in cm' })
  height: number;

  @ApiProperty({ description: 'User weight in kg' })
  weight: number;

  @ApiProperty({ description: 'User target weight in kg' })
  targetWeight?: number;

  @ApiProperty({ description: 'User fitness level', enum: ['beginner', 'intermediate', 'advanced'] })
  fitnessLevel: string;

  @ApiProperty({ description: 'User fitness goals', type: [String] })
  fitnessGoals: string[];

  @ApiProperty({ description: 'User activity level' })
  activityLevel: string;
}

export class MetricWithChangeDto {
  @ApiProperty({ description: 'Value of the metric' })
  total?: number;

  @ApiProperty({ description: 'Value of the metric' })
  value?: number;

  @ApiProperty({ description: 'Average value of the metric' })
  average?: number;

  @ApiProperty({ description: 'Unit of measurement' })
  unit?: string;

  @ApiProperty({ description: 'Scale of measurement' })
  scale?: string;

  @ApiProperty({ description: 'Percentage change from previous period' })
  change: number;

  @ApiProperty({ description: 'Percentage of total' })
  percentage?: number;
}

export class TopActivityDto {
  @ApiProperty({ description: 'Activity title' })
  title: string;

  @ApiProperty({ description: 'Total duration in minutes' })
  duration: number;

  @ApiProperty({ description: 'Total calories burned' })
  calories: number;

  @ApiProperty({ description: 'Number of times performed' })
  count: number;
}

export class PeriodRangeDto {
  @ApiProperty({ description: 'Start date of the period (ISO string)' })
  start: string;

  @ApiProperty({ description: 'End date of the period (ISO string)' })
  end: string;
}

export class ActivitySummaryDto {
  @ApiProperty({ description: 'Period of the summary', enum: ['daily', 'weekly', 'monthly'] })
  period: 'daily' | 'weekly' | 'monthly';

  @ApiProperty({ description: 'Human-readable period label' })
  periodLabel: string;

  @ApiProperty({ description: 'Period date range' })
  periodRange: PeriodRangeDto;

  @ApiProperty({ description: 'Activity statistics' })
  stats: {
    workoutTime: MetricWithChangeDto;
    caloriesBurned: MetricWithChangeDto;
    activityCount: {
      total: number;
      change: number;
    };
  };

  @ApiProperty({ description: 'Top activities by duration', type: [TopActivityDto] })
  topActivities: TopActivityDto[];
}

export class NutritionSummaryDto {
  @ApiProperty({ description: 'Period of the summary', enum: ['daily', 'weekly', 'monthly'] })
  period: 'daily' | 'weekly' | 'monthly';

  @ApiProperty({ description: 'Human-readable period label' })
  periodLabel: string;

  @ApiProperty({ description: 'Period date range' })
  periodRange: PeriodRangeDto;

  @ApiProperty({ description: 'Nutrition statistics' })
  stats: {
    calories: MetricWithChangeDto;
    protein: MetricWithChangeDto;
    carbs: MetricWithChangeDto;
    fats: MetricWithChangeDto;
  };

  @ApiProperty({ description: 'Macronutrient distribution in percentages' })
  macroDistribution: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export class SleepSummaryDto {
  @ApiProperty({ description: 'Period of the summary', enum: ['daily', 'weekly', 'monthly'] })
  period: 'daily' | 'weekly' | 'monthly';

  @ApiProperty({ description: 'Human-readable period label' })
  periodLabel: string;

  @ApiProperty({ description: 'Period date range' })
  periodRange: PeriodRangeDto;

  @ApiProperty({ description: 'Sleep statistics' })
  stats: {
    avgDuration: MetricWithChangeDto;
    avgRating: MetricWithChangeDto;
    consistency: {
      value: number;
      unit: string;
    };
  };

  @ApiProperty({ description: 'Distribution of sleep quality ratings' })
  qualityDistribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
    veryPoor: number;
  };
}

export class ProgressTrackingDto {
  @ApiProperty({ description: 'Weight metrics' })
  weight: {
    current: number;
    target: number;
    difference: number;
    unit: string;
  };

  @ApiProperty({ description: 'Goal information' })
  goal: {
    type: string;
    status: string;
    progressPercentage: number;
  };

  @ApiProperty({ description: 'Fitness metrics' })
  fitness: {
    level: string;
    activityLastMonth: number;
    consistencyScore: number;
  };
}

export class DashboardOverviewDto {
  @ApiProperty({ description: 'User profile information' })
  profile: UserProfileDto;

  @ApiProperty({ description: 'User statistics' })
  userStats: UserStatsDto;

  @ApiProperty({ description: 'Activity summary' })
  activitySummary: ActivitySummaryDto;

  @ApiProperty({ description: 'Nutrition summary' })
  nutritionSummary: NutritionSummaryDto;

  @ApiProperty({ description: 'Sleep summary' })
  sleepSummary: SleepSummaryDto;

  @ApiProperty({ description: 'Progress tracking' })
  progressTracking: ProgressTrackingDto;
} 