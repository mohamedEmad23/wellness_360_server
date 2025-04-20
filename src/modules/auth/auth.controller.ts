import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { ReauthenticateDto } from './dto/reauthenticate.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Email already exists',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { user, access_token } = await this.authService.login(loginDto);
    return { user, access_token }; 
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or OTP expired',
  })
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP for email verification' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'User not found or email already verified',
  })
  resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'User not found',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP or OTP expired',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('reauthenticate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reauthenticate current user with password' })
  @ApiResponse({
    status: 200,
    description: 'User successfully reauthenticated',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async reauthenticate(
    @GetUser('userId') userId: string,
    @Body() reauthenticateDto: ReauthenticateDto,
  ) {
    return this.authService.reauthenticate(userId, reauthenticateDto);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change password when logged in' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid credentials',
  })
  async changePassword(
    @GetUser('userId') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }
}
