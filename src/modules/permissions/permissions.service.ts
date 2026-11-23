import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserRole } from '../users/users.entity';
import {
  AssignPermissionsDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './dto/permission.dto';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';

const DEFAULT_PERMISSIONS = [
  {
    key: 'users.view',
    name: 'مشاهده کاربران',
    description: 'مشاهده لیست کاربران',
  },
  { key: 'users.create', name: 'ایجاد کاربر', description: 'ایجاد کاربر جدید' },
  {
    key: 'products.view',
    name: 'مشاهده محصولات',
    description: 'مشاهده لیست محصولات',
  },
  {
    key: 'products.create',
    name: 'ایجاد محصول',
    description: 'ایجاد محصول جدید',
  },
  {
    key: 'products.update',
    name: 'ویرایش محصول',
    description: 'بروزرسانی محصول',
  },
  { key: 'products.delete', name: 'حذف محصول', description: 'حذف محصول' },
  {
    key: 'brands.view',
    name: 'مشاهده برندها',
    description: 'مشاهده لیست برندها',
  },
  { key: 'brands.create', name: 'ایجاد برند', description: 'ایجاد برند جدید' },
  { key: 'brands.update', name: 'ویرایش برند', description: 'بروزرسانی برند' },
  {
    key: 'categories.view',
    name: 'مشاهده دسته‌بندی‌ها',
    description: 'مشاهده لیست دسته‌بندی‌ها',
  },
  {
    key: 'categories.create',
    name: 'ایجاد دسته‌بندی',
    description: 'ایجاد دسته‌بندی جدید',
  },
  {
    key: 'categories.update',
    name: 'ویرایش دسته‌بندی',
    description: 'بروزرسانی دسته‌بندی',
  },
  {
    key: 'categories.delete',
    name: 'حذف دسته‌بندی',
    description: 'حذف دسته‌بندی',
  },
  {
    key: 'categories.attributes.view',
    name: 'مشاهده ویژگی‌ها',
    description: 'مشاهده ویژگی‌های دسته‌بندی',
  },
  {
    key: 'categories.attributes.create',
    name: 'ایجاد ویژگی',
    description: 'افزودن ویژگی به دسته‌بندی',
  },
  {
    key: 'categories.attributes.update',
    name: 'ویرایش ویژگی',
    description: 'بروزرسانی ویژگی',
  },
  {
    key: 'categories.attributes.delete',
    name: 'حذف ویژگی',
    description: 'حذف ویژگی',
  },
  {
    key: 'orders.view',
    name: 'مشاهده سفارشات',
    description: 'مشاهده لیست سفارشات',
  },
  {
    key: 'orders.update',
    name: 'ویرایش سفارش',
    description: 'تغییر وضعیت سفارش',
  },
  { key: 'orders.delete', name: 'حذف سفارش', description: 'حذف سفارش' },
  {
    key: 'notifications.view',
    name: 'مشاهده اعلان‌ها',
    description: 'مشاهده لیست اعلان‌ها',
  },
  {
    key: 'notifications.update',
    name: 'بروزرسانی اعلان',
    description: 'بروزرسانی اعلان',
  },
  {
    key: 'delivery.view',
    name: 'مشاهده روش‌های ارسال',
    description: 'مشاهده لیست روش‌های ارسال کالا',
  },
  {
    key: 'delivery.create',
    name: 'ایجاد روش ارسال',
    description: 'ایجاد روش ارسال جدید',
  },
  {
    key: 'delivery.update',
    name: 'ویرایش روش ارسال',
    description: 'بروزرسانی روش ارسال',
  },
  {
    key: 'delivery.delete',
    name: 'حذف روش ارسال',
    description: 'حذف روش ارسال',
  },
  {
    key: 'payments.view',
    name: 'مشاهده روش‌های پرداخت',
    description: 'مشاهده لیست روش‌های پرداخت',
  },
  {
    key: 'payments.create',
    name: 'ایجاد روش پرداخت',
    description: 'ایجاد روش پرداخت جدید',
  },
  {
    key: 'payments.update',
    name: 'ویرایش روش پرداخت',
    description: 'بروزرسانی روش پرداخت',
  },
  {
    key: 'payments.delete',
    name: 'حذف روش پرداخت',
    description: 'حذف روش پرداخت',
  },
];

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>,
  ) {}

  async onModuleInit() {
    try {
      await this.permissionsRepository.manager.transaction(async (manager) => {
        const existing = await manager.find(Permission);
        const existingSet = new Set(existing.map((p) => p.key));

        const toCreate: Permission[] = [];
        for (const p of DEFAULT_PERMISSIONS) {
          if (!existingSet.has(p.key)) {
            toCreate.push(
              manager.create(Permission, {
                key: p.key,
                name: p.name,
                description: p.description,
              }),
            );
          }
        }

        if (toCreate.length > 0) {
          await manager.save(Permission, toCreate);
          this.logger.log(`${toCreate.length} مجاز جدید ایجاد شد`);
        }

        const allPermissions = await manager.find(Permission);
        const roles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

        const existingRolePerms = await manager.find(RolePermission);
        const existingRPSet = new Set(
          existingRolePerms.map((rp) => `${rp.role}:${rp.permissionId}`),
        );

        const rows: RolePermission[] = [];
        for (const permission of allPermissions) {
          for (const role of roles) {
            const key = `${role}:${permission.id}`;
            if (!existingRPSet.has(key)) {
              rows.push(
                manager.create(RolePermission, {
                  role,
                  permissionId: permission.id,
                }),
              );
            }
          }
        }

        if (rows.length > 0) {
          await manager.save(RolePermission, rows);
          this.logger.log(
            `${rows.length} مجاز به نقش‌های admin و super_admin تخصیص یافت`,
          );
        }

        this.logger.log(
          `مجازهای پیش‌فرض بررسی شد (تعداد: ${allPermissions.length})`,
        );
      });
    } catch (error) {
      this.logger.error('خطا در ایجاد مجازهای پیش‌فرض', error);
    }
  }

  findAll(): Promise<Permission[]> {
    return this.permissionsRepository.find({ order: { key: 'ASC' } });
  }

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const key = dto.key.trim();
    const existing = await this.permissionsRepository.findOne({
      where: { key },
    });
    if (existing) {
      throw new ConflictException('کلید مجاز قبلاً ثبت شده است');
    }

    const permission = this.permissionsRepository.create({
      key,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
    });
    return this.permissionsRepository.save(permission);
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('مجاز یافت نشد');
    }

    if (dto.name !== undefined) permission.name = dto.name.trim();
    if (dto.description !== undefined) {
      permission.description = dto.description.trim() || null;
    }

    return this.permissionsRepository.save(permission);
  }

  async remove(id: string): Promise<void> {
    const result = await this.permissionsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('مجاز یافت نشد');
    }
  }

  async getRolePermissions(): Promise<Record<string, string[]>> {
    const rows = await this.rolePermissionsRepository.find({
      relations: { permission: true },
    });

    const result: Record<string, string[]> = {};
    for (const role of Object.values(UserRole)) {
      result[role] = [];
    }

    for (const row of rows) {
      if (!row.permission) continue;
      if (!result[row.role]) result[row.role] = [];
      result[row.role].push(row.permission.key);
    }

    for (const role of Object.keys(result)) {
      result[role] = Array.from(new Set(result[role])).sort();
    }

    return result;
  }

  async setRolePermissions(
    role: string,
    dto: AssignPermissionsDto,
  ): Promise<Record<string, string[]>> {
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException('نقش نامعتبر است');
    }

    const targetRole = role as UserRole;
    const uniqueKeys = Array.from(new Set(dto.permissionKeys));

    const permissions = uniqueKeys.length
      ? await this.permissionsRepository.find({
          where: { key: In(uniqueKeys) },
        })
      : [];

    if (permissions.length !== uniqueKeys.length) {
      throw new BadRequestException('برخی کلیدهای مجاز یافت نشدند');
    }

    await this.rolePermissionsRepository.manager.transaction(
      async (manager) => {
        await manager.delete(RolePermission, { role: targetRole });
        if (permissions.length > 0) {
          const rows = permissions.map((permission) =>
            manager.create(RolePermission, {
              role: targetRole,
              permissionId: permission.id,
            }),
          );
          await manager.save(RolePermission, rows);
        }
      },
    );

    return this.getRolePermissions();
  }
}
