import { Body, Controller, Get, NotFoundException, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/getUser.decorator';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get('')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getProfile(@GetUser('userId') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get the macros for the user - will be created/calculated if not found
    const userMacros = await this.usersService.getUserMacros(userId);
        
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      gender: user.gender,
      dob: user.dob,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      goal: user.goal,
      memberSince: user.created_at,
      dailyCalories: userMacros.dailyCalories,
      caloriesLeft: userMacros.caloriesLeft,
      dailyProtein: userMacros.dailyProtein,
      proteinLeft: userMacros.proteinLeft,
      dailyCarbs: userMacros.dailyCarbs,
      carbsLeft: userMacros.carbsLeft,
      dailyFat: userMacros.dailyFat,
      fatLeft: userMacros.fatLeft,
    };
  }
  
  @Put('')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data provided',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateProfile(@GetUser('userId') userId: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.usersService.updateUserProfile(userId, updateUserDto);
    
    return {
      message: 'Profile updated successfully',
      isFirstProfileUpdate: updatedUser['isFirstProfileUpdate'] || false,
      user: {
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        gender: updatedUser.gender,
        dob: updatedUser.dob,
        age: updatedUser.age,
        height: updatedUser.height,
        weight: updatedUser.weight,
        activityLevel: updatedUser.activityLevel,
        goal: updatedUser.goal,
        isEmailVerified: updatedUser.isEmailVerified,
        isProfileCompleted: updatedUser.isProfileCompleted,
      },
    };
  }
} 