import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Error } from 'mongoose';
import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserMacros } from 'src/infrastructure/database/schemas/userMacros.schema';
import { CreateUserMacrosDto } from './dto/create-user-macros.dto';
import { UpdateUserMacrosDto } from './dto/update-user-macros.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>, 
    @InjectModel('UserMacros') private readonly userMacrosModel: Model<UserMacros>
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const today = new Date();
    const birthDate = new Date(createUserDto.dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

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

  async updateById(id: string, updateData: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
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
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const dobString = updateUserDto.dob.toString();
        
        if (!dateRegex.test(dobString)) {
          throw new BadRequestException('Invalid date format. Use YYYY-MM-DD format.');
        }
        
        // Additional date validation
        const parsedDate = new Date(dobString);
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


    const macros = {
      userId: userId,
      date: new Date(),
      dailyCalories: Math.round(dailyCalories),
      caloriesLeft: Math.round(dailyCalories),
      dailyProtein: Math.round(dailyCalories * 0.25),
      proteinLeft: Math.round(dailyCalories * 0.25),
      dailyCarbs: Math.round(dailyCalories * 0.5),
      carbsLeft: Math.round(dailyCalories * 0.5),
      dailyFat: Math.round(dailyCalories * 0.25),
      fatLeft: Math.round(dailyCalories * 0.25),
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
    
   async createUserMacros
   (userId: string, createUserMacrosDto: CreateUserMacrosDto)
   : Promise<UserMacros> {
    const existingMacros = await this.userMacrosModel.findOne({ userId }).exec();
    if (existingMacros) {
      return existingMacros;
    }

    const userMacros = new this.userMacrosModel({
      userId: userId,
      dailyCalories: Math.round(createUserMacrosDto.dailyCalories),
      caloriesLeft: Math.round(createUserMacrosDto.dailyCalories),
      dailyProtein: Math.round(createUserMacrosDto.dailyCalories * 0.25),
      proteinLeft: Math.round(createUserMacrosDto.dailyCalories * 0.25),
      dailyCarbs: Math.round(createUserMacrosDto.dailyCalories * 0.5),
      carbsLeft: Math.round(createUserMacrosDto.dailyCalories * 0.5),
      dailyFat: Math.round(createUserMacrosDto.dailyCalories * 0.25),
      fatLeft: Math.round(createUserMacrosDto.dailyCalories * 0.25),
      date: new Date(),
    });

    return userMacros.save();
   }

   async updateUserMacros(userId: string, updateUserMacrosDto: UpdateUserMacrosDto): Promise<UserMacros> {

    const userMacros = await this.userMacrosModel.findOne({ userId }).exec();
    if (!userMacros) {
      throw new BadRequestException('User macros not found');
    }

    const newDailyCalories = updateUserMacrosDto.dailyCalories;
    const newDailyProtein = (updateUserMacrosDto.dailyCalories * 0.25);
    const newDailyCarbs = (updateUserMacrosDto.dailyCalories * 0.5);
    const newDailyFat = (updateUserMacrosDto.dailyCalories * 0.25);

    const updateData = {
      dailyCalories: Math.round(newDailyCalories),
      caloriesLeft: Math.round(newDailyCalories - (userMacros.dailyCalories - userMacros.caloriesLeft)),
      dailyProtein: Math.round(newDailyProtein),
      proteinLeft: Math.round(newDailyProtein - (userMacros.dailyProtein - userMacros.proteinLeft)),
      dailyCarbs: Math.round(newDailyCarbs),
      carbsLeft: Math.round(newDailyCarbs - (userMacros.dailyCarbs - userMacros.carbsLeft)),
      dailyFat: Math.round(newDailyFat),
      fatLeft: Math.round(newDailyFat - (userMacros.dailyFat - userMacros.fatLeft)),
    };

    const updatedMacros = await this.userMacrosModel.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    ).exec();

    return updatedMacros;
  }


}
