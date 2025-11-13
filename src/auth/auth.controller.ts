import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { EnableMFADto, VerifyMFADto } from './dto/enable-mfa.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() loginDto: LoginDto, @Query('mfaCode') mfaCode?: string) {
    return this.authService.login(loginDto, mfaCode);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/enable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable MFA' })
  @ApiResponse({ status: 200 })
  async enableMFA(
    @Body() enableMFADto: EnableMFADto,
    @CurrentUser() user: any,
  ) {
    return this.authService.enableMFA(user.userId || user.id, enableMFADto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200 })
  async disableMFA(@CurrentUser() user: any) {
    return this.authService.disableMFA(user.userId || user.id);
  }

  @Public()
  @Post('mfa/send-otp')
  @ApiOperation({ summary: 'Send Email OTP' })
  @ApiResponse({ status: 200 })
  async sendEmailOTP(@Body('userId') userId: string) {
    return this.authService.sendEmailOTP(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200 })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.userId);
  }
}

