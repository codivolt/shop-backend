import { User, UserRole } from '../../src/modules/users/users.entity';
import { Category } from '../../src/modules/categories/category.entity';
import { Brand } from '../../src/modules/brands/brand.entity';
import { Product } from '../../src/modules/products/product.entity';
import { Order, OrderStatus } from '../../src/modules/orders/order.entity';
import { OrderItem } from '../../src/modules/orders/order-item.entity';
import { Address } from '../../src/modules/addresses/address.entity';
import { CartItem } from '../../src/modules/cart/cart-item.entity';
import { DeliveryMethod } from '../../src/modules/delivery/delivery-method.entity';
import { PaymentAccount } from '../../src/modules/payment-accounts/payment-account.entity';
import { Permission } from '../../src/modules/permissions/permission.entity';
import { RolePermission } from '../../src/modules/permissions/role-permission.entity';
import { UserPermission } from '../../src/modules/permissions/user-permission.entity';
import { Notification } from '../../src/modules/notifications/notification.entity';
import { VerificationCode } from '../../src/modules/auth/verification-code.entity';

export const createTestUser = (overrides: Partial<User> = {}): User => {
  const user = new User();
  user.id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  user.email = `test${Date.now()}@example.com`;
  user.password = '$2b$10$hashedpassword';
  user.firstName = 'Test';
  user.lastName = 'User';
  user.phone = `0912${Math.floor(1000000 + Math.random() * 9000000)}`;
  user.role = UserRole.CUSTOMER;
  user.isActive = true;
  user.passwordSetAt = new Date();
  user.permissions = [];
  user.createdAt = new Date();
  user.updatedAt = new Date();
  return Object.assign(user, overrides);
};

export const createTestAdmin = (overrides: Partial<User> = {}): User => {
  return createTestUser({
    id: `admin-${Date.now()}`,
    email: `admin${Date.now()}@example.com`,
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
    ...overrides,
  });
};

export const createTestSuperAdmin = (overrides: Partial<User> = {}): User => {
  return createTestUser({
    id: `superadmin-${Date.now()}`,
    email: `superadmin${Date.now()}@example.com`,
    role: UserRole.SUPER_ADMIN,
    firstName: 'Super',
    lastName: 'Admin',
    ...overrides,
  });
};

export const createTestCategory = (
  overrides: Partial<Category> = {},
): Category => {
  const category = new Category();
  category.id = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  category.name = `Category ${Date.now()}`;
  category.slug = `category-${Date.now()}`;
  category.description = 'Test category description';
  category.isActive = true;
  category.sortOrder = 0;
  category.parentId = null;
  category.children = [];
  category.attributes = [];
  category.products = [];
  category.createdAt = new Date();
  category.updatedAt = new Date();
  return Object.assign(category, overrides);
};

export const createTestBrand = (overrides: Partial<Brand> = {}): Brand => {
  const brand = new Brand();
  brand.id = `brand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  brand.name = `Brand ${Date.now()}`;
  brand.slug = `brand-${Date.now()}`;
  brand.description = 'Test brand description';
  brand.logoUrl = 'https://example.com/logo.png';
  brand.isActive = true;
  brand.products = [];
  brand.createdAt = new Date();
  brand.updatedAt = new Date();
  return Object.assign(brand, overrides);
};

export const createTestProduct = (
  overrides: Partial<Product> = {},
): Product => {
  const product = new Product();
  product.id = `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  product.name = `Product ${Date.now()}`;
  product.slug = `product-${Date.now()}`;
  product.description = 'Test product description';
  product.shortDescription = 'Short description';
  product.price = 100000;
  product.compareAtPrice = 120000;
  product.costPrice = 80000;
  product.sku = `SKU-${Date.now()}`;
  product.barcode = `123456789${Date.now() % 1000}`;
  product.trackInventory = true;
  product.inventoryQuantity = 100;
  product.lowStockThreshold = 10;
  product.weight = 500;
  product.dimensions = { length: 10, width: 5, height: 3 };
  product.isActive = true;
  product.isFeatured = false;
  product.metaTitle = 'Test Product';
  product.metaDescription = 'Test product meta description';
  product.categoryId = 'test-category-id';
  product.brandId = 'test-brand-id';
  product.category = null as any;
  product.brand = null;
  product.images = [];
  product.attributes = [];
  product.orderItems = [];
  product.cartItems = [];
  product.createdAt = new Date();
  product.updatedAt = new Date();
  return Object.assign(product, overrides);
};

export const createTestOrder = (overrides: Partial<Order> = {}): Order => {
  const order = new Order();
  order.id = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  order.orderNumber = `ORD-${Date.now()}`;
  order.userId = 'test-user-id';
  order.status = OrderStatus.PENDING;
  order.subtotal = 100000;
  order.taxAmount = 9000;
  order.shippingAmount = 15000;
  order.discountAmount = 0;
  order.totalAmount = 124000;
  order.currency = 'IRR';
  order.shippingAddress = {
    firstName: 'Test',
    lastName: 'User',
    phone: '09123456789',
    province: 'Tehran',
    city: 'Tehran',
    address: 'Test Address',
    postalCode: '1234567890',
  };
  order.billingAddress = {
    firstName: 'Test',
    lastName: 'User',
    phone: '09123456789',
    province: 'Tehran',
    city: 'Tehran',
    address: 'Test Address',
    postalCode: '1234567890',
  };
  order.paymentMethod = 'online';
  order.paymentStatus = 'pending';
  order.notes = 'Test order notes';
  order.items = [];
  order.user = null as any;
  order.deliveryMethod = null as any;
  order.deliveryMethodId = null;
  order.createdAt = new Date();
  order.updatedAt = new Date();
  return Object.assign(order, overrides);
};

