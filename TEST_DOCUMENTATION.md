# Backend Test Documentation

## Overview

This document describes the comprehensive test suite for the CigarShop Backend (NestJS 11) project.

## Test Structure

```
back/
├── src/
│   └── **/*.spec.ts              # Unit tests (co-located with source files)
├── test/
│   ├── setup/
│   │   ├── unit.setup.ts         # Unit test setup (SQLite in-memory)
│   │   ├── integration.setup.ts  # Integration test setup
│   │   └── e2e.setup.ts          # E2E test setup (supertest)
│   ├── utils/
│   │   ├── test-factories.ts     # Test data factories
│   │   └── mock-helpers.ts       # Mock repositories and services
│   ├── integration/
│   │   ├── auth.integration.spec.ts
│   │   └── users.integration.spec.ts
│   └── e2e/
│       ├── auth.e2e.spec.ts
│       ├── users.e2e.spec.ts
│       ├── products.e2e.spec.ts
│       ├── categories.e2e.spec.ts
│       └── orders.e2e.spec.ts
├── jest.config.js                # Multi-project Jest configuration
└── package.json                  # Updated test scripts
```

## Test Types

### 1. Unit Tests (`test:unit`)
- **Location**: `src/**/*.spec.ts` (co-located with source)
- **Scope**: Individual services, controllers, guards, strategies
- **Dependencies**: Fully mocked using `jest.mock()`
- **Database**: None (pure unit tests)
- **Run**: `pnpm test:unit`

**Coverage**:
- AuthModule: `AuthService`, `AuthController`
- UsersModule: `UsersService`, `UsersController`
- CategoriesModule: `CategoriesService`, `CategoriesController`
- ProductsModule: `ProductsService`, `ProductsController`
- BrandsModule: `BrandsService`, `BrandsController`
- OrdersModule: `OrdersService`, `OrdersController`
- CartModule: `CartService`, `CartController`
- AddressesModule: `AddressesService`, `AddressesController`
- DeliveryModule: `DeliveryService`, `DeliveryController`
- PaymentAccountsModule: `PaymentAccountsService`, `PaymentAccountsController`
- PermissionsModule: `PermissionsService`, `PermissionsController`
- NotificationsModule: `NotificationsService`, `NotificationsController`
- SearchModule: `SearchService`, `SearchController`

### 2. Integration Tests (`test:integration`)
- **Location**: `test/integration/**/*.spec.ts`
- **Scope**: Module interactions, database operations
- **Dependencies**: Real TypeORM with SQLite in-memory database
- **Database**: SQLite (`:memory:`) with full schema
- **Run**: `pnpm test:integration`

**Coverage**:
- AuthModule + UsersModule: Full registration, login, OTP flow
- UsersModule: CRUD operations, profile updates, password changes
- (Additional modules can be added)

### 3. End-to-End Tests (`test:e2e`)
- **Location**: `test/e2e/**/*.spec.ts`
- **Scope**: Full HTTP request/response cycles
- **Dependencies**: Full NestJS application bootstrapped
- **Database**: SQLite in-memory (via test module)
- **Run**: `pnpm test:e2e`

**Coverage**:
- Auth API: Register, Login, OTP, Me
- Users API: Profile, Password, Admin CRUD
- Categories API: CRUD, Tree, Slug lookup
- Products API: List, Filters, Search, Admin CRUD
- Orders API: Create, List, Detail, Status, Cancel, Admin

## Running Tests

```bash
# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# E2E tests only
pnpm test:e2e

# All tests with coverage
pnpm test:all

# Watch mode for unit tests
pnpm test:watch

# Coverage report
pnpm test:cov
```

## Test Configuration

### jest.config.js
Multi-project configuration with three projects:
- **unit**: Tests in `src/**/*.spec.ts`
- **integration**: Tests in `test/integration/**/*.spec.ts`
- **e2e**: Tests in `test/e2e/**/*.spec.ts`

Each project has:
- Separate coverage directory
- Shared module name mapper (`@/` → `src/`)
- TypeScript transformation with `ts-jest`
- CommonJS module resolution

### Test Setup Files

#### unit.setup.ts
- SQLite in-memory database
- All entities registered
- Mock repositories and services
- Test data factories

#### integration.setup.ts
- Full TypeORM with SQLite
- Real database operations
- Module imports for integration testing

#### e2e.setup.ts
- Full NestJS app bootstrap
- Supertest for HTTP testing
- Test database cleanup

## Test Data Factories

Located in `test/utils/test-factories.ts`:
- `createTestUser()` - Customer user
- `createTestAdmin()` - Admin user
- `createTestSuperAdmin()` - Super admin user
- `createTestCategory()` - Category entity
- `createTestBrand()` - Brand entity
- `createTestProduct()` - Product entity
- `createTestOrder()` - Order entity
- `createTestOrderItem()` - Order item entity
- `createTestAddress()` - Address entity
- `createTestCartItem()` - Cart item entity
- `createTestDeliveryMethod()` - Delivery method
- `createTestPaymentAccount()` - Payment account
- `createTestPermission()` - Permission entity
- `createTestNotification()` - Notification entity
- `createTestVerificationCode()` - OTP code entity

