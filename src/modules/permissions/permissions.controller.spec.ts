import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Permission } from './permission.entity';
import { CreatePermissionDto, UpdatePermissionDto, AssignRoleDto, AssignPermissionDto } from './dto/permission.dto';
import { createTestPermission, createTestUser } from '../../../test/utils/test-factories';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let permissionsService: jest.Mocked<Partial<PermissionsService>>;

  const mockPermission = createTestPermission();
  const mockUser = createTestUser();

  beforeEach(async () => {
    permissionsService = {
      createPermission: jest.fn(),
      findAllPermissions: jest.fn(),
      findPermissionByKey: jest.fn(),
      getRolePermissions: jest.fn(),
      getUserPermissions: jest.fn(),
      assignRole: jest.fn(),
      assignPermissionToUser: jest.fn(),
      removePermissionFromUser: jest.fn(),
      hasPermission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        { provide: PermissionsService, useValue: permissionsService },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
    jest.clearAllMocks();
  });

  describe('createPermission', () => {
    const createDto: CreatePermissionDto = {
      key: 'products:write',
      name: 'Write Products',
      description: 'Permission to create/update products',
      module: 'products',
    };

    it('should create permission and return it', async () => {
      const newPermission = createTestPermission({ ...createDto });
      permissionsService.createPermission.mockResolvedValue(newPermission);

      const result = await controller.createPermission(createDto);

      expect(permissionsService.createPermission).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(newPermission);
    });

    it('should throw ConflictException if key exists', async () => {
      permissionsService.createPermission.mockRejectedValue(new ConflictException('کلید مجوز تکراری است'));

      await expect(controller.createPermission(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllPermissions', () => {
    it('should return all permissions', async () => {
      const permissions = [mockPermission];
      permissionsService.findAllPermissions.mockResolvedValue(permissions);

      const result = await controller.findAllPermissions();

      expect(permissionsService.findAllPermissions).toHaveBeenCalled();
      expect(result).toEqual(permissions);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions grouped by role', async () => {
      const rolePerms = { admin: ['*'], manager: ['products:read'] };
      permissionsService.getRolePermissions.mockResolvedValue(rolePerms);

      const result = await controller.getRolePermissions();

      expect(permissionsService.getRolePermissions).toHaveBeenCalled();
      expect(result).toEqual(rolePerms);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const userPerms = ['products:read', 'orders:read'];
      permissionsService.getUserPermissions.mockResolvedValue(userPerms);

      const result = await controller.getUserPermissions(mockUser.id);

      expect(permissionsService.getUserPermissions).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(userPerms);
    });
  });

  describe('assignRole', () => {
    const assignRoleDto: AssignRoleDto = {
      role: 'admin',
      permissionKeys: ['products:read', 'products:write'],
    };

    it('should assign permissions to role', async () => {
      const result = [{ role: 'admin', permissionKey: 'products:read' }, { role: 'admin', permissionKey: 'products:write' }];
      permissionsService.assignRole.mockResolvedValue(result);

      const response = await controller.assignRole(assignRoleDto);

      expect(permissionsService.assignRole).toHaveBeenCalledWith(assignRoleDto);
      expect(response).toEqual(result);
    });
  });

  describe('assignPermissionToUser', () => {
    const assignPermissionDto: AssignPermissionDto = {
      userId: mockUser.id,
      permissionKey: 'custom:perm',
    };

    it('should assign permission to user', async () => {
      const result = { userId: mockUser.id, permissionKey: 'custom:perm' };
      permissionsService.assignPermissionToUser.mockResolvedValue(result);

      const response = await controller.assignPermissionToUser(assignPermissionDto);

      expect(permissionsService.assignPermissionToUser).toHaveBeenCalledWith(assignPermissionDto);
      expect(response).toEqual(result);
    });
  });

  describe('removePermissionFromUser', () => {
    it('should remove permission from user', async () => {
      permissionsService.removePermissionFromUser.mockResolvedValue({ success: true });

      const result = await controller.removePermissionFromUser(mockUser.id, 'custom:perm');

      expect(permissionsService.removePermissionFromUser).toHaveBeenCalledWith(mockUser.id, 'custom:perm');
      expect(result).toEqual({ success: true });
    });
  });

  describe('hasPermission', () => {
    it('should check if user has permission', async () => {
      permissionsService.hasPermission.mockResolvedValue(true);

      const result = await controller.hasPermission(mockUser.id, 'custom:perm');

      expect(permissionsService.hasPermission).toHaveBeenCalledWith(mockUser.id, 'custom:perm');
      expect(result).toEqual({ hasPermission: true });
    });
  });
});