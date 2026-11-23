# Backend - API فروشگاه سیگار (NestJS 11)

## 📋 نمای کلی

بک‌اند یک **RESTful API** کامل برای فروشگاه سیگار با **NestJS 11** (Node.js Framework)، **TypeORM** (MySQL)، **JWT Authentication**، **RBAC** (Role-Based Access Control)، **Swagger/OpenAPI** و پشتیبانی از **Multi-tenant** (User, Admin, Courier). ماژولار، مقیاس‌پذیر و با بهترین практиک‌های NestJS توسعه یافته.

---

## 🛠 تکنولوژی‌های اصلی

| تکنولوژی | نسخه | کاربرد |
|------------|-------|--------|
| NestJS | 11.0+ | فریم‌ورک Node.js (Modular، DI، Decorators) |
| TypeScript | 5.7+ | تایپ‌سفتی |
| TypeORM | 1.1+ | ORM برای MySQL |
| MySQL2 | 3.24+ | Database Driver |
| Passport + JWT | 12.0+ | Authentication (Access + Refresh Token) |
| Bcryptjs | 3.0+ | Hashing رمز عبور |
| Class Validator | 0.15+ | Validation (DTOs) |
| Class Transformer | 0.5+ | Transform Data |
| Swagger/UI | 12.1+ | API Documentation |
| Redis (ioredis) | 6.0+ | Caching، Session، Rate Limiting |
| Multer | 2.5+ | File Upload |
| Jest | 30.0+ | Testing (Unit، E2E) |

---

## 📁 ساختار پروژه

