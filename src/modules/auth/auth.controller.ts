import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponse } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/users.entity';
import { SendCodeDto, VerifyCodeDto } from './dto/phone-auth.dto';

@ApiTags('احراز هویت')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'ثبت نام کاربر جدید' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'ثبت نام با موفقیت انجام شد',
    type: AuthResponse,
  })
  @ApiResponse({ status: 409, description: 'ایمیل تکراری است' })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'ورود با ایمیل و رمز عبور' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'ورود با موفقیت انجام شد',
    type: AuthResponse,
  })
  @ApiResponse({ status: 401, description: 'ایمیل یا رمز عبور اشتباه است' })
  @UseGuards(LocalAuthGuard)
  async login(
    @Body() _loginDto: LoginDto,
    @CurrentUser() user: User,
  ): Promise<AuthResponse> {
    return this.authService.login(user);
  }

  @Post('send-code')
  @ApiOperation({ summary: 'ارسال کد تایید SMS به شماره تلفن' })
  @ApiBody({ type: SendCodeDto })
  @ApiResponse({ status: 200, description: 'کد ارسال شد' })
  async sendCode(@Body() sendCodeDto: SendCodeDto) {
    return this.authService.sendCode(sendCodeDto);
  }

  @Post('verify-code')
  @ApiOperation({ summary: 'تایید کد SMS و ورود به سیستم' })
  @ApiBody({ type: VerifyCodeDto })
  @ApiResponse({
    status: 200,
    description: 'تایید شد و توکن برگردانده می‌شود',
    type: AuthResponse,
  })
  @ApiResponse({ status: 401, description: 'کد تایید اشتباه یا منقضی شده است' })
  async verifyCode(
    @Body() verifyCodeDto: VerifyCodeDto,
  ): Promise<AuthResponse> {
    return this.authService.verifyCode(verifyCodeDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'دریافت مشخصات کاربر فعلی' })
  @ApiResponse({ status: 200, description: 'مشخصات کاربر' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User): User {
    return user;
  }
}
