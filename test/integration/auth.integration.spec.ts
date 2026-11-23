import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { User, UserRole } from '../../src/modules/users/users.entity';
import { VerificationCode } from '../../src/modules/auth/verification-code.entity';
import { createIntegrationModule, getRepository, createMockUser, createTestUser } from '../setup/integration.setup';

describe('Auth Module Integration Tests', () => {
  let module: TestingModule;
  let authService: AuthService;
  let usersService: UsersService;
  let userRepository: Repository<User>;
  let verificationCodeRepository: Repository<VerificationCode>;

  beforeAll(async () => {
    module = await createIntegrationModule([
      AuthModule,
      UsersModule,
    ]);

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    userRepository = getRepository(module, User);
    verificationCodeRepository = getRepository(module, VerificationCode);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await userRepository.clear();
    await verificationCodeRepository.clear();
  });

  describe('Full Auth Flow', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'integration@example.com',
        password: 'password123',
        firstName: 'Integration',
        lastName: 'Test',
        phone: '09123456789',
      };

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('access_token');
      expect(result.user).toMatchObject({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role: UserRole.CUSTOMER,
      });

      const savedUser = await userRepository.findOne({ where: { email: registerDto.email } });
      expect(savedUser).toBeDefined();
      expect(savedUser!.password).toBeUndefined();
    });

    it('should not allow duplicate email registration', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '09123456789',
      };

      await authService.register(registerDto);

      await expect(authService.register(registerDto)).rejects.toThrow('ایمیل قبلاً ثبت شده است');
    });

    it('should send and verify OTP code', async () => {
      const phone = '09121112233';

      // Send code
      const sendResult = await authService.sendCode({ phone });
      expect(sendResult).toEqual({ message: 'کد تایید ارسال شد' });

      // Get the saved code
      const verificationCode = await verificationCodeRepository.findOne({ where: { phone } });
      expect(verificationCode).toBeDefined();

      // Verify code
      const verifyResult = await authService.verifyCode({ phone, code: verificationCode!.code });
      expect(verifyResult).toHaveProperty('access_token');
      expect(verifyResult.user.phone).toBe(phone);
    });

    it('should reject invalid OTP code', async () => {
      const phone = '09129998877';
      await authService.sendCode({ phone });

      await expect(authService.verifyCode({ phone, code: '000000' })).rejects.toThrow('کد تایید اشتباه است');
    });

    it('should reject expired OTP code', async () => {
      const phone = '09128887766';
      await verificationCodeRepository.save({
        phone,
        code: '123456',
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(authService.verifyCode({ phone, code: '123456' })).rejects.toThrow('کد تایید منقضی شده است');
    });

    it('should login with phone and password', async () => {
      const user = createTestUser({ phone: '09127776655', password: 'password123' });
      await userRepository.save(user);

      const validatedUser = await authService.validateUserByPhone('09127776655', 'password123');
      expect(validatedUser).toBeDefined();
      expect(validatedUser.phone).toBe('09127776655');

      const loginResult = await authService.login(validatedUser);
      expect(loginResult).toHaveProperty('access_token');
    });

    it('should throw on invalid password', async () => {
      const user = createTestUser({ phone: '09126665544', password: 'password123' });
      await userRepository.save(user);

      await expect(authService.validateUserByPhone('09126665544', 'wrongpassword')).rejects.toThrow('شماره موبایل یا رمز عبور اشتباه است');
    });

    it('should throw on inactive user', async () => {
      const user = createTestUser({ phone: '09125554433', isActive: false });
      await userRepository.save(user);

      await expect(authService.validateUserByPhone('09125554433', 'password123')).rejects.toThrow('حساب کاربری غیرفعال است');
    });
  });

  describe('Token Generation', () => {
    it('should generate token with correct user info and permissions', async () => {
      const user = createTestUser({ role: UserRole.ADMIN });
      await userRepository.save(user);

      const token = await authService.generateToken(user);

      expect(token.access_token).toBeDefined();
      expect(token.user).toMatchObject({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: UserRole.ADMIN,
      });
      expect(token.user.permissions).toBeInstanceOf(Array);
    });

    it('should include role-based permissions', async () => {
      const adminUser = createTestUser({ role: UserRole.ADMIN });
      await userRepository.save(adminUser);

      const token = await authService.generateToken(adminUser);

      expect(token.user.permissions).toContain('orders:read');
      expect(token.user.permissions).toContain('products:read');
    });
  });
});