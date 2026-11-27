import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RegisterDto, AuthResponse } from './dto/auth.dto';
import { User, UserRole } from '../users/users.entity';
import { VerificationCode } from './verification-code.entity';
import { RefreshToken } from './refresh-token.entity';
import { SmsService } from './sms.service';
import { SendCodeDto, VerifyCodeDto } from './dto/phone-auth.dto';

const CODE_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const REFRESH_TOKEN_TTL_DAYS = 30;
const ACCESS_TOKEN_TTL = '15m';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(VerificationCode)
    private verificationCodesRepository: Repository<VerificationCode>,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
    private smsService: SmsService,
    private permissionsService: PermissionsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('ایمیل قبلاً ثبت شده است');
    }

    if (registerDto.phone) {
      const existingPhone = await this.usersService.findByPhone(registerDto.phone);
      if (existingPhone) {
        throw new ConflictException('شماره تماس قبلاً ثبت شده است');
      }
      throw new ConflictException(
        'شماره تماس باید ابتدا تایید شود. لطفاً ابتدا کد تایید درخواست کنید.',
      );
    }

    const user = await this.usersService.create(
      {
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      },
      UserRole.CUSTOMER,
    );

    return this.generateToken(user);
  }

  async validateUserByPhone(phone: string, password: string): Promise<User> {
    const user = await this.usersService.findByPhoneWithPassword(phone);
    if (!user || !(await user.validatePassword(password))) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری غیرفعال است');
    }

    delete (user as Partial<User>).password;
    return user;
  }

  async login(user: User): Promise<AuthResponse> {
    const userWithPermissions = await this.usersService.findById(user.id);
    return this.generateToken(userWithPermissions || user);
  }

  async sendCode(sendCodeDto: SendCodeDto): Promise<{ message: string }> {
    const existing = await this.verificationCodesRepository.findOne({
      where: { phone: sendCodeDto.phone },
    });

    if (existing) {
      const elapsedSeconds =
        (Date.now() - new Date(existing.createdAt).getTime()) / 1000;
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        throw new HttpException(
          'برای ارسال مجدد کد کمی صبر کنید',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      await this.verificationCodesRepository.remove(existing);
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const verificationCode = this.verificationCodesRepository.create({
      phone: sendCodeDto.phone,
    });
    await verificationCode.setCode(code);
    verificationCode.expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    await this.verificationCodesRepository.save(verificationCode);

    await this.smsService.sendCode(sendCodeDto.phone, code);

    return { message: 'کد تایید ارسال شد' };
  }

  async verifyCode(verifyCodeDto: VerifyCodeDto): Promise<AuthResponse> {
    const verificationCode = await this.verificationCodesRepository.findOne({
      where: { phone: verifyCodeDto.phone },
    });

    if (!verificationCode) {
      throw new UnauthorizedException('کد تایید یافت نشد');
    }

    if (new Date() > new Date(verificationCode.expiresAt)) {
      await this.verificationCodesRepository.remove(verificationCode);
      throw new UnauthorizedException('کد تایید منقضی شده است');
    }

    if (!(await verificationCode.validateCode(verifyCodeDto.code))) {
      throw new UnauthorizedException('کد تایید اشتباه است');
    }

    await this.verificationCodesRepository.remove(verificationCode);

    let user = await this.usersService.findByPhone(verifyCodeDto.phone);
    if (!user) {
      user = await this.usersService.createByPhone(verifyCodeDto.phone);
    } else {
      if (!user.isActive) {
        throw new UnauthorizedException('حساب کاربری غیرفعال است');
      }

      if (!user.phoneVerifiedAt) {
        await this.usersService.markPhoneVerified(user.id);
        user.phoneVerifiedAt = new Date();
      }
    }

    return this.generateToken(user);
  }

  async generateToken(user: User): Promise<AuthResponse> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const userPermissions = (user.permissions || []).map(
      (p) => p.permission.key,
    );

    const rolePermissions =
      user.role === UserRole.SUPER_ADMIN
        ? []
        : await this.permissionsService.getRolePermissions();
    const roleKeys = (rolePermissions[user.role] || []).filter(
      (key) => !userPermissions.includes(key),
    );

    const permissions = [...userPermissions, ...roleKeys];

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    // Generate refresh token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenEntity = this.refreshTokensRepository.create({
      userId: user.id,
      tokenHash: refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    });
    await this.refreshTokensRepository.save(refreshTokenEntity);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        passwordSetAt: user.passwordSetAt,
        role: user.role,
        permissions,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    const refreshTokenEntities = await this.refreshTokensRepository.find({
      where: {},
    });

    let validEntity: RefreshToken | null = null;
    for (const entity of refreshTokenEntities) {
      if (await entity.validateToken(refreshToken)) {
        if (!entity.isExpired()) {
          validEntity = entity;
          break;
        }
      }
    }

    if (!validEntity) {
      throw new UnauthorizedException('توکن تازه‌سازی نامعتبر یا منقضی شده است');
    }

    const user = await this.usersService.findById(validEntity.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('کاربر یافت نشد یا غیرفعال است');
    }

    // Remove the used refresh token
    await this.refreshTokensRepository.remove(validEntity);

    return this.generateToken(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokensRepository.delete({ userId });
  }

  async revokeAllTokens(userId: string): Promise<void> {
    await this.refreshTokensRepository.delete({ userId });
    await this.usersService.incrementTokenVersion(userId);
  }
}
