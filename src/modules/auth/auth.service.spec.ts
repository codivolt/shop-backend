import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PermissionsService } from '../permissions/permissions.service';
import { SmsService } from './sms.service';
import { User, UserRole } from '../users/users.entity';
import { VerificationCode } from './verification-code.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { SendCodeDto, VerifyCodeDto } from './dto/phone-auth.dto';
import { mockJwtService, mockSmsService, mockPermissionsService, createMockUserRepository, createMockVerificationCodeRepository } from '../../../test/utils/mock-helpers';
import { createMockUser, createTestUser } from '../../../test/utils/test-factories';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<JwtService>;
  let verificationCodesRepository: jest.Mocked<Partial<Repository<VerificationCode>>>;
  let smsService: jest.Mocked<Partial<SmsService>>;
  let permissionsService: jest.Mocked<Partial<PermissionsService>>;

  const mockUser = createMockUser();
  const registerDto: RegisterDto = {
    email: 'newuser@example.com',
    password: 'password123',
    firstName: 'New',
    lastName: 'User',
    phone: '09123456789',
  };

  const loginDto: LoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const sendCodeDto: SendCodeDto = {
    phone: '09123456789',
  };

  const verifyCodeDto: VerifyCodeDto = {
    phone: '09123456789',
    code: '123456',
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findByPhoneWithPassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      markPasswordNotSet: jest.fn(),
    };

    jwtService = mockJwtService as any;
    verificationCodesRepository = createMockVerificationCodeRepository();
    smsService = mockSmsService as any;
    permissionsService = mockPermissionsService as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(VerificationCode), useValue: verificationCodesRepository },
        { provide: SmsService, useValue: smsService },
        { provide: PermissionsService, useValue: permissionsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const newUser = createTestUser({ email: registerDto.email, phone: registerDto.phone });
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(newUser);
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          password: registerDto.password,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phone: registerDto.phone,
        }),
        UserRole.CUSTOMER,
      );
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should assign CUSTOMER role by default', async () => {
      const newUser = createTestUser({ email: registerDto.email });
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(newUser);

      await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.any(Object),
        UserRole.CUSTOMER,
      );
    });
  });

  describe('validateUserByPhone', () => {
    it('should return user if credentials are valid', async () => {
      const userWithPassword = { ...mockUser, password: '$2b$10$hashedpassword', validatePassword: jest.fn().mockResolvedValue(true) };
      usersService.findByPhoneWithPassword.mockResolvedValue(userWithPassword as any);

      const result = await service.validateUserByPhone('09123456789', 'password123');

      expect(usersService.findByPhoneWithPassword).toHaveBeenCalledWith('09123456789');
      expect(userWithPassword.validatePassword).toHaveBeenCalledWith('password123');
      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByPhoneWithPassword.mockResolvedValue(null);

      await expect(service.validateUserByPhone('09123456789', 'password123')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const userWithPassword = { ...mockUser, password: '$2b$10$hashedpassword', validatePassword: jest.fn().mockResolvedValue(false) };
      usersService.findByPhoneWithPassword.mockResolvedValue(userWithPassword as any);

      await expect(service.validateUserByPhone('09123456789', 'wrongpassword')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false, password: '$2b$10$hashedpassword', validatePassword: jest.fn().mockResolvedValue(true) };
      usersService.findByPhoneWithPassword.mockResolvedValue(inactiveUser as any);

      await expect(service.validateUserByPhone('09123456789', 'password123')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should generate token for user', async () => {
      const userWithPermissions = { ...mockUser, permissions: [] };
      usersService.findById.mockResolvedValue(userWithPermissions);
      permissionsService.getRolePermissions.mockResolvedValue({ customer: [] });

      const result = await service.login(mockUser);

      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });
  });

  describe('sendCode', () => {
    it('should send verification code successfully', async () => {
      verificationCodesRepository.findOne.mockResolvedValue(null);
      verificationCodesRepository.save.mockImplementation(async (code) => code);
      smsService.sendCode.mockResolvedValue({ success: true });

      const result = await service.sendCode(sendCodeDto);

      expect(verificationCodesRepository.findOne).toHaveBeenCalledWith({ where: { phone: sendCodeDto.phone } });
      expect(verificationCodesRepository.save).toHaveBeenCalled();
      expect(smsService.sendCode).toHaveBeenCalledWith(sendCodeDto.phone, expect.any(String));
      expect(result).toEqual({ message: 'کد تایید ارسال شد' });
    });

    it('should throw HttpException if resend cooldown not elapsed', async () => {
      const existingCode = { phone: sendCodeDto.phone, createdAt: new Date() };
      verificationCodesRepository.findOne.mockResolvedValue(existingCode as any);

      await expect(service.sendCode(sendCodeDto)).rejects.toThrow(HttpException);
      await expect(service.sendCode(sendCodeDto)).rejects.toThrow('برای ارسال مجدد کد کمی صبر کنید');
      expect(verificationCodesRepository.save).not.toHaveBeenCalled();
    });

    it('should remove existing code if cooldown elapsed', async () => {
      const oldCode = { phone: sendCodeDto.phone, createdAt: new Date(Date.now() - 120000) };
      verificationCodesRepository.findOne.mockResolvedValue(oldCode as any);
      verificationCodesRepository.remove.mockResolvedValue(undefined);
      verificationCodesRepository.save.mockImplementation(async (code) => code);
      smsService.sendCode.mockResolvedValue({ success: true });

      const result = await service.sendCode(sendCodeDto);

      expect(verificationCodesRepository.remove).toHaveBeenCalledWith(oldCode);
      expect(result).toEqual({ message: 'کد تایید ارسال شد' });
    });
  });

  describe('verifyCode', () => {
    it('should verify code and return token for existing user', async () => {
      const verificationCode = { phone: verifyCodeDto.phone, code: verifyCodeDto.code, expiresAt: new Date(Date.now() + 300000) };
      verificationCodesRepository.findOne.mockResolvedValue(verificationCode as any);
      verificationCodesRepository.remove.mockResolvedValue(undefined);
      usersService.findByPhone.mockResolvedValue(mockUser);
      usersService.findById.mockResolvedValue(mockUser);
      permissionsService.getRolePermissions.mockResolvedValue({ customer: [] });
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.verifyCode(verifyCodeDto);

      expect(verificationCodesRepository.findOne).toHaveBeenCalledWith({ where: { phone: verifyCodeDto.phone } });
      expect(verificationCodesRepository.remove).toHaveBeenCalledWith(verificationCode);
      expect(usersService.findByPhone).toHaveBeenCalledWith(verifyCodeDto.phone);
      expect(result).toHaveProperty('access_token');
      expect(result.user.phone).toBe(verifyCodeDto.phone);
    });

    it('should throw UnauthorizedException if verification code not found', async () => {
      verificationCodesRepository.findOne.mockResolvedValue(null);

      await expect(service.verifyCode(verifyCodeDto)).rejects.toThrow(UnauthorizedException);
      expect(verificationCodesRepository.findOne).toHaveBeenCalledWith({ where: { phone: verifyCodeDto.phone } });
    });

    it('should throw UnauthorizedException if code expired', async () => {
      const expiredCode = { phone: verifyCodeDto.phone, code: verifyCodeDto.code, expiresAt: new Date(Date.now() - 1000) };
      verificationCodesRepository.findOne.mockResolvedValue(expiredCode as any);
      verificationCodesRepository.remove.mockResolvedValue(undefined);

      await expect(service.verifyCode(verifyCodeDto)).rejects.toThrow(UnauthorizedException);
      expect(verificationCodesRepository.remove).toHaveBeenCalledWith(expiredCode);
    });

    it('should throw UnauthorizedException if code is incorrect', async () => {
      const verificationCode = { phone: verifyCodeDto.phone, code: '654321', expiresAt: new Date(Date.now() + 300000) };
      verificationCodesRepository.findOne.mockResolvedValue(verificationCode as any);

      await expect(service.verifyCode(verifyCodeDto)).rejects.toThrow(UnauthorizedException);
      expect(verificationCodesRepository.remove).not.toHaveBeenCalled();
    });

    it('should create new user if phone not registered', async () => {
      const verificationCode = { phone: verifyCodeDto.phone, code: verifyCodeDto.code, expiresAt: new Date(Date.now() + 300000) };
      const newUser = createTestUser({ phone: verifyCodeDto.phone });
      verificationCodesRepository.findOne.mockResolvedValue(verificationCode as any);
      verificationCodesRepository.remove.mockResolvedValue(undefined);
      usersService.findByPhone.mockResolvedValue(null);
      usersService.create.mockResolvedValue(newUser);
      usersService.markPasswordNotSet.mockResolvedValue(undefined);
      usersService.findById.mockResolvedValue(newUser);
      permissionsService.getRolePermissions.mockResolvedValue({ customer: [] });
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.verifyCode(verifyCodeDto);

      expect(usersService.findByPhone).toHaveBeenCalledWith(verifyCodeDto.phone);
      expect(usersService.create).toHaveBeenCalled();
      expect(usersService.markPasswordNotSet).toHaveBeenCalledWith(newUser.id);
      expect(result).toHaveProperty('access_token');
    });

    it('should throw UnauthorizedException if new user is inactive', async () => {
      const verificationCode = { phone: verifyCodeDto.phone, code: verifyCodeDto.code, expiresAt: new Date(Date.now() + 300000) };
      const inactiveUser = { ...mockUser, isActive: false, phone: verifyCodeDto.phone };
      verificationCodesRepository.findOne.mockResolvedValue(verificationCode as any);
      verificationCodesRepository.remove.mockResolvedValue(undefined);
      usersService.findByPhone.mockResolvedValue(inactiveUser);

      await expect(service.verifyCode(verifyCodeDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateToken', () => {
    it('should generate access token with correct payload', async () => {
      const userWithPermissions = { ...mockUser, permissions: [] };
      permissionsService.getRolePermissions.mockResolvedValue({ customer: [] });
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.generateToken(userWithPermissions);

      expect(jwtService.sign).toHaveBeenCalledWith(expect.objectContaining({
        sub: userWithPermissions.id,
        email: userWithPermissions.email,
        role: userWithPermissions.role,
      }));
      expect(result).toHaveProperty('access_token');
      expect(result.user).toMatchObject({
        id: userWithPermissions.id,
        email: userWithPermissions.email,
        firstName: userWithPermissions.firstName,
        lastName: userWithPermissions.lastName,
        phone: userWithPermissions.phone,
        role: userWithPermissions.role,
      });
    });

    it('should include user permissions and role permissions', async () => {
      const userPerms = [{ permission: { key: 'custom:perm' } }];
      const userWithPerms = { ...mockUser, permissions: userPerms };
      permissionsService.getRolePermissions.mockResolvedValue({ customer: ['orders:read'] });
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.generateToken(userWithPerms);

      expect(result.user.permissions).toContain('custom:perm');
      expect(result.user.permissions).toContain('orders:read');
    });
  });
});