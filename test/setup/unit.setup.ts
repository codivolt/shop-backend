export const testEntities = [
  // Entities will be added dynamically in test files
];

export const createTestModule = async (
  imports: any[] = [],
  providers: any[] = [],
): Promise<any> => {
  const { Test, TestingModule } = await import('@nestjs/testing');
  const { ConfigModule } = await import('@nestjs/config');
  const { TypeOrmModule } = await import('@nestjs/typeorm');
  const { DataSource, Repository } = await import('typeorm');

  // Import entities
  const { User } = await import('../../src/modules/users/users.entity');
  const { UserRole } = await import('../../src/modules/users/users.entity');
  const { VerificationCode } =
    await import('../../src/modules/auth/verification-code.entity');
  const { Category } =
    await import('../../src/modules/categories/category.entity');
  const { CategoryAttribute } =
    await import('../../src/modules/categories/category-attribute.entity');
  const { Brand } = await import('../../src/modules/brands/brand.entity');
  const { Product } = await import('../../src/modules/products/product.entity');
  const { ProductImage } =
    await import('../../src/modules/products/product-image.entity');
  const { ProductAttributeValue } =
    await import('../../src/modules/products/product-attribute-value.entity');
  const { Order } = await import('../../src/modules/orders/order.entity');
  const { OrderItem } =
    await import('../../src/modules/orders/order-item.entity');
  const { CartItem } = await import('../../src/modules/cart/cart-item.entity');
  const { Address } =
    await import('../../src/modules/addresses/address.entity');
  const { DeliveryMethod } =
    await import('../../src/modules/delivery/delivery-method.entity');
  const { PaymentAccount } =
    await import('../../src/modules/payment-accounts/payment-account.entity');
  const { Permission } =
    await import('../../src/modules/permissions/permission.entity');
  const { RolePermission } =
    await import('../../src/modules/permissions/role-permission.entity');
  const { UserPermission } =
    await import('../../src/modules/permissions/user-permission.entity');
  const { Notification } =
    await import('../../src/modules/notifications/notification.entity');

  const testEntities = [
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
    providers,
  }).compile();
};

export const getRepository = <T>(module: any, entity: new () => T): any => {
  const dataSource = module.get(DataSource);
  return dataSource.getRepository(entity);
};

export const createMockUser = (overrides: Partial<any> = {}): any => {
  const { User, UserRole } = require('../../src/modules/users/users.entity');
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

export const createMockAdmin = (overrides: Partial<any> = {}): any => {
  return createMockUser({
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: require('../../src/modules/users/users.entity').UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
    ...overrides,
  });
};

export const createMockSuperAdmin = (overrides: Partial<any> = {}): any => {
  return createMockUser({
    id: 'super-admin-id',
    email: 'superadmin@example.com',
    role: require('../../src/modules/users/users.entity').UserRole.SUPER_ADMIN,
    firstName: 'Super',
    lastName: 'Admin',
    ...overrides,
  });
};
