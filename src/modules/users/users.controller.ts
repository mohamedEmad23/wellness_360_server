import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/getUser.decorator';

@ApiTags('User')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
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
        dailyCalories: updatedUser.dailyCalories,
        caloriesLeft: updatedUser.caloriesLeft,
        isEmailVerified: updatedUser.isEmailVerified,
        isProfileCompleted: updatedUser.isProfileCompleted,
      },
    };
  }
} 