```
back/
├── src/
│   ├── main.ts                      # Entry Point (Bootstrap، Swagger، ValidationPipe)
│   ├── app.module.ts                # Root Module (Imports all feature modules)
│   ├── app.controller.ts            # Health Check / Root Endpoint
│   ├── app.service.ts               # App-level Service
│   ├── config/
│   │   ├── config.module.ts         # ConfigModule (Global، .env validation)
│   │   ├── database.config.ts       # TypeORM DataSource Config
│   │   └── jwt.config.ts            # JWT Config (Secret، Expire، Refresh)
│   ├── modules/                     # Feature Modules (Domain-driven)
│   │   ├── auth/                    # احراز هویت (User، Admin، Courier)
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts   # POST /login، /register، /refresh، /logout، /verify-phone
│   │   │   ├── auth.service.ts      # Logic: validate، generateTokens، verifyOTP
│   │   │   ├── constants.ts         # Constants (Token names، Strategies)
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts  # @CurrentUser()
│   │   │   │   ├── permissions.decorator.ts   # @Permissions(...)
│   │   │   │   └── roles.decorator.ts         # @Roles(...)
│   │   │   ├── dto/
│   │   │   │   ├── auth.dto.ts      # LoginDto، RegisterDto، TokenDto
│   │   │   │   └── phone-auth.dto.ts # SendOtpDto، VerifyOtpDto
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts      # JWT Guard (Access Token)
│   │   │   │   ├── local-auth.guard.ts    # Local Strategy Guard
│   │   │   │   ├── permissions.guard.ts   # Permissions Guard
│   │   │   │   └── roles.guard.ts         # Roles Guard
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts        # JWT Strategy (Passport)
│   │   │   │   └── local.strategy.ts      # Local Strategy (Passport)
│   │   │   ├── sms.service.ts     # SMS Provider (OTP)
│   │   │   └── entities/
│   │   │       └── verification-code.entity.ts # OTP Codes Table
│   │   ├── users/                 # مدیریت کاربران (Customer)
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts # GET/POST/PUT /users، /profile
│   │   │   ├── users.service.ts
│   │   │   ├── users.entity.ts    # User Entity (Profile، Addresses، ...)
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       ├── update-profile.dto.ts
│   │   │       └── user-query.dto.ts
│   │   ├── admin/                 # (اختیاری - جداسازی Admin) یا در users/permissions
│   │   ├── categories/            # دسته‌بندی‌ها
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   ├── category.entity.ts
│   │   │   ├── category-attribute.entity.ts
│   │   │   ├── category-attribute.controller.ts
│   │   │   ├── category-attribute.service.ts
│   │   │   ├── category-attribute.module.ts
│   │   │   └── dto/
│   │   │       ├── category.dto.ts
│   │   │       ├── category-attribute.dto.ts
│   │   │       └── category-query.dto.ts
│   │   ├── products/              # محصولات
│   │   │   ├── products.module.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── product.entity.ts
│   │   │   ├── product-image.entity.ts
│   │   │   ├── product-attribute-value.entity.ts
│   │   │   ├── product-image.controller.ts
│   │   │   ├── product-image.service.ts
│   │   │   ├── product-image.module.ts
│   │   │   ├── product-attribute-value.controller.ts
│   │   │   ├── product-attribute-value.service.ts
│   │   │   ├── product-attribute-value.module.ts
│   │   │   └── dto/ (ProductDto، ProductQueryDto، ...)
│   │   ├── brands/                # برندها
│   │   │   ├── brands.module.ts
│   │   │   ├── brands.controller.ts
│   │   │   ├── brands.service.ts
│   │   │   ├── brand.entity.ts
│   │   │   └── dto/ (BrandDto، BrandQueryDto)
│   │   ├── orders/                # سفارشات
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── order.entity.ts
│   │   │   ├── order-item.entity.ts
│   │   │   └── dto/ (OrderDto، OrderQueryDto، OrderStatusDto)
│   │   ├── cart/                  # سبد خرید
│   │   │   ├── cart.module.ts
│   │   │   ├── cart.controller.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── cart-item.entity.ts
│   │   │   └── dto/ (CartDto، AddToCartDto، UpdateCartDto)
│   │   ├── addresses/             # آدرس‌ها
│   │   │   ├── addresses.module.ts
│   │   │   ├── addresses.controller.ts
│   │   │   ├── addresses.service.ts
│   │   │   ├── address.entity.ts
│   │   │   └── dto/ (AddressDto)
│   │   ├── delivery/              # روش‌های ارسال
│   │   │   ├── delivery.module.ts
│   │   │   ├── delivery.controller.ts
│   │   │   ├── delivery.service.ts
│   │   │   ├── delivery-method.entity.ts
│   │   │   └── dto/ (DeliveryMethodDto)
│   │   ├── payment-accounts/      # حساب‌های پرداخت
│   │   │   ├── payment-accounts.module.ts
│   │   │   ├── payment-account.controller.ts
│   │   │   ├── payment-account.service.ts
│   │   │   ├── payment-account.entity.ts
│   │   │   └── dto/
│   │   ├── permissions/           # RBAC (Roles، Permissions)
│   │   │   ├── permissions.module.ts
│   │   │   ├── permissions.controller.ts
│   │   │   ├── permissions.service.ts
│   │   │   ├── permission.entity.ts
│   │   │   ├── role-permission.entity.ts
│   │   │   ├── user-permission.entity.ts
│   │   │   └── dto/
│   │   ├── notifications/         # اعلان‌ها (Push، SMS، In-app)
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   └── notification.entity.ts
│   │   ├── search/                # جستجوی پیشرفته
│   │   │   ├── search.module.ts
│   │   │   ├── search.controller.ts
│   │   │   ├── search.service.ts
│   │   │   └── dto/ (SearchDto)
│   │   └── courier/               # (در صورت جداسازی) ماژول پیوسته
│   │       ├── courier.module.ts
│   │       ├── courier.controller.ts
│   │       ├── courier.service.ts
│   │       ├── courier.entity.ts
│   │       └── dto/
│   └── common/                    # Shared Utilities (اختیاری)
│       ├── decorators/
│       ├── filters/
│       ├── guards/
│       ├── interceptors/
│       ├── pipes/
│       └── utils/
├── test/                          # E2E Tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .eslintrc.js
├── .prettierrc
└── .env.example
```

---

## 🏗 معماری ماژولار (Modular Architecture)

### Feature Module Pattern
هر ماژول شامل:
- `*.module.ts` - `@Module({ imports, controllers, providers, exports })`
- `*.controller.ts` - `@Controller('route')` + Route Handlers
- `*.service.ts` - `@Injectable()` Business Logic
- `*.entity.ts` - `@Entity()` TypeORM Entity
- `dto/` - Data Transfer Objects (Validation با `class-validator`)
- `guards/` - Auth/Authorization Guards
- `strategies/` - Passport Strategies

