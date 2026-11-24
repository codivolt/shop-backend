import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../src/modules/users/users.entity';
import { VerificationCode } from '../../src/modules/auth/verification-code.entity';
import { Category } from '../../src/modules/categories/category.entity';
import { CategoryAttribute } from '../../src/modules/categories/category-attribute.entity';
import { Brand } from '../../src/modules/brands/brand.entity';
import { Product } from '../../src/modules/products/product.entity';
import { ProductImage } from '../../src/modules/products/product-image.entity';
import { ProductAttributeValue } from '../../src/modules/products/product-attribute-value.entity';
import { Order } from '../../src/modules/orders/order.entity';
import { OrderItem } from '../../src/modules/orders/order-item.entity';
import { CartItem } from '../../src/modules/cart/cart-item.entity';
import { Address } from '../../src/modules/addresses/address.entity';
import { DeliveryMethod } from '../../src/modules/delivery/delivery-method.entity';
import { PaymentAccount } from '../../src/modules/payment-accounts/payment-account.entity';
import { Permission } from '../../src/modules/permissions/permission.entity';
import { RolePermission } from '../../src/modules/permissions/role-permission.entity';
import { UserPermission } from '../../src/modules/permissions/user-permission.entity';
import { Notification } from '../../src/modules/notifications/notification.entity';

export const testEntities = [
  User,
  VerificationCode,
  Category,
  CategoryAttribute,
  Brand,
  Product,
  ProductImage,
  ProductAttributeValue,
  Order,
  OrderItem,
  CartItem,
  Address,
  DeliveryMethod,
  PaymentAccount,
  Permission,
  RolePermission,
  UserPermission,
  Notification,
];

export const createIntegrationModule = async (
  imports: any[] = [],
): Promise<TestingModule> => {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
        ignoreEnvFile: true,
        load: [
          () => ({
            NODE_ENV: 'test',
            PORT: 3001,
            API_PREFIX: 'api',
            DB_HOST: 'localhost',
            DB_PORT: 3306,
            DB_USERNAME: 'test',
            DB_PASSWORD: 'test',
            DB_NAME: 'cigarshop_test',
            DB_SYNCHRONIZE: true,
            DB_LOGGING: false,
            JWT_ACCESS_SECRET: 'test-access-secret',
            JWT_ACCESS_EXPIRES_IN: '15m',
            JWT_REFRESH_SECRET: 'test-refresh-secret',
            JWT_REFRESH_EXPIRES_IN: '7d',
            REDIS_HOST: 'localhost',
            REDIS_PORT: 6379,
            REDIS_PASSWORD: '',
            REDIS_DB: 1,
            SMS_PROVIDER: 'mock',
            SMS_API_KEY: 'mock',
            SMS_SENDER: 'mock',
            SMS_TEMPLATE_VERIFY: 'verify-code',
            UPLOAD_DEST: './uploads',
            MAX_FILE_SIZE: 5242880,
            THROTTLE_TTL: 60,
            THROTTLE_LIMIT: 1000,
          }),
        ],
      }),
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: testEntities,
        synchronize: true,
        logging: false,
        dropSchema: true,
      }),
      ...imports,
    ],
  }).compile();
};

export const getRepository = <T>(
  module: TestingModule,
  entity: new () => T,
): Repository<T> => {
  const dataSource = module.get<DataSource>(DataSource);
  return dataSource.getRepository(entity);
};

export const createMockUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = 'test-user-id';
  user.email = 'test@example.com';
  user.password = '$2b$10$hashedpassword';
  user.firstName = 'Test';
  user.lastName = 'User';
  user.phone = '09123456789';
  user.role = UserRole.CUSTOMER;
  user.isActive = true;
  user.passwordSetAt = new Date();
  user.permissions = [];
  return Object.assign(user, overrides);
};
