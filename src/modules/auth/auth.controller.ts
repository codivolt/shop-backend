import { Controller, Post, Body, UseGuards, Get, HttpCode, HttpStatus, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponse } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/users.entity';
import { SendCodeDto, VerifyCodeDto } from './dto/phone-auth.dto';
import { REFRESH_COOKIE, parseCookies, setRefreshCookie, clearRefreshCookie } from './cookie.util';

@ApiTags('احراز هویت')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'ثبت نام کاربر جدید' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'ثبت نام با موفقیت انجام شد',
    type: AuthResponse,
  })
  @ApiResponse({ status: 409, description: 'ایمیل تکراری است' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.register(registerDto);
    setRefreshCookie(res, result.refresh_token!);
    delete result.refresh_token;
    return result;
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
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
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.login(user);
    setRefreshCookie(res, result.refresh_token!);
    delete result.refresh_token;
    return result;
  }

  @Post('send-code')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'ارسال کد تایید SMS به شماره تلفن' })
  @ApiBody({ type: SendCodeDto })
  @ApiResponse({ status: 200, description: 'کد ارسال شد' })
  async sendCode(@Body() sendCodeDto: SendCodeDto) {
    return this.authService.sendCode(sendCodeDto);
  }

  @Post('verify-code')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
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
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const result = await this.authService.verifyCode(verifyCodeDto);
    setRefreshCookie(res, result.refresh_token!);
    delete result.refresh_token;
    return result;
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'تجدید توکن دسترسی' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string', example: 'abc123...' },
      },
      required: ['refresh_token'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'توکن‌های جدید',
    type: AuthResponse,
  })
  @ApiResponse({ status: 401, description: 'توکن تازه‌سازی نامعتبر است' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refresh_token?: string },
  ): Promise<AuthResponse> {
    const cookieToken = parseCookies(req.headers.cookie)[REFRESH_COOKIE];
    const token = cookieToken || body?.refresh_token;
    if (!token) {
      throw new UnauthorizedException('توکن تازه‌سازی نامعتبر یا منقضی شده است');
    }
    const result = await this.authService.refreshTokens(token);
    setRefreshCookie(res, result.refresh_token!);
    delete result.refresh_token;
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'خروج از سیستم' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'با موفقیت خارج شدید' })
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    clearRefreshCookie(res);
    return { message: 'با موفقیت خارج شدید' };
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