### Dependency Injection
- **Providers**: Services، Repositories، External Clients
- **Global Modules**: `ConfigModule`، `TypeOrmModule` (در `AppModule`)
- **Scoped Providers**: `REQUEST` scoped برای Tenant/User Context

---

## 🔐 Authentication & Authorization

### JWT Strategy (Access + Refresh Tokens)
```
Login/Register
    │
    ▼
Generate Access Token (15min) + Refresh Token (7d)
    │
    ├── Access Token → HttpOnly Cookie / Authorization Header
    └── Refresh Token → HttpOnly Cookie (Secure، SameSite=Strict)
```

### Token Payload
```typescript
interface JwtPayload {
  sub: string;           // User ID
  email: string;
  phone: string;
  roles: string[];       // ['user', 'admin', 'courier']
  permissions: string[]; // ['orders:read', 'products:write', ...]
  type: 'access' | 'refresh';
}
```

### Guards & Decorators
| Guard/Decorator | Usage |
|-----------------|-------|
| `JwtAuthGuard` | `@UseGuards(JwtAuthGuard)` - محافظت مسیر (نیاز به Access Token) |
| `RolesGuard` | `@UseGuards(RolesGuard)` + `@Roles('admin', 'manager')` |
| `PermissionsGuard` | `@UseGuards(PermissionsGuard)` + `@Permissions('orders:write')` |
| `@CurrentUser()` | Injection User Entity در Controller |
| `@Public()` | Skip Auth Guard (برای Login/Register) |

### Multi-Role Support
- User می‌تواند چندین Role داشته باشد: `['user']`، `['admin']`، `['courier']`، `['user', 'courier']`
- Permission-Based Access Control (PBAC) بر Role-Based (RBAC) ترجیح داده شده

---

## 🗄 Database (TypeORM + MySQL)

### Entities Overview
| Entity | Table | Relations |
|--------|-------|-----------|
| `User` | `users` | OneToMany: Addresses، Orders، CartItems، Permissions |
| `Category` | `categories` | Self-Referencing (Parent)، OneToMany: Products، Attributes |
| `CategoryAttribute` | `category_attributes` | ManyToOne: Category |
| `Brand` | `brands` | OneToMany: Products |
| `Product` | `products` | ManyToOne: Category، Brand، OneToMany: Images، Attributes، OrderItems |
| `ProductImage` | `product_images` | ManyToOne: Product |
| `ProductAttributeValue` | `product_attribute_values` | ManyToOne: Product، CategoryAttribute |
| `Order` | `orders` | ManyToOne: User، DeliveryMethod، OneToMany: OrderItems |
| `OrderItem` | `order_items` | ManyToOne: Order، Product |
| `CartItem` | `cart_items` | ManyToOne: User، Product |
| `Address` | `addresses` | ManyToOne: User |
| `DeliveryMethod` | `delivery_methods` | OneToMany: Orders |
| `PaymentAccount` | `payment_accounts` | ManyToOne: User |
| `Permission` | `permissions` | ManyToMany: Roles، Users |
| `RolePermission` | `role_permissions` | ManyToOne: Role، Permission |
| `UserPermission` | `user_permissions` | ManyToOne: User، Permission |
| `Notification` | `notifications` | ManyToOne: User |
| `VerificationCode` | `verification_codes` | - (OTP Codes) |

### Migrations
```bash
# Generate Migration
pnpm migration:generate src/migrations/MigrationName

# Run Migrations
pnpm migration:run

# Revert Migration
pnpm migration:revert
```

### TypeORM Config (`src/config/database.config.ts`)
- `synchronize: false` در Production
- `logging: true` در Development
- `charset: utf8mb4`، `timezone: '+03:30'` (Iran)

---

## 📡 API Endpoints

