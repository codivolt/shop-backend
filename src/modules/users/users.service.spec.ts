import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from './users.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';
import { createMockUserRepository, mockJwtService } from '../../../test/utils/mock-helpers';
import { createMockUser, createTestUser, createTestAdmin } from '../../../test/utils/test-factories';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<Partial<Repository<User>>> & {
    findByEmail: jest.Mock;
    findByPhone: jest.Mock;
    findById: jest.Mock;
    findByEmailWithPassword: jest.Mock;
    findByPhoneWithPassword: jest.Mock;
  };

  const mockAdmin = createTestAdmin();
  const mockUser = createTestUser();

  beforeEach(async () => {
    usersRepository = createMockUserRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      phone: '09123456789',
      role: UserRole.CUSTOMER,
    };

    it('should create a new user successfully', async () => {
      const newUser = createTestUser({ ...createUserDto, role: UserRole.CUSTOMER });
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.save.mockResolvedValue(newUser as any);

      const result = await service.create(createUserDto, UserRole.ADMIN);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(usersRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.password).toBeUndefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto, UserRole.ADMIN)).rejects.toThrow(ConflictException);
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if non-superadmin tries to create superadmin', async () => {
      const superAdminDto = { ...createUserDto, role: UserRole.SUPER_ADMIN };
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.create(superAdminDto, UserRole.ADMIN)).rejects.toThrow(BadRequestException);
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should allow superadmin to create superadmin', async () => {
      const superAdminDto = { ...createUserDto, role: UserRole.SUPER_ADMIN };
      const newSuperAdmin = createTestUser({ ...superAdminDto, role: UserRole.SUPER_ADMIN });
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.save.mockResolvedValue(newSuperAdmin as any);

      const result = await service.create(superAdminDto, UserRole.SUPER_ADMIN);

      expect(result.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should default to CUSTOMER role if not provided', async () => {
      const dtoWithoutRole = { ...createUserDto };
      delete dtoWithoutRole.role;
      const newUser = createTestUser({ ...dtoWithoutRole, role: UserRole.CUSTOMER });
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.save.mockResolvedValue(newUser as any);

      const result = await service.create(dtoWithoutRole, UserRole.ADMIN);

      expect(result.role).toBe(UserRole.CUSTOMER);
    });

    it('should set passwordSetAt to current date', async () => {
      const newUser = createTestUser({ ...createUserDto });
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.save.mockResolvedValue(newUser as any);

      const result = await service.create(createUserDto, UserRole.ADMIN);

      expect(result.passwordSetAt).toBeDefined();
      expect(result.passwordSetAt).toBeInstanceOf(Date);
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByPhone', () => {
    it('should return user if found', async () => {
      usersRepository.findByPhone.mockResolvedValue(mockUser);

      const result = await service.findByPhone(mockUser.phone);

      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      usersRepository.findByPhone.mockResolvedValue(null);

      const result = await service.findByPhone('09999999999');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user with permissions if found', async () => {
      const userWithPerms = { ...mockUser, permissions: [{ permission: { key: 'test:perm' } }] };
      usersRepository.findById.mockResolvedValue(userWithPerms);

      const result = await service.findById(mockUser.id);

      expect(result).toEqual(userWithPerms);
      expect(usersRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return null if not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      const result = await service.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    const query: UserQueryDto = { page: 1, limit: 10 };

    it('should return paginated users', async () => {
      const users = [mockUser, createTestUser({ email: 'user2@example.com' })];
      usersRepository.findAndCount.mockResolvedValue([users, users.length]);

      const result = await service.findAll(query);

      expect(result.data).toEqual(users);
      expect(result.total).toBe(users.length);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by role', async () => {
      const adminUser = createTestAdmin();
      usersRepository.findAndCount.mockResolvedValue([[adminUser], 1]);

      const result = await service.findAll({ ...query, role: UserRole.ADMIN });

      expect(usersRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ role: UserRole.ADMIN }),
      }));
    });

    it('should filter by isActive', async () => {
      usersRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAll({ ...query, isActive: true });

      expect(usersRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }));
    });

    it('should search by term across multiple fields', async () => {
      usersRepository.findAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.findAll({ ...query, search: 'test' });

      expect(usersRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.arrayContaining([
          expect.objectContaining({ email: expect.anything() }),
          expect.objectContaining({ firstName: expect.anything() }),
          expect.objectContaining({ lastName: expect.anything() }),
          expect.objectContaining({ phone: expect.anything() }),
        ]),
      }));
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue(updatedUser as any);

      const result = await service.update(mockUser.id, updateUserDto, UserRole.ADMIN);

      expect(usersRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(usersRepository.merge).toHaveBeenCalled();
      expect(result.firstName).toBe('Updated');
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateUserDto, UserRole.ADMIN)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if non-superadmin tries to assign superadmin role', async () => {
      const dtoWithSuperAdmin = { ...updateUserDto, role: UserRole.SUPER_ADMIN };
      usersRepository.findById.mockResolvedValue(mockUser);

      await expect(service.update(mockUser.id, dtoWithSuperAdmin, UserRole.ADMIN)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto: UpdateProfileDto = {
      firstName: 'Updated',
      lastName: 'Profile',
      phone: '09121112233',
    };

    it('should update profile successfully', async () => {
      const updatedUser = { ...mockUser, ...updateProfileDto };
      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.findByPhone.mockResolvedValue(null);
      usersRepository.save.mockResolvedValue(updatedUser as any);

      const result = await service.updateProfile(mockUser.id, updateProfileDto);

      expect(result.firstName).toBe('Updated');
      expect(result.phone).toBe('09121112233');
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      await expect(service.updateProfile('nonexistent', updateProfileDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if phone already taken by another user', async () => {
      const otherUser = createTestUser({ phone: '09121112233', email: 'other@example.com' });
      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.findByPhone.mockResolvedValue(otherUser);

      await expect(service.updateProfile(mockUser.id, updateProfileDto)).rejects.toThrow(ConflictException);
    });

    it('should update email if phone changed and email is phone-based', async () => {
      const userWithPhoneEmail = { ...mockUser, email: '09123456789@phone.local' };
      usersRepository.findById.mockResolvedValue(userWithPhoneEmail);
      usersRepository.findByPhone.mockResolvedValue(null);
      usersRepository.save.mockResolvedValue({ ...userWithPhoneEmail, phone: '09121112233', email: '09121112233@phone.local' } as any);

      const result = await service.updateProfile(userWithPhoneEmail.id, { phone: '09121112233' });

      expect(result.email).toBe('09121112233@phone.local');
    });

    it('should validate national ID format', async () => {
      const dtoWithNationalId = { ...updateProfileDto, nationalId: '1234567890' };
      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.findByPhone.mockResolvedValue(null);
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.updateProfile(mockUser.id, dtoWithNationalId)).rejects.toThrow(BadRequestException);
    });

    it('should accept valid national ID', async () => {
      const validNationalId = '0078462917';
      const dtoWithNationalId = { ...updateProfileDto, nationalId: validNationalId };
      usersRepository.findById.mockResolvedValue(mockUser);
      usersRepository.findByPhone.mockResolvedValue(null);
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.save.mockResolvedValue({ ...mockUser, nationalId: validNationalId } as any);

      const result = await service.updateProfile(mockUser.id, dtoWithNationalId);

      expect(result.nationalId).toBe(validNationalId);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    it('should change password if current password is correct', async () => {
      const userWithPassword = { ...mockUser, password: '$2b$10$hashedpassword', validatePassword: jest.fn().mockResolvedValue(true) };
      usersRepository.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(userWithPassword),
      });
      usersRepository.save.mockResolvedValue({ ...userWithPassword, password: 'newPassword123', passwordSetAt: new Date() } as any);

      await service.changePassword(mockUser.id, changePasswordDto);

      expect(userWithPassword.validatePassword).toHaveBeenCalledWith('oldPassword123');
      expect(usersRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      await expect(service.changePassword('nonexistent', changePasswordDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if current password required but not provided', async () => {
      const userWithPasswordSet = { ...mockUser, passwordSetAt: new Date(), validatePassword: jest.fn() };
      usersRepository.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(userWithPasswordSet),
      });

      const dtoWithoutCurrent = { ...changePasswordDto, currentPassword: undefined };

      await expect(service.changePassword(mockUser.id, dtoWithoutCurrent)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      const userWithPassword = { ...mockUser, validatePassword: jest.fn().mockResolvedValue(false) };
      usersRepository.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(userWithPassword),
      });

      await expect(service.changePassword(mockUser.id, changePasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should allow password change without current password if not set before', async () => {
      const userWithoutPassword = { ...mockUser, passwordSetAt: null, password: null, validatePassword: jest.fn() };
      usersRepository.createQueryBuilder.mockReturnValue({
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(userWithoutPassword),
      });
      usersRepository.save.mockResolvedValue({ ...userWithoutPassword, password: 'newPassword123', passwordSetAt: new Date() } as any);

      const dtoWithoutCurrent = { newPassword: 'newPassword123' } as ChangePasswordDto;

      await service.changePassword(mockUser.id, dtoWithoutCurrent);

      expect(usersRepository.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockUser.id);

      expect(usersRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markPasswordNotSet', () => {
    it('should update passwordSetAt to null', async () => {
      usersRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

      await service.markPasswordNotSet(mockUser.id);

      expect(usersRepository.update).toHaveBeenCalledWith(mockUser.id, { passwordSetAt: null });
    });
  });

  describe('search', () => {
    it('should search users by term', async () => {
      const users = [mockUser];
      usersRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(users),
      });

      const result = await service.search('test', 10);

      expect(result).toEqual(users);
    });
  });

  describe('stripPassword', () => {
    it('should remove password from user object', () => {
      const userWithPassword = { ...mockUser, password: 'secret' };
      const result = (service as any).stripPassword(userWithPassword);

      expect(result.password).toBeUndefined();
      expect(result.email).toBe(userWithPassword.email);
    });
  });
});