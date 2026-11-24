import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { UsersModule } from '../../src/modules/users/users.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersService } from '../../src/modules/users/users.service';
import { User, UserRole } from '../../src/modules/users/users.entity';
import {
  CreateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from '../../src/modules/users/dto/create-user.dto';
import { UserQueryDto } from '../../src/modules/users/dto/user-query.dto';
import {
  createIntegrationModule,
  getRepository,
  createMockUser,
  createTestUser,
  createTestAdmin,
} from '../setup/integration.setup';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('Users Module Integration Tests', () => {
  let module: TestingModule;
  let usersService: UsersService;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    module = await createIntegrationModule([UsersModule, AuthModule]);

    usersService = module.get<UsersService>(UsersService);
    userRepository = getRepository(module, User);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await userRepository.clear();
  });

  describe('User CRUD Operations', () => {
    it('should create user with admin role', async () => {
      const admin = createTestAdmin();
      await userRepository.save(admin);

      const createDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '09123456789',
        role: UserRole.CUSTOMER,
      };

      const result = await usersService.create(createDto, UserRole.ADMIN);

      expect(result).toMatchObject({
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        phone: createDto.phone,
        role: UserRole.CUSTOMER,
      });
      expect(result.password).toBeUndefined();
    });

    it('should throw ConflictException on duplicate email', async () => {
      const admin = createTestAdmin();
      await userRepository.save(admin);

      const createDto: CreateUserDto = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '09123456789',
      };

      await usersService.create(createDto, UserRole.ADMIN);

      await expect(
        usersService.create(createDto, UserRole.ADMIN),
      ).rejects.toThrow(ConflictException);
    });

    it('should not allow admin to create superadmin', async () => {
      const admin = createTestAdmin();
      await userRepository.save(admin);

      const createDto: CreateUserDto = {
        email: 'superadmin@example.com',
        password: 'password123',
        firstName: 'Super',
        lastName: 'Admin',
        role: UserRole.SUPER_ADMIN,
      };

      await expect(
        usersService.create(createDto, UserRole.ADMIN),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow superadmin to create superadmin', async () => {
      const superAdmin = createTestUser({
        role: UserRole.SUPER_ADMIN,
        email: 'super@example.com',
      });
      await userRepository.save(superAdmin);

      const createDto: CreateUserDto = {
        email: 'newsuper@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'SuperAdmin',
        role: UserRole.SUPER_ADMIN,
      };

      const result = await usersService.create(createDto, UserRole.SUPER_ADMIN);
      expect(result.role).toBe(UserRole.SUPER_ADMIN);
    });
  });

  describe('Find Operations', () => {
    const testUsers = [
      createTestUser({
        email: 'user1@example.com',
        firstName: 'User',
        lastName: 'One',
      }),
      createTestUser({
        email: 'user2@example.com',
        firstName: 'User',
        lastName: 'Two',
      }),
      createTestAdmin({ email: 'admin@example.com' }),
    ];

    beforeEach(async () => {
      await userRepository.save(testUsers);
    });

    it('should find user by email', async () => {
      const user = await usersService.findByEmail('user1@example.com');
      expect(user).toBeDefined();
      expect(user!.email).toBe('user1@example.com');
    });

    it('should find user by phone', async () => {
      const user = await usersService.findByPhone(testUsers[0].phone);
      expect(user).toBeDefined();
      expect(user!.phone).toBe(testUsers[0].phone);
    });

    it('should find user by id with permissions', async () => {
      const user = await usersService.findById(testUsers[0].id);
      expect(user).toBeDefined();
      expect(user!.id).toBe(testUsers[0].id);
    });

    it('should return paginated users', async () => {
      const query: UserQueryDto = { page: 1, limit: 10 };
      const result = await usersService.findAll(query);

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter users by role', async () => {
      const query: UserQueryDto = { page: 1, limit: 10, role: UserRole.ADMIN };
      const result = await usersService.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].role).toBe(UserRole.ADMIN);
    });

    it('should filter users by isActive', async () => {
      const query: UserQueryDto = { page: 1, limit: 10, isActive: true };
      const result = await usersService.findAll(query);

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((user) => expect(user.isActive).toBe(true));
    });

    it('should search users by term', async () => {
      const query: UserQueryDto = { page: 1, limit: 10, search: 'user1' };
      const result = await usersService.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('user1@example.com');
    });
  });

  describe('Update Operations', () => {
    let testUser: User;
    let testAdmin: User;

    beforeEach(async () => {
      testUser = createTestUser({ email: 'update@example.com' });
      testAdmin = createTestAdmin();
      await userRepository.save([testUser, testAdmin]);
    });

    it('should update user profile', async () => {
      const updateDto: UpdateProfileDto = {
        firstName: 'Updated',
        lastName: 'Profile',
        phone: '09121112233',
      };

      const result = await usersService.updateProfile(testUser.id, updateDto);

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Profile');
      expect(result.phone).toBe('09121112233');
    });

    it('should throw ConflictException if phone taken', async () => {
      const updateDto: UpdateProfileDto = {
        phone: testUser.phone,
      };

      await expect(
        usersService.updateProfile(testAdmin.id, updateDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should update user by admin', async () => {
      const updateDto = {
        firstName: 'Admin Updated',
        isActive: false,
      };

      const result = await usersService.update(
        testUser.id,
        updateDto,
        UserRole.ADMIN,
      );

      expect(result.firstName).toBe('Admin Updated');
      expect(result.isActive).toBe(false);
    });

    it('should not allow admin to assign superadmin role', async () => {
      await expect(
        usersService.update(
          testUser.id,
          { role: UserRole.SUPER_ADMIN },
          UserRole.ADMIN,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should change password', async () => {
      const userWithPassword = createTestUser({
        email: 'password@example.com',
        password: 'oldPassword123',
      });
      await userRepository.save(userWithPassword);

      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      await usersService.changePassword(userWithPassword.id, changePasswordDto);

      const updatedUser = await userRepository.findOne({
        where: { id: userWithPassword.id },
      });
      expect(updatedUser!.passwordSetAt).toBeDefined();
    });

    it('should throw if current password incorrect', async () => {
      const userWithPassword = createTestUser({
        email: 'password2@example.com',
        password: 'oldPassword123',
      });
      await userRepository.save(userWithPassword);

      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      await expect(
        usersService.changePassword(userWithPassword.id, changePasswordDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow password change without current password if not set before', async () => {
      const userWithoutPassword = createTestUser({
        email: 'nopass@example.com',
        passwordSetAt: null,
      });
      await userRepository.save(userWithoutPassword);

      const changePasswordDto: ChangePasswordDto = {
        newPassword: 'firstPassword123',
      };

      await usersService.changePassword(
        userWithoutPassword.id,
        changePasswordDto,
      );

      const updatedUser = await userRepository.findOne({
        where: { id: userWithoutPassword.id },
      });
      expect(updatedUser!.passwordSetAt).toBeDefined();
    });
  });

  describe('Delete Operations', () => {
    it('should delete user', async () => {
      const user = createTestUser({ email: 'delete@example.com' });
      await userRepository.save(user);

      await usersService.remove(user.id);

      const deletedUser = await userRepository.findOne({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should throw NotFoundException if user not found', async () => {
      await expect(usersService.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('National ID Validation', () => {
    it('should accept valid national ID', async () => {
      const user = createTestUser({ email: 'nid@example.com' });
      await userRepository.save(user);

      const updateDto: UpdateProfileDto = { nationalId: '0078462917' };
      const result = await usersService.updateProfile(user.id, updateDto);

      expect(result.nationalId).toBe('0078462917');
    });

    it('should reject invalid national ID format', async () => {
      const user = createTestUser({ email: 'nid2@example.com' });
      await userRepository.save(user);

      const updateDto: UpdateProfileDto = { nationalId: '1234567890' };
      await expect(
        usersService.updateProfile(user.id, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject all-same-digits national ID', async () => {
      const user = createTestUser({ email: 'nid3@example.com' });
      await userRepository.save(user);

      const updateDto: UpdateProfileDto = { nationalId: '1111111111' };
      await expect(
        usersService.updateProfile(user.id, updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