## Mock Helpers

Located in `test/utils/mock-helpers.ts`:
- `createMockRepository<T>()` - Generic TypeORM repository mock
- `createMockUserRepository()` - User repository with custom find methods
- `createMockVerificationCodeRepository()` - OTP repository
- `mockJwtService` - JWT sign/verify/decode mocks
- `mockSmsService` - SMS sending mock
- `mockPermissionsService` - Permissions service mock
- `mockConfigService` - Config service mock
- `mockRequest()` / `mockResponse()` / `mockNext` - Express mocks

## Writing New Tests

### Unit Test Example
```typescript
// src/modules/example/example.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ExampleService } from './example.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExampleEntity } from './example.entity';
import { createMockRepository } from '../../test/utils/mock-helpers';

describe('ExampleService', () => {
  let service: ExampleService;
  let repository: jest.Mocked<Partial<Repository<ExampleEntity>>>;

  beforeEach(async () => {
    repository = createMockRepository<ExampleEntity>();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExampleService,
        { provide: getRepositoryToken(ExampleEntity), useValue: repository },
      ],
    }).compile();

    service = module.get<ExampleService>(ExampleService);
  });

  it('should create entity', async () => {
    repository.save.mockResolvedValue({ id: '1', name: 'Test' } as any);
    const result = await service.create({ name: 'Test' });
    expect(result.name).toBe('Test');
  });
});
```

### Integration Test Example
```typescript
// test/integration/example.integration.spec.ts
import { createIntegrationModule, getRepository } from '../setup/integration.setup';
import { ExampleModule } from '../../src/modules/example/example.module';
import { ExampleService } from '../../src/modules/example/example.service';
import { ExampleEntity } from '../../src/modules/example/example.entity';

describe('Example Module Integration', () => {
  let module: TestingModule;
  let service: ExampleService;
  let repository: Repository<ExampleEntity>;

  beforeAll(async () => {
    module = await createIntegrationModule([ExampleModule]);
    service = module.get<ExampleService>(ExampleService);
    repository = getRepository(module, ExampleEntity);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should create and find entity', async () => {
    const created = await service.create({ name: 'Integration Test' });
    const found = await repository.findOne({ where: { id: created.id } });
    expect(found).toBeDefined();
  });
});
```

### E2E Test Example
```typescript
// test/e2e/example.e2e.spec.ts
import { setupE2E, teardownE2E, getTestRequest } from '../setup/e2e.setup';
import { createTestAdmin } from '../utils/test-factories';

let request: ReturnType<typeof getTestRequest>;
let adminToken: string;

describe('Example E2E', () => {
  beforeAll(async () => {
    const { request: req } = await setupE2E();
    request = req;
    
    const adminRegister = await request.post('/api/auth/register').send({...});
    adminToken = adminRegister.body.access_token;
  });

  afterAll(async () => {
    await teardownE2E();
  });

  it('should create example', async () => {
    const response = await request
      .post('/api/examples')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E Test' })
      .expect(201);
      
    expect(response.body.name).toBe('E2E Test');
  });
});
```

## Best Practices

1. **Co-locate unit tests** with source files (`*.spec.ts` next to `*.ts`)
2. **Use test factories** for consistent test data
3. **Mock external dependencies** (SMS, Email, Payment gateways)
4. **Use SQLite in-memory** for integration/E2E tests
5. **Clean up database** between tests (`beforeEach`/`afterEach`)
6. **Test error cases** (404, 400, 401, 403, 409)
7. **Test edge cases** (empty results, pagination boundaries)
8. **Use descriptive test names** following pattern: `should [expected behavior] when [condition]`
9. **Group related tests** with `describe` blocks
10. **Keep tests independent** - no shared state between tests

## Coverage Goals

- **Unit Tests**: > 80% coverage for services, > 70% for controllers
- **Integration Tests**: Cover all module interactions
- **E2E Tests**: Cover all public API endpoints
- **Overall**: > 70% total coverage

## CI/CD Integration

Add to your pipeline:
```yaml
# Example GitHub Actions
- name: Run Unit Tests
  run: pnpm test:unit --ci --coverage
  
- name: Run Integration Tests
  run: pnpm test:integration --ci
  
- name: Run E2E Tests
  run: pnpm test:e2e --ci
```

## Troubleshooting

### Common Issues

1. **Module not found errors**: Check `moduleNameMapper` in jest.config.js
2. **Database connection errors**: Ensure SQLite is available, check entity imports
3. **Timeout errors**: Increase Jest timeout in config or test file
4. **Memory issues**: Run tests in bands (`--maxWorkers=2`)
5. **TypeScript errors**: Check `tsconfig.json` and `ts-jest` config

### Debugging Tests

```bash
# Run single test file
pnpm test:unit -- src/modules/auth/auth.service.spec.ts

# Run with verbose output
pnpm test:unit -- --verbose

# Debug specific test
pnpm test:debug -- src/modules/auth/auth.service.spec.ts
```