export const createTestOrderItem = (
  overrides: Partial<OrderItem> = {},
): OrderItem => {
  const item = new OrderItem();
  item.id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  item.orderId = 'test-order-id';
  item.productId = 'test-product-id';
  item.productName = 'Test Product';
  item.productSlug = 'test-product';
  item.productSku = 'SKU-123';
  item.unitPrice = 100000;
  item.quantity = 1;
  item.totalPrice = 100000;
  item.product = null as any;
  item.order = null as any;
  item.createdAt = new Date();
  item.updatedAt = new Date();
  return Object.assign(item, overrides);
};

export const createTestAddress = (
  overrides: Partial<Address> = {},
): Address => {
  const address = new Address();
  address.id = `addr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  address.userId = 'test-user-id';
  address.firstName = 'Test';
  address.lastName = 'User';
  address.phone = '09123456789';
  address.province = 'Tehran';
  address.city = 'Tehran';
  address.address = 'Test Address, Street 1, Alley 2';
  address.postalCode = '1234567890';
  address.isDefault = false;
  address.user = null as any;
  address.createdAt = new Date();
  address.updatedAt = new Date();
  return Object.assign(address, overrides);
};

export const createTestCartItem = (
  overrides: Partial<CartItem> = {},
): CartItem => {
  const item = new CartItem();
  item.id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  item.userId = 'test-user-id';
  item.productId = 'test-product-id';
  item.quantity = 1;
  item.product = null as any;
  item.user = null as any;
  item.createdAt = new Date();
  item.updatedAt = new Date();
  return Object.assign(item, overrides);
};

export const createTestDeliveryMethod = (
  overrides: Partial<DeliveryMethod> = {},
): DeliveryMethod => {
  const method = new DeliveryMethod();
  method.id = `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  method.name = 'Standard Shipping';
  method.description = 'Standard delivery within 3-5 business days';
  method.price = 15000;
  method.freeShippingThreshold = 500000;
  method.estimatedDaysMin = 3;
  method.estimatedDaysMax = 5;
  method.isActive = true;
  method.sortOrder = 0;
  method.orders = [];
  method.createdAt = new Date();
  method.updatedAt = new Date();
  return Object.assign(method, overrides);
};

export const createTestPaymentAccount = (
  overrides: Partial<PaymentAccount> = {},
): PaymentAccount => {
  const account = new PaymentAccount();
  account.id = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  account.userId = 'test-user-id';
  account.type = 'card';
  account.provider = 'mellat';
  account.accountNumber = '6037-9912-3456-7890';
  account.accountName = 'Test Account';
  account.isDefault = false;
  account.isActive = true;
  account.user = null as any;
  account.createdAt = new Date();
  account.updatedAt = new Date();
  return Object.assign(account, overrides);
};

export const createTestPermission = (
  overrides: Partial<Permission> = {},
): Permission => {
  const permission = new Permission();
  permission.id = `perm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  permission.key = 'test:permission';
  permission.name = 'Test Permission';
  permission.description = 'Test permission description';
  permission.module = 'test';
  permission.roles = [];
  permission.users = [];
  permission.createdAt = new Date();
  permission.updatedAt = new Date();
  return Object.assign(permission, overrides);
};

export const createTestRolePermission = (
  overrides: Partial<RolePermission> = {},
): RolePermission => {
  const rp = new RolePermission();
  rp.id = `rp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  rp.role = 'admin';
  rp.permissionId = 'test-permission-id';
  rp.permission = null as any;
  rp.createdAt = new Date();
  rp.updatedAt = new Date();
  return Object.assign(rp, overrides);
};

export const createTestUserPermission = (
  overrides: Partial<UserPermission> = {},
): UserPermission => {
  const up = new UserPermission();
  up.id = `up-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  up.userId = 'test-user-id';
  up.permissionId = 'test-permission-id';
  up.permission = null as any;
  up.user = null as any;
  up.createdAt = new Date();
  up.updatedAt = new Date();
  return Object.assign(up, overrides);
};

export const createTestNotification = (
  overrides: Partial<Notification> = {},
): Notification => {
  const notification = new Notification();
  notification.id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  notification.userId = 'test-user-id';
  notification.type = 'info';
  notification.title = 'Test Notification';
  notification.message = 'This is a test notification';
  notification.data = {};
  notification.isRead = false;
  notification.readAt = null;
  notification.user = null as any;
  notification.createdAt = new Date();
  notification.updatedAt = new Date();
  return Object.assign(notification, overrides);
};

export const createTestVerificationCode = (
  overrides: Partial<VerificationCode> = {},
): VerificationCode => {
  const code = new VerificationCode();
  code.id = `vc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  code.phone = '09123456789';
  code.code = '123456';
  code.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  code.createdAt = new Date();
  code.updatedAt = new Date();
  return Object.assign(code, overrides);
};

export const mockJwtPayload = (user: User) => ({
  sub: user.id,
  email: user.email,
  phone: user.phone,
  role: user.role,
  permissions: (user.permissions || []).map((p) => p.permission?.key || p),
});

export const createMockRequest = (user?: User) => ({
  user,
  headers: {},
  ip: '127.0.0.1',
  method: 'GET',
  url: '/api/test',
});
