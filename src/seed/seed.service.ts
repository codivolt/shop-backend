import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User, UserRole } from '../modules/users/users.entity';
import { Permission } from '../modules/permissions/permission.entity';
import { RolePermission } from '../modules/permissions/role-permission.entity';
import { UserPermission } from '../modules/permissions/user-permission.entity';

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

const DEFAULT_USERS = [
  {
    email: 'superadmin@shop.com',
    password: 'Admin@123',
    role: UserRole.SUPER_ADMIN,
    firstName: 'سوپر',
    lastName: 'مدیر',
    phone: '09120000000',
    isActive: true,
  },
  {
    email: 'admin@shop.com',
    password: 'Admin@123',
    role: UserRole.ADMIN,
    firstName: 'مدیر',
    lastName: 'سیستم',
    phone: '09120000001',
    isActive: true,
  },
  {
    email: 'customer@shop.com',
    password: 'Customer@123',
    role: UserRole.CUSTOMER,
    firstName: 'مشتری',
    lastName: 'نمونه',
    phone: '09120000002',
    isActive: true,
  },
];

const CUSTOMER_PERMISSION_KEYS = [
  'products.view',
  'categories.view',
  'brands.view',
  'orders.view',
  'delivery.view',
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserPermission)
    private readonly userPermissionRepository: Repository<UserPermission>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    await this.userRepository.manager.transaction(async (manager) => {
      await this.seedPermissions(manager);
      const allPermissions = await manager.find(Permission);
      await this.seedRolePermissions(manager, allPermissions);
      await this.seedUsers(manager);
      await this.seedUserPermissions(manager, allPermissions);
    });

    this.logger.log('سيد دیتابیس با موفقیت انجام شد');
  }

  private async seedPermissions(manager: any) {
    const existing = await manager.find(Permission);
    const existingKeys = new Set(existing.map((p) => p.key));

    const toCreate = DEFAULT_PERMISSIONS.filter(
      (p) => !existingKeys.has(p.key),
    ).map((p) => manager.create(Permission, p));

    if (toCreate.length > 0) {
      await manager.save(Permission, toCreate);
      this.logger.log(`${toCreate.length} مجاز جدید ایجاد شد`);
    }
  }

  private async seedRolePermissions(manager: any, permissions: Permission[]) {
    const roles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    const existing = await manager.find(RolePermission);
    const existingSet = new Set(
      existing.map((rp) => `${rp.role}:${rp.permissionId}`),
    );

    const rows: RolePermission[] = [];
    for (const permission of permissions) {
      for (const role of roles) {
        const key = `${role}:${permission.id}`;
        if (!existingSet.has(key)) {
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
      this.logger.log(`${rows.length} مجاز به نقش‌ها تخصیص یافت`);
    }
  }

  private async seedUsers(manager: any) {
    const adminEmail = this.configService.get<string>(
      'SEED_ADMIN_EMAIL',
      'superadmin@shop.com',
    );
    const adminPassword = this.configService.get<string>(
      'SEED_ADMIN_PASSWORD',
      'Admin@123',
    );
    const adminPhone = this.configService.get<string>(
      'SEED_ADMIN_PHONE',
      adminEmail,
    );

    for (const u of DEFAULT_USERS) {
      const email = u.role === UserRole.SUPER_ADMIN ? adminEmail : u.email;
      const password =
        u.role === UserRole.SUPER_ADMIN ? adminPassword : u.password;
      const phone = u.role === UserRole.SUPER_ADMIN ? adminPhone : u.phone;

      const existing = await manager.findOne(User, {
        where: { email },
      });

      const data = {
        email,
        password,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        phone,
        isActive: u.isActive,
        passwordSetAt: new Date(),
      };

      if (existing) {
        manager.merge(User, existing, data);
        await manager.save(User, existing);
        this.logger.log(`کاربر ${email} با نقش ${u.role} به‌روزرسانی شد`);
        continue;
      }

      const user = manager.create(User, data);
      await manager.save(User, user);
      this.logger.log(`کاربر ${email} با نقش ${u.role} ایجاد شد`);
    }
  }

  private async seedUserPermissions(manager: any, permissions: Permission[]) {
    const permissionByKey = new Map(permissions.map((p) => [p.key, p.id]));
    const users = await manager.find(User);

    for (const user of users) {
      const keys =
        user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN
          ? permissions.map((p) => p.key)
          : CUSTOMER_PERMISSION_KEYS;

      const existing = await manager.find(UserPermission, {
        where: { userId: user.id },
      });
      const existingSet = new Set(existing.map((up) => up.permissionId));

      const rows: UserPermission[] = [];
      for (const key of keys) {
        const permissionId = permissionByKey.get(key);
        if (permissionId && !existingSet.has(permissionId)) {
          rows.push(
            manager.create(UserPermission, { userId: user.id, permissionId }),
          );
        }
      }

      if (rows.length > 0) {
        await manager.save(UserPermission, rows);
      }
    }
  }
}
