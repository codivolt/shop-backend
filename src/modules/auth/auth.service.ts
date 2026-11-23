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
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RegisterDto, AuthResponse } from './dto/auth.dto';
import { User, UserRole } from '../users/users.entity';
import { VerificationCode } from './verification-code.entity';
import { SmsService } from './sms.service';
import { SendCodeDto, VerifyCodeDto } from './dto/phone-auth.dto';

const CODE_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(VerificationCode)
    private verificationCodesRepository: Repository<VerificationCode>,
    private smsService: SmsService,
    private permissionsService: PermissionsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('ایمیل قبلاً ثبت شده است');
    }

    const user = await this.usersService.create(
      {
        email: registerDto.email,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
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

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCode = this.verificationCodesRepository.create({
      phone: sendCodeDto.phone,
      code,
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    });
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

    if (verificationCode.code !== verifyCodeDto.code) {
      throw new UnauthorizedException('کد تایید اشتباه است');
    }

    await this.verificationCodesRepository.remove(verificationCode);

    let user = await this.usersService.findByPhone(verifyCodeDto.phone);
    if (!user) {
      user = await this.usersService.create(
        {
          email: `${verifyCodeDto.phone}@phone.local`,
          password: Math.random().toString(36).slice(-12),
          phone: verifyCodeDto.phone,
        },
        UserRole.CUSTOMER,
      );
      await this.usersService.markPasswordNotSet(user.id);
      user.passwordSetAt = null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری غیرفعال است');
    }

    return this.generateToken(user);
  }

  async generateToken(user: User): Promise<AuthResponse> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
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

    return {
      access_token: this.jwtService.sign(payload),
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
}