### Auth (`/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/login` | ورود با Email/Phone + Password | Public |
| POST | `/auth/register` | ثبت‌نام کاربر جدید | Public |
| POST | `/auth/send-otp` | ارسال کد OTP به موبایل | Public |
| POST | `/auth/verify-otp` | تأیید OTP | Public |
| POST | `/auth/refresh` | Refresh Access Token | Public (Refresh Token) |
| POST | `/auth/logout` | خروج (Invalidate Refresh Token) | Private |
| GET | `/auth/me` | اطلاعات کاربر جاری | Private |

### Users (`/users`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | لیست کاربران (Admin) | Admin |
| GET | `/users/profile` | پروفایل کاربر جاری | Private |
| GET | `/users/:id` | جزئیات کاربر (Admin) | Admin |
| POST | `/users` | ایجاد کاربر (Admin) | Admin |
| PATCH | `/users/profile` | آپدیت پروفایل | Private |
| PATCH | `/users/:id` | آپدیت کاربر (Admin) | Admin |
| DELETE | `/users/:id` | حذف کاربر (Admin) | Admin |

### Categories (`/categories`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | لیست دسته‌بندی‌ها (Tree، Query: parent، search، page) |
| GET | `/categories/:id` | جزئیات دسته‌بندی |
| POST | `/categories` | ایجاد دسته‌بندی (Admin) |
| PATCH | `/categories/:id` | آپدیت دسته‌بندی (Admin) |
| DELETE | `/categories/:id` | حذف دسته‌بندی (Admin) |

#### Category Attributes (`/categories/attributes`)
| Method | Endpoint |
|--------|----------|
| GET | `/categories/attributes` |
| POST | `/categories/attributes` |
| PATCH | `/categories/attributes/:id` |
| DELETE | `/categories/attributes/:id` |

### Products (`/products`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | لیست (Filters: category، brand، search، minPrice، maxPrice، inStock، sort، page) |
| GET | `/products/:id` | جزئیات محصول |
| GET | `/products/slug/:slug` | جزئیات با Slug (SEO) |
| POST | `/products` | ایجاد (Admin) |
| PATCH | `/products/:id` | آپدیت (Admin) |
| DELETE | `/products/:id` | حذف (Admin) |

#### Product Images (`/products/images`)
| Method | Endpoint |
|--------|----------|
| GET | `/products/:productId/images` |
| POST | `/products/:productId/images` (Upload) |
| DELETE | `/products/images/:id` |

#### Product Attributes (`/products/attributes`)
| Method | Endpoint |
|--------|----------|
| GET | `/products/:productId/attributes` |
| POST | `/products/:productId/attributes` |
| PATCH | `/products/attributes/:id` |
| DELETE | `/products/attributes/:id` |

### Brands (`/brands`)
| Method | Endpoint |
|--------|----------|
| GET | `/brands` |
| GET | `/brands/:id` |
| POST | `/brands` |
| PATCH | `/brands/:id` |
| DELETE | `/brands/:id` |

### Orders (`/orders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | لیست سفارشات کاربر (Query: status، page، dateFrom، dateTo) |
| GET | `/orders/:id` | جزئیات سفارش |
| POST | `/orders` | ایجاد سفارش از Cart (Checkout) |
| PATCH | `/orders/:id/status` | آپدیت وضعیت (Admin/Courier) |
| PATCH | `/orders/:id/cancel` | لغو سفارش (User/Admin) |
| GET | `/orders/admin/all` | همه سفارشات (Admin) |

### Cart (`/cart`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | سبد خرید کاربر |
| POST | `/cart/items` | افزودن محصول |
| PATCH | `/cart/items/:id` | آپدیت تعداد |
| DELETE | `/cart/items/:id` | حذف آیتم |
| DELETE | `/cart` | خالی کردن سبد |

### Addresses (`/addresses`)
| Method | Endpoint |
|--------|----------|
| GET | `/addresses` |
| POST | `/addresses` |
| PATCH | `/addresses/:id` |
| DELETE | `/addresses/:id` |
| PATCH | `/addresses/:id/default` | تنظیم پیش‌فرض |

### Delivery Methods (`/delivery`)
| Method | Endpoint |
|--------|----------|
| GET | `/delivery/methods` |
| POST | `/delivery/methods` |
| PATCH | `/delivery/methods/:id` |
| DELETE | `/delivery/methods/:id` |

