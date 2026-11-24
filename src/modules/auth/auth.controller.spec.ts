import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/users.entity';
import { RegisterDto, LoginDto, AuthResponse } from './dto/auth.dto';
import { SendCodeDto, VerifyCodeDto } from './dto/phone-auth.dto';
import { createMockUser } from '../../../test/utils/test-factories';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockUser = createMockUser();
  const mockAuthResponse: AuthResponse = {
    access_token: 'mock-access-token',
    user: {
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      phone: mockUser.phone,
      avatarUrl: mockUser.avatarUrl,
      passwordSetAt: mockUser.passwordSetAt,
      role: mockUser.role,
      permissions: [],
    },
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      sendCode: jest.fn(),
      verifyCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      phone: '09123456789',
    };

    it('should register user and return auth response', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw ConflictException if email exists', async () => {
      authService.register.mockRejectedValue(
        new ConflictException('ایمیل قبلاً ثبت شده است'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user and return auth response', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto, mockUser);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw UnauthorizedException if credentials invalid', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('ایمیل یا رمز عبور اشتباه است'),
      );

      await expect(controller.login(loginDto, mockUser)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('sendCode', () => {
    const sendCodeDto: SendCodeDto = {
      phone: '09123456789',
    };

    it('should send verification code', async () => {
      const expectedResult = { message: 'کد تایید ارسال شد' };
      authService.sendCode.mockResolvedValue(expectedResult);

      const result = await controller.sendCode(sendCodeDto);

      expect(authService.sendCode).toHaveBeenCalledWith(sendCodeDto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw HttpException if resend cooldown active', async () => {
      authService.sendCode.mockRejectedValue(
        new HttpException(
          'برای ارسال مجدد کد کمی صبر کنید',
          HttpStatus.TOO_MANY_REQUESTS,
        ),
      );

      await expect(controller.sendCode(sendCodeDto)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('verifyCode', () => {
    const verifyCodeDto: VerifyCodeDto = {
      phone: '09123456789',
      code: '123456',
    };

    it('should verify code and return auth response', async () => {
      authService.verifyCode.mockResolvedValue(mockAuthResponse);

      const result = await controller.verifyCode(verifyCodeDto);

      expect(authService.verifyCode).toHaveBeenCalledWith(verifyCodeDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw UnauthorizedException if code invalid', async () => {
      authService.verifyCode.mockRejectedValue(
        new UnauthorizedException('کد تایید اشتباه یا منقضی شده است'),
      );

      await expect(controller.verifyCode(verifyCodeDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if code expired', async () => {
      authService.verifyCode.mockRejectedValue(
        new UnauthorizedException('کد تایید منقضی شده است'),
      );

      await expect(controller.verifyCode(verifyCodeDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('me', () => {
    it('should return current user', async () => {
      const result = await controller.me(mockUser);

      expect(result).toEqual(mockUser);
    });

    it('should return user with all properties', async () => {
      const userWithAllProps = createMockUser({
        avatarUrl: 'https://example.com/avatar.jpg',
        passwordSetAt: new Date(),
        permissions: [{ permission: { key: 'test:perm' } }],
      });

      const result = await controller.me(userWithAllProps);

      expect(result).toEqual(userWithAllProps);
      expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(result.passwordSetAt).toBeDefined();
    });
  });
});
