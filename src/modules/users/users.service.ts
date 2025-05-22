import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Error } from 'mongoose';
import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserMacros } from 'src/infrastructure/database/schemas/userMacros.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>, 
    @InjectModel('UserMacros') private readonly userMacrosModel: Model<UserMacros>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    let age = createUserDto.age || null;

    const createdUser = new this.userModel({
      ...createUserDto,
      age: age,
    });

    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findUserMacrosById(id: string): Promise<UserMacros | null> {
    return this.userMacrosModel.findOne({ userId: id }).exec();
  }

  async updateById(id: string, updateData: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  // New method to get user macros - creates or updates if needed
  async getUserMacros(userId: string): Promise<UserMacros> {
    const userMacros = await this.findUserMacrosById(userId);
    
    // If userMacros exists and was created today, return it
    if (userMacros && userMacros.date.toDateString() === new Date().toDateString()) {
      return userMacros;
    }
    
    // Otherwise calculate new macros based on user profile
    const macros = await this.suggestDailyMacros(userId);
    
    // If macros exist but need update
    if (userMacros) {
      // Preserve the consumed macros when updating
      const consumed = {
        calories: userMacros.dailyCalories - userMacros.caloriesLeft,
        protein: userMacros.dailyProtein - userMacros.proteinLeft,
        carbs: userMacros.dailyCarbs - userMacros.carbsLeft,
        fat: userMacros.dailyFat - userMacros.fatLeft,
      };
      
      const updateData = {
        dailyCalories: macros.dailyCalories,
        caloriesLeft: Math.max(0, macros.dailyCalories - consumed.calories),
        dailyProtein: macros.dailyProtein,
        proteinLeft: Math.max(0, macros.dailyProtein - consumed.protein),
        dailyCarbs: macros.dailyCarbs,
        carbsLeft: Math.max(0, macros.dailyCarbs - consumed.carbs),
        dailyFat: macros.dailyFat,
        fatLeft: Math.max(0, macros.dailyFat - consumed.fat),
        date: new Date(),
      };
      
      return this.userMacrosModel.findOneAndUpdate(
        { userId },
        updateData,
        { new: true, runValidators: true }
      ).exec();
    }
    
    // If no macros exist, create new ones
    const newUserMacros = new this.userMacrosModel({
      ...macros,
      date: new Date(),
    });
    return newUserMacros.save();
  }

  async updateUserProfile(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      // First check if this is the first profile update
      const currentUser = await this.findById(userId);
      if (!currentUser) {
        throw new BadRequestException('User not found');
      }
      
      const isFirstUpdate = !currentUser.isProfileCompleted;
      
      // Validate the date format if it's provided
      if (updateUserDto.dob) {
        const dobString = updateUserDto.dob.toString();
        let parsedDate = new Date(dobString);
        
        // Only check if it's a valid date
        if (isNaN(parsedDate.getTime())) {
          throw new BadRequestException('Invalid date value. Please provide a valid date.');
        }
        
        // Make sure it's a valid past date (not in the future)
        if (parsedDate > new Date()) {
          throw new BadRequestException('Date of birth cannot be in the future.');
        }
        
        // Update the DTO with the properly parsed date
        updateUserDto.dob = parsedDate;
      }
      
      // If height or weight is provided, ensure they're reasonable values
      if (updateUserDto.height && (updateUserDto.height < 50 || updateUserDto.height > 300)) {
        throw new BadRequestException('Height must be between 50cm and 300cm.');
      }
      
      if (updateUserDto.weight && (updateUserDto.weight < 20 || updateUserDto.weight > 500)) {
        throw new BadRequestException('Weight must be between 20kg and 500kg.');
      }
      
      // Check if all required profile information is provided
      // If this is a complete profile update, mark it as completed
      const updatedData = { ...updateUserDto } as Partial<User>;
      
      // If we have all necessary fields filled either previously or in this update, mark profile as completed
      const hasRequiredFields = this.checkRequiredProfileFields(currentUser, updatedData);
      if (hasRequiredFields) {
        updatedData.isProfileCompleted = true;
      }
      
      const today = new Date();
      const birthDate = new Date(updateUserDto.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      updatedData.age = age;

      const updatedUser = await this.updateById(userId, updatedData);
      
      if (!updatedUser) {
        throw new BadRequestException('User not found or update failed.');
      }
      
      // Custom dailyCalories handling
      if (updateUserDto.dailyCalories !== undefined) {
        // Get current macros or create new ones
        const userMacros = await this.findUserMacrosById(userId) || await this.suggestDailyMacros(userId);
        
        // Calculate consumed amounts
        const consumed = {
          calories: userMacros.dailyCalories - userMacros.caloriesLeft,
          protein: userMacros.dailyProtein - userMacros.proteinLeft,
          carbs: userMacros.dailyCarbs - userMacros.carbsLeft,
          fat: userMacros.dailyFat - userMacros.fatLeft,
        };
        
        // Update with custom daily calories
        const dailyCalories = Math.round(updateUserDto.dailyCalories);
        
        // Get the user's goal to determine proper macronutrient distribution
        const user = await this.findById(userId);
        if (!user) {
          throw new BadRequestException('User not found');
        }
        
        // Set different macronutrient distributions based on goal
        let proteinPercentage = 0;
        let carbsPercentage = 0;
        let fatPercentage = 0;

        switch (user.goal) {
          case 'lose':
            // Higher protein to preserve muscle mass during weight loss
            // Lower carbs to reduce calories and improve insulin sensitivity
            // Moderate fat for hormone function
            proteinPercentage = 0.40; // 40% protein
            carbsPercentage = 0.30; // 30% carbs
            fatPercentage = 0.30; // 30% fat
            break;
            
          case 'maintain':
            // Balanced approach for maintenance
            proteinPercentage = 0.30; // 30% protein
            carbsPercentage = 0.40; // 40% carbs
            fatPercentage = 0.30; // 30% fat
            break;
            
          case 'gain':
            // Higher carbs to fuel workouts and support muscle growth
            // Good protein for muscle building
            // Moderate fat for hormonal balance
            proteinPercentage = 0.25; // 25% protein
            carbsPercentage = 0.50; // 50% carbs
            fatPercentage = 0.25; // 25% fat
            break;
            
          default:
            // Default balanced distribution if goal is not set
            proteinPercentage = 0.30;
            carbsPercentage = 0.40;
            fatPercentage = 0.30;
        }
        
        // Calculate macronutrients in calories
        const caloriesFromCarbs = dailyCalories * carbsPercentage;
        const caloriesFromProtein = dailyCalories * proteinPercentage;
        const caloriesFromFat = dailyCalories * fatPercentage;
        
        const dailyProtein = Math.round(caloriesFromProtein / 4); // Protein: 4 calories per gram
        const dailyCarbs = Math.round(caloriesFromCarbs / 4); // Carbs: 4 calories per gram
        const dailyFat = Math.round(caloriesFromFat / 9); // Fat: 9 calories per gram
        
        const updateData = {
          dailyCalories,
          caloriesLeft: Math.max(0, dailyCalories - consumed.calories),
          dailyProtein,
          proteinLeft: Math.max(0, dailyProtein - consumed.protein),
          dailyCarbs,
          carbsLeft: Math.max(0, dailyCarbs - consumed.carbs),
          dailyFat,
          fatLeft: Math.max(0, dailyFat - consumed.fat),
          date: new Date(),
        };
        
        await this.userMacrosModel.findOneAndUpdate(
          { userId },
          updateData,
          { new: true, upsert: true, runValidators: true }
        ).exec();
      }
      // If profile was updated with fields that affect macros (and no custom calories), update them too
      else if (
        updateUserDto.height !== undefined || 
        updateUserDto.weight !== undefined || 
        updateUserDto.activityLevel !== undefined || 
        updateUserDto.goal !== undefined ||
        updateUserDto.gender !== undefined
      ) {
        // This will update the macros based on the new profile
        await this.getUserMacros(userId);
      }
      
      // Add isFirstUpdate property to the response
      const result = updatedUser.toObject();
      (result as any).isFirstProfileUpdate = isFirstUpdate;
      
      return result as User;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle Mongoose CastError specifically
      if (error.name === 'CastError') {
        throw new BadRequestException(`Invalid value for ${error.path}: ${error.value}`);
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errorMessages = Object.values(error.errors).map((e: Error.ValidatorError) => e.message).join(', ');
        throw new BadRequestException(`Validation error: ${errorMessages}`);
      }
      
      console.error('Error updating user profile:', error);
      throw new InternalServerErrorException('Failed to update user profile. Please try again later.');
    }
  }
  
  private checkRequiredProfileFields(
    currentUser: User, 
    updateData: Partial<User>
  ): boolean {
    // Check if all required fields are present (either already in DB or in the update)
    const requiredFields = [
      'gender', 
      'dob', 
      'height', 
      'weight', 
      'activityLevel', 
      'goal'
    ];
    
    return requiredFields.every(field => 
      // Field is present in update data or already exists in user data
      updateData[field] !== undefined || currentUser[field] !== undefined
    );
  }

  async suggestDailyMacros(userId: string): Promise<UserMacros> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { height, weight, age, gender, activityLevel, goal } = user;

    const bmr = this.calculateBMR(height, weight, age, gender);
    const caloriesBurned = this.calculateDailyCalories(bmr, activityLevel);
    let dailyCalories = 0;

    switch (goal) {
      case 'lose':
        dailyCalories = caloriesBurned - 500;
        break;
      case 'gain':
        dailyCalories = caloriesBurned + 500;
        break;
      case 'maintain':
        dailyCalories = caloriesBurned;
        break;
      default:
        throw new BadRequestException('Invalid goal');
    }

    // Set different macronutrient distributions based on goal
    let proteinPercentage = 0;
    let carbsPercentage = 0;
    let fatPercentage = 0;

    switch (goal) {
      case 'lose':
        // Higher protein to preserve muscle mass during weight loss
        // Lower carbs to reduce calories and improve insulin sensitivity
        // Moderate fat for hormone function
        proteinPercentage = 0.40; // 40% protein
        carbsPercentage = 0.30; // 30% carbs
        fatPercentage = 0.30; // 30% fat
        break;
        
      case 'maintain':
        // Balanced approach for maintenance
        proteinPercentage = 0.30; // 30% protein
        carbsPercentage = 0.40; // 40% carbs
        fatPercentage = 0.30; // 30% fat
        break;
        
      case 'gain':
        // Higher carbs to fuel workouts and support muscle growth
        // Good protein for muscle building
        // Moderate fat for hormonal balance
        proteinPercentage = 0.25; // 25% protein
        carbsPercentage = 0.50; // 50% carbs
        fatPercentage = 0.25; // 25% fat
        break;
    }

    // Calculate macronutrients in calories
    const caloriesFromCarbs = dailyCalories * carbsPercentage;
    const caloriesFromProtein = dailyCalories * proteinPercentage;
    const caloriesFromFat = dailyCalories * fatPercentage;

    const macros = {
      userId: userId,
      date: new Date(),
      dailyCalories: Math.round(dailyCalories),
      caloriesLeft: Math.round(dailyCalories),
      dailyProtein: Math.round(caloriesFromProtein / 4), // Protein: 4 calories per gram
      proteinLeft: Math.round(caloriesFromProtein / 4),
      dailyCarbs: Math.round(caloriesFromCarbs / 4), // Carbs: 4 calories per gram
      carbsLeft: Math.round(caloriesFromCarbs / 4),
      dailyFat: Math.round(caloriesFromFat / 9), // Fat: 9 calories per gram
      fatLeft: Math.round(caloriesFromFat / 9),
    } as UserMacros;

    return macros;
  }

  private calculateBMR(height: number, weight: number, age: number, gender: string): number {
    if (gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
  }

  private calculateDailyCalories(bmr: number, activityLevel: string): number {
    switch (activityLevel) {
      case 'sedentary':
        return bmr * 1.2;
      case 'lightly active':
        return bmr * 1.375;
      case 'moderately active':
        return bmr * 1.55;
      case 'very active':
        return bmr * 1.725;
      default:
        return bmr;
    }
  }
}
