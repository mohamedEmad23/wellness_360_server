import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Error } from 'mongoose';
import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
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
}
