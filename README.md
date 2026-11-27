# Shop Backend (NestJS)

Backend API for the **Rolchi** e-commerce platform. Built with **NestJS + TypeORM (MySQL) + Redis + MinIO**, JWT auth, throttling, Swagger, audit logging and object storage.

---

## 1. Tech Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js + TypeScript |
| Framework | NestJS 10 (Express) |
| ORM / DB | TypeORM + **MySQL** (`mysql2`) |
| Cache / sessions | Redis (`ioredis`, `cache-manager-redis-store`) |
| Object storage | **MinIO** (S3-compatible) via `minio` |
| Auth | JWT (`@nestjs/jwt`, Passport JWT), `bcryptjs` |
| Validation | `class-validator` + `class-transformer` |
| API docs | Swagger (`@nestjs/swagger`) |
| Rate limiting | `@nestjs/throttler` |
| Image processing | `sharp` (resize → webp) |
| File uploads | `multer` (memoryStorage) |
| Tests | Jest (unit / integration / e2e projects) |
| Seed | `ts-node` script (`src/seed`) |

---

## 2. Architecture

```
src/
├── main.ts                 # bootstrap (global prefix: none, CORS, Swagger in non-prod)
├── app.module.ts           # root module (AuditModule + global AuditInterceptor + ThrottlerGuard)
├── config/                 # jwt.config.ts, etc.
├── common/
│   ├── decorators/         # @CurrentUser, @Permissions, @Roles, @Public
│   ├── dto/                # PaginationDto, PaginatedResponse
│   ├── filters/            # global exception filter
│   ├── transformers/       # column transformers
│   └── utils/              # secure-upload.util.ts (validate/process/delete, 2MB limit)
├── modules/                # feature modules (see below)
├── migrations/             # TypeORM migrations
└── seed/                   # seed.main.ts + seed.service.ts (admin, categories, etc.)
```

### Modules (`src/modules`)
`auth`, `users`, `permissions`, `products`, `categories` (+ category-attributes), `brands`, `orders`, `discounts`, `delivery`, `payment-accounts`, `payments`, `cart`, `addresses`, `notifications`, `search`, `audit`, `files`, `storage`.

Each module follows the Nest convention: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `dto/`.

---

## 3. Environment Variables (`.env.local`)

| Key | Description |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `DB_HOST` / `DB_PORT` | MySQL host/port (`localhost` / `3306`) |
| `DB_USERNAME` / `DB_PASSWORD` | MySQL credentials |
| `DB_DATABASE` | Database name (`shop_db`) |
| `DB_SYNC` | TypeORM `synchronize` (`true` in dev, **disable in prod**) |
| `DB_LOGGING` | TypeORM query logging |
| `JWT_SECRET` | JWT signing secret (**≥ 32 chars**) |
| `JWT_EXPIRES_IN` | Access token TTL (`15m`) |
| `CORS_ORIGINS` | Allowed origins (comma separated) |
| `MINIO_ENDPOINT` / `MINIO_PORT` / `MINIO_USE_SSL` | MinIO connection |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | MinIO credentials |
| `MINIO_BUCKET` | Bucket name (auto-created on boot) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PHONE` / `SEED_ADMIN_PASSWORD` | Seed admin account |

> Secrets are read from `.env.local` and must not be committed.

---

## 4. Scripts

```bash
pnpm install
pnpm run start:dev        # watch mode (port 3000)
pnpm run build            # nest build
pnpm run start:prod       # node dist/main
pnpm run lint             # eslint --fix
pnpm run test             # unit tests
pnpm run test:integration # integration tests
pnpm run test:e2e         # e2e tests
pnpm run test:cov         # coverage
pnpm run seed             # seed database (admin, base data)
```

---

## 5. Key Features & Behaviour

### Auth
- Login **is** registration: `POST /auth/login` verifies the code/password and **auto-creates** a user via `createByPhone` if absent.
- JWT access token returned with `user` (role + permissions).
- Guards: `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`; `@Public`, `@Roles`, `@Permissions` decorators.

### Products
- CRUD, `isFeatured` flag, `GET /products/featured/list`.
- Multi-image gallery: `POST /products/:id/images` (multipart, appends to gallery, first becomes primary).
- Price always read from DB (never trusted from client).

### Categories / Attributes / Brands
- Category tree + category attributes CRUD.

### Orders
- Price snapshot + **customer snapshot** (`customerName`, `customerPhone`, `customerAddress`) at creation.
- `user` relation included with `createForeignKeyConstraints:false` (legacy orders with empty `userId` don’t break).
- Search by id / code / customer name / phone / user fields (`search` from `PaginationDto`).
- Receipt workflow: `card_to_card`, `sheba`, `crypto` require a receipt; approve/reject with reason; 24h rejection deadline; re-upload after rejection; `ReceiptHistory` (sorted `createdAt DESC`).
- Receipt paths normalized `/uploads/receipts/` → `/files/receipts/`.

### Referral
- Auto 8-char referral codes, `ReferralTier`, `DiscountCode`.
- `getReferralStats` uses an explicit `leftJoin('User','referred','referred.referredBy = referrer.referralCode')`.

### Discounts / Delivery / Payment accounts / Cart / Addresses / Notifications / Search
- Standard CRUD + validation; search endpoint `GET /search?q=`.

### Audit logging
- `audit_logs` entity + `AuditInterceptor` (global) records POST/PUT/PATCH/DELETE; `GET /audit-logs` (admin).

### Files & Storage
- `FilesController` streams avatars/receipts/products/categories from MinIO with CSP + `X-Content-Type-Options`; JWT guard on avatars/receipts.
- `StorageService` wraps MinIO (`upload/get/delete/stat`, bucket auto-create).
- Upload pipeline: `validateImageFile` → `processAndSaveImage` (sharp → webp 512×512 or 1920×1920) → `deleteFile` on error. `MAX_FILE_SIZE` = 2MB.

### Cross-cutting
- Global throttling 100 req / 60s (Persian message).
- No global API prefix; CORS throws if empty; Swagger disabled in production.
- `onDelete: 'RESTRICT'` with app-layer cleanup.

---

## 6. Testing

Jest projects defined in `jest.config.js`: `unit`, `integration`, `e2e`. Specs live next to sources (`*.service.spec.ts`, `*.controller.spec.ts`). Run a single project with `pnpm run test:unit` etc.

---

## 7. Deployment Notes

- Set `DB_SYNC=false`, provide a real `JWT_SECRET`, configure `CORS_ORIGINS` and MinIO credentials.
- Run migrations (`src/migrations`) instead of relying on `synchronize`.
- Build with `pnpm run build`, start with `pnpm run start:prod`.
- Place behind nginx; expose only the API port.