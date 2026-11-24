import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserRole } from './users.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  createMockUser,
  createTestUser,
  createTestAdmin,
} from '../../../test/utils/test-factories';
import { PERMISSIONS } from '../auth/constants';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Partial<UsersService>>;

  const mockUser = createTestUser();
  const mockAdmin = createTestAdmin();
  const mockPaginatedResponse: PaginatedResponse<User> = {
    data: [mockUser],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      phone: '09123456789',
    };

    it('should create user and return it', async () => {
      const newUser = createTestUser({ ...createUserDto });
      usersService.create.mockResolvedValue(newUser);

      const result = await controller.create(createUserDto, mockAdmin);

      expect(usersService.create).toHaveBeenCalledWith(
        createUserDto,
        UserRole.ADMIN,
      );
      expect(result).toEqual(newUser);
    });

    it('should throw ConflictException if email exists', async () => {
      usersService.create.mockRejectedValue(
        new ConflictException('ایمیل قبلاً ثبت شده است'),
      );

      await expect(controller.create(createUserDto, mockAdmin)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if non-superadmin creates superadmin', async () => {
      const superAdminDto = { ...createUserDto, role: UserRole.SUPER_ADMIN };
      usersService.create.mockRejectedValue(
        new BadRequestException(
          'فقط مدیر فوق العاده می‌تواند نقش مدیر فوق العاده تخصیص دهد',
        ),
      );

      await expect(controller.create(superAdminDto, mockAdmin)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('me', () => {
    it('should return current user', async () => {
      const result = await controller.me(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateMe', () => {
    const updateProfileDto: UpdateProfileDto = {
      firstName: 'Updated',
      lastName: 'Profile',
    };

    it('should update current user profile', async () => {
      const updatedUser = { ...mockUser, ...updateProfileDto };
      usersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateMe(mockUser, updateProfileDto);

      expect(usersService.updateProfile).toHaveBeenCalledWith(
        mockUser.id,
        updateProfileDto,
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    it('should change password and return success message', async () => {
      usersService.changePassword.mockResolvedValue(undefined);

      const result = await controller.changePassword(
        mockUser,
        changePasswordDto,
      );

      expect(usersService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto,
      );
      expect(result).toEqual({ message: 'رمز عبور با موفقیت به‌روزرسانی شد' });
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar and update profile', async () => {
      const mockFile = {
        filename: 'avatar-123.jpg',
        originalname: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const updatedUser = {
        ...mockUser,
        avatarUrl: '/uploads/avatars/avatar-123.jpg',
      };
      usersService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.uploadAvatar(mockUser, mockFile);

      expect(usersService.updateProfile).toHaveBeenCalledWith(mockUser.id, {
        avatarUrl: '/uploads/avatars/avatar-123.jpg',
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw BadRequestException if no file provided', async () => {
      await expect(
        controller.uploadAvatar(mockUser, undefined),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const query: UserQueryDto = { page: 1, limit: 10 };

    it('should return paginated users', async () => {
      usersService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query);

      expect(usersService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should pass query parameters correctly', async () => {
      const queryWithFilters: UserQueryDto = {
        page: 2,
        limit: 5,
        role: UserRole.CUSTOMER,
        isActive: true,
        search: 'test',
      };
      usersService.findAll.mockResolvedValue(mockPaginatedResponse);

      await controller.findAll(queryWithFilters);

      expect(usersService.findAll).toHaveBeenCalledWith(queryWithFilters);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      usersService.findById.mockResolvedValue(mockUser);

      const result = await controller.findOne(mockUser.id);

      expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update user and return it', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(
        mockUser.id,
        updateUserDto,
        mockAdmin,
      );

      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto,
        UserRole.ADMIN,
      );
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersService.update.mockRejectedValue(
        new NotFoundException('کاربر یافت نشد'),
      );

      await expect(
        controller.update('nonexistent', updateUserDto, mockAdmin),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if non-superadmin assigns superadmin role', async () => {
      const dtoWithSuperAdmin = {
        ...updateUserDto,
        role: UserRole.SUPER_ADMIN,
      };
      usersService.update.mockRejectedValue(
        new BadRequestException(
          'فقط مدیر فوق العاده می‌تواند نقش مدیر فوق العاده تخصیص دهد',
        ),
      );

      await expect(
        controller.update(mockUser.id, dtoWithSuperAdmin, mockAdmin),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should delete user and return success message', async () => {
      usersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockUser.id);

      expect(usersService.remove).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: 'کاربر با موفقیت حذف شد' });
    });

    it('should throw NotFoundException if user not found', async () => {
      usersService.remove.mockRejectedValue(
        new NotFoundException('کاربر یافت نشد'),
      );

      await expect(controller.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