### Payment Accounts (`/payment-accounts`)
| Method | Endpoint |
|--------|----------|
| GET | `/payment-accounts` |
| POST | `/payment-accounts` |
| PATCH | `/payment-accounts/:id` |
| DELETE | `/payment-accounts/:id` |

### Permissions (`/permissions`)
| Method | Endpoint |
|--------|----------|
| GET | `/permissions` |
| GET | `/permissions/roles` |
| POST | `/permissions/roles` |
| POST | `/permissions/assign-role` |
| POST | `/permissions/assign-permission` |

### Notifications (`/notifications`)
| Method | Endpoint |
|--------|----------|
| GET | `/notifications` |
| PATCH | `/notifications/:id/read` |
| PATCH | `/notifications/read-all` |
| DELETE | `/notifications/:id` |

### Search (`/search`)
| Method | Endpoint |
|--------|----------|
| GET | `/search?q=:query&type=:type` |
| POST | `/search/advanced` |

---

## 📖 Swagger/OpenAPI Documentation

### Setup (`main.ts`)
```typescript
const config = new DocumentBuilder()
  .setTitle('فروشگاه سیگار API')
  .setDescription('مستندات کامل API فروشگاه سیگار')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('Auth', 'احراز هویت')
  .addTag('Users', 'مدیریت کاربران')
  .addTag('Products', 'محصولات')
  .addTag('Orders', 'سفارشات')
  // ... other tags
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Access
- **URL**: `http://localhost:3000/api/docs`
- **Auth**: Bearer Token (Authorize button)

### Decorators for Docs
```typescript
@ApiTags('Products')
@ApiBearerAuth()
@ApiOperation({ summary: 'دریافت لیست محصولات' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiResponse({ status: 200, type: ProductListResponseDto })
@ApiResponse({ status: 401, description: 'Unauthorized' })
```

---

## 🔧 Configuration (`.env`)

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=api
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
COURIER_URL=http://localhost:5173

# Database (MySQL)
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=secret
DB_NAME=cigarshop
DB_SYNCHRONIZE=false
DB_LOGGING=true

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SMS Provider (Kavenegar، Melipayamak، ...)
SMS_PROVIDER=kavenegar
SMS_API_KEY=your-sms-api-key
SMS_SENDER=1000596446
SMS_TEMPLATE_VERIFY=verify-code

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=5242880  # 5MB

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### ConfigModule (`src/config/config.module.ts`)
- `ConfigModule.forRoot({ isGlobal: true, validationSchema: Joi.object({...}) })`
- Type-safe Config با `ConfigService`

---

## 🧪 Testing

### Unit Tests
```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov
```

### E2E Tests
```bash
# Run E2E tests
pnpm test:e2e
```

### Test Structure
```
test/
├── app.e2e-spec.ts           # E2E Setup (TestModule، App، Database)
├── jest-e2e.json             # E2E Jest Config
└── modules/
    ├── auth/
    │   ├── auth.e2e-spec.ts
    │   └── fixtures/
    ├── products/
    │   └── products.e2e-spec.ts
    └── orders/
        └── orders.e2e-spec.ts
```

### Test Utilities
- **Test Database**: SQLite In-Memory یا Test MySQL Container
- **Supertest** برای HTTP Testing
- **Mocking**: `jest.mock()` برای External Services (SMS، Email، Payment)

---

## 🚀 اسکریپت‌ها

```bash
# Development (Watch Mode)
pnpm start:dev

# Debug Mode
pnpm start:debug

# Production Build
pnpm build

# Production Start
pnpm start:prod

# Lint
pnpm lint

# Format
pnpm format

# Type Check
pnpm tsc --noEmit

# Migration Commands
pnpm migration:generate src/migrations/CreateUsersTable
pnpm migration:run
pnpm migration:revert

# Seed Database (اختیاری)
pnpm seed
```

---

## 📦 Deploy

### Docker
```dockerfile
# Multi-stage Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
EXPOSE 3000
USER node
CMD ["node", "dist/main.js"]
```

### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  app:
    build: ./back
    ports:
      - "3000:3000"
    env_file: ./back/.env
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
      MYSQL_DATABASE: cigarshop
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

### PM2 (Production Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start
pm2 start dist/main.js --name "cigarshop-api"

