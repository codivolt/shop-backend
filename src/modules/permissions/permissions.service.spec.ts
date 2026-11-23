import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionsService } from './permissions.service';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { UserPermission } from './user-permission.entity';
import { User } from '../users/users.entity';
import { CreatePermissionDto, UpdatePermissionDto, AssignRoleDto, AssignPermissionDto } from './dto/permission.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import { createTestPermission, createTestUser } from '../../../test/utils/test-factories';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepository: jest.Mocked<Partial<Repository<Permission>>>;
  let rolePermissionRepository: jest.Mocked<Partial<Repository<RolePermission>>>;
  let userPermissionRepository: jest.Mocked<Partial<Repository<UserPermission>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  const mockPermission = createTestPermission();
  const mockUser = createTestUser();

  beforeEach(async () => {
    permissionRepository = createMockRepository<Permission>();
    rolePermissionRepository = createMockRepository<RolePermission>();
    userPermissionRepository = createMockRepository<UserPermission>();
    userRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: getRepositoryToken(Permission), useValue: permissionRepository },
        { provide: getRepositoryToken(RolePermission), useValue: rolePermissionRepository },
        { provide: getRepositoryToken(UserPermission), useValue: userPermissionRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    jest.clearAllMocks();
  });

  describe('createPermission', () => {
    const createDto: CreatePermissionDto = {
      key: 'products:write',
      name: 'Write Products',
      description: 'Permission to create/update products',
      module: 'products',
    };

    it('should create a new permission successfully', async () => {
      const newPermission = createTestPermission({ ...createDto });
      permissionRepository.save.mockResolvedValue(newPermission as any);

      const result = await service.createPermission(createDto);

      expect(permissionRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject(createDto);
    });

    it('should throw ConflictException if key already exists', async () => {
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      await expect(service.createPermission({ ...createDto, key: mockPermission.key })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllPermissions', () => {
    it('should return all permissions', async () => {
      const permissions = [mockPermission, createTestPermission({ key: 'orders:write', module: 'orders' })];
      permissionRepository.find.mockResolvedValue(permissions);

      const result = await service.findAllPermissions();

      expect(permissionRepository.find).toHaveBeenCalledWith({ order: { module: 'ASC', key: 'ASC' } });
      expect(result).toEqual(permissions);
    });
  });

  describe('findPermissionByKey', () => {
    it('should return permission by key', async () => {
      permissionRepository.findOne.mockResolvedValue(mockPermission);

      const result = await service.findPermissionByKey(mockPermission.key);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({ where: { key: mockPermission.key } });
      expect(result).toEqual(mockPermission);
    });
  });

  describe('getRolePermissions', () => {
    it('should return permissions grouped by role', async () => {
      const rolePerms = [
        { role: 'admin', permission: mockPermission },
        { role: 'manager', permission: createTestPermission({ key: 'orders:write', module: 'orders' }) },
      ];
      rolePermissionRepository.find.mockResolvedValue(rolePerms as any);

      const result = await service.getRolePermissions();

      expect(rolePermissionRepository.find).toHaveBeenCalledWith({ relations: ['permission'] });
      expect(result).toHaveProperty('admin');
      expect(result).toHaveProperty('manager');
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const userPerms = [
        { userId: mockUser.id, permission: mockPermission },
      ];
      userPermissionRepository.find.mockResolvedValue(userPerms as any);

      const result = await service.getUserPermissions(mockUser.id);

      expect(userPermissionRepository.find).toHaveBeenCalledWith({ where: { userId: mockUser.id }, relations: ['permission'] });
      expect(result).toContain(mockPermission.key);
    });
  });

  describe('assignRole', () => {
    const assignRoleDto: AssignRoleDto = {
      role: 'admin',
      permissionKeys: ['products:read', 'products:write'],
    };

    it('should assign permissions to role', async () => {
      const perm1 = createTestPermission({ key: 'products:read' });
      const perm2 = createTestPermission({ key: 'products:write' });
      permissionRepository.findOne.mockResolvedValueOnce(perm1).mockResolvedValueOnce(perm2);
      rolePermissionRepository.save.mockResolvedValue([
        { role: 'admin', permissionId: perm1.id, permission: perm1 },
        { role: 'admin', permissionId: perm2.id, permission: perm2 },
      ] as any);

      const result = await service.assignRole(assignRoleDto);

      expect(permissionRepository.findOne).toHaveBeenCalledTimes(2);
      expect(rolePermissionRepository.save).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException if permission not found', async () => {
      permissionRepository.findOne.mockResolvedValue(null);

      await expect(service.assignRole({ role: 'admin', permissionKeys: ['nonexistent'] })).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignPermissionToUser', () => {
    const assignPermissionDto: AssignPermissionDto = {
      userId: mockUser.id,
      permissionKey: 'custom:perm',
    };

    it('should assign permission to user', async () => {
      const permission = createTestPermission({ key: 'custom:perm' });
      permissionRepository.findOne.mockResolvedValue(permission);
      userRepository.findOne.mockResolvedValue(mockUser);
      userPermissionRepository.save.mockResolvedValue({ userId: mockUser.id, permissionId: permission.id, permission } as any);

      const result = await service.assignPermissionToUser(assignPermissionDto);

      expect(permissionRepository.findOne).toHaveBeenCalledWith({ where: { key: assignPermissionDto.permissionKey } });
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: assignPermissionDto.userId } });
      expect(userPermissionRepository.save).toHaveBeenCalled();
      expect(result.permission.key).toBe('custom:perm');
    });

    it('should throw NotFoundException if user not found', async () => {
      permissionRepository.findOne.mockResolvedValue(createTestPermission({ key: 'custom:perm' }));
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.assignPermissionToUser(assignPermissionDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('removePermissionFromUser', () => {
    it('should remove permission from user', async () => {
      userPermissionRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.removePermissionFromUser(mockUser.id, 'custom:perm');

      expect(userPermissionRepository.delete).toHaveBeenCalledWith({ userId: mockUser.id, permission: { key: 'custom:perm' } });
    });

    it('should throw NotFoundException if user permission not found', async () => {
      userPermissionRepository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.removePermissionFromUser(mockUser.id, 'custom:perm')).rejects.toThrow(NotFoundException);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', async () => {
      userPermissionRepository.findOne.mockResolvedValue({ userId: mockUser.id, permissionId: 'perm-id' } as any);

      const result = await service.hasPermission(mockUser.id, 'custom:perm');

      expect(userPermissionRepository.findOne).toHaveBeenCalledWith({ where: { userId: mockUser.id, permission: { key: 'custom:perm' } } });
      expect(result).toBe(true);
    });

    it('should return false if user does not have permission', async () => {
      userPermissionRepository.findOne.mockResolvedValue(null);

      const result = await service.hasPermission(mockUser.id, 'custom:perm');

      expect(result).toBe(false);
    });
  });
});