# Monitor
pm2 monit

# Logs
pm2 logs cigarshop-api

# Restart on file change (dev)
pm2 start dist/main.js --watch --name "cigarshop-api-dev"
```

### Nginx Reverse Proxy
```nginx
server {
  listen 80;
  server_name api.cigarshop.ir;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # WebSocket Support
    proxy_read_timeout 86400;
  }

  # Swagger (Optional - Restrict in Production)
  location /api/docs {
    allow 192.168.1.0/24;  # Internal IPs only
    deny all;
    proxy_pass http://localhost:3000;
  }
}
```

---

## 🔒 Security Best Practices

### Implemented
- **Helmet**: Security Headers (CSP، HSTS، X-Frame-Options)
- **CORS**: Configurable Origin Whitelist
- **Rate Limiting**: `@nestjs/throttler` (Global + Per-Route)
- **Input Validation**: `class-validator` + `ValidationPipe` (Whitelist، ForbidNonWhitelisted، Transform)
- **SQL Injection Prevention**: TypeORM Parameterized Queries
- **Password Hashing**: Bcrypt (Cost Factor 12)
- **JWT**: HttpOnly Cookies، Short-lived Access، Rotating Refresh
- **RBAC/PBAC**: Guards + Decorators

### Recommended for Production
- **WAF** (Cloudflare، AWS WAF)
- **API Gateway** (Kong، AWS API Gateway)
- **Secrets Management** (Vault، AWS Secrets Manager)
- **Audit Logging** (Winston + Elasticsearch)
- **Penetration Testing** (Periodic)

---

## 📊 Monitoring & Logging

### Logger (Winston/Pino)
```typescript
// main.ts
const logger = new Logger('Bootstrap');
app.useLogger(logger);
```

### Health Checks
```typescript
// app.controller.ts
@Get('health')
@Public()
healthCheck() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

### Metrics (Prometheus)
- `@willsoto/nestjs-prometheus` برای Metrics Export
- `/metrics` endpoint برای Prometheus Scraping

---

## 📝 نکات توسعه

### Code Style
- **ESLint** + **Prettier** (Airbnb/Google Style)
- **Strict TypeScript** (`strict: true`، `noImplicitAny: true`)
- **Path Aliaces**: `@/` → `src/`
- **Naming Conventions**: PascalCase (Classes)، camelCase (Methods/Variables)، UPPER_SNAKE_CASE (Constants)

### Git Workflow
- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **Branch Strategy**: `main` → `develop` → `feature/*`، `bugfix/*`، `hotfix/*`
- **PR Template**: Description، Testing، Breaking Changes

### Database Best Practices
- **Indexes** روی Columns پرجستجو (email، phone، slug، status)
- **Soft Deletes** (`@DeleteDateColumn`) برای Entities حساس
- **Transactions** برای Operations چند مرحله‌ای (Order Creation، Payment)
- **Connection Pooling** (TypeORM Default: 10 Connections)

### Performance
- **Query Optimization**: `QueryBuilder` برای Complex Queries، `select` برای Fields مورد نیاز
- **Caching**: Redis برای Frequently Accessed Data (Categories، Brands، Settings)
- **Pagination**: Cursor-based برای Large Datasets
- **Eager/Lazy Loading**: Configurable در Relations

---

## 🔗 Frontend Integration

| Frontend | Base URL | Auth |
|----------|----------|------|
| Web (Next.js) | `NEXT_PUBLIC_API_URL` | JWT Cookie |
| Admin Panel | `VITE_API_URL` | JWT Header |
| Courier Panel | `VITE_API_URL` | JWT Header |

### CORS Config (`main.ts`)
```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
    process.env.COURIER_URL,
  ].filter(Boolean),
  credentials: true, // برای Cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
```

---

## 📚 منابع و مستندات

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [Passport.js](http://www.passportjs.org/)
- [Class Validator](https://github.com/typestack/class-validator)
- [Swagger/OpenAPI](https://swagger.io/)
- [JWT.io](https://jwt.io/)
- [MySQL](https://dev.mysql.com/doc/)
- [Redis](https://redis.io/documentation)
- [Docker](https://docs.docker.com/)