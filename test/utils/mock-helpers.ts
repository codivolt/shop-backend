import { Repository } from 'typeorm';
import { User } from '../../src/modules/users/users.entity';
import { VerificationCode } from '../../src/modules/auth/verification-code.entity';

export const createMockRepository = <T extends { id: string }>(): Partial<
  Repository<T>
> => {
  const entities: T[] = [];

  return {
    create: jest.fn((dto: Partial<T>) => {
      const entity = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...dto,
      } as T;
      return entity;
    }),
    save: jest.fn(async (entity: T) => {
      const existingIndex = entities.findIndex((e) => e.id === entity.id);
      if (existingIndex >= 0) {
        entities[existingIndex] = entity;
      } else {
        entities.push(entity);
      }
      return entity;
    }),
    findOne: jest.fn(async (options: any) => {
      const where = options.where || options;
      return (
        entities.find((e) =>
          Object.entries(where).every(
            ([key, value]) => e[key as keyof T] === value,
          ),
        ) || null
      );
    }),
    find: jest.fn(async (options?: any) => {
      if (!options?.where) return entities;
      const where = options.where;
      return entities.filter((e) =>
        Object.entries(where).every(
          ([key, value]) => e[key as keyof T] === value,
        ),
      );
    }),
    findAndCount: jest.fn(async (options?: any) => {
      let result = entities;
      if (options?.where) {
        const where = options.where;
        result = entities.filter((e) =>
          Object.entries(where).every(
            ([key, value]) => e[key as keyof T] === value,
          ),
        );
      }
      if (options?.skip) result = result.slice(options.skip);
      if (options?.take) result = result.slice(0, options.take);
      return [result, result.length];
    }),
    update: jest.fn(async (id: string, data: Partial<T>) => {
      const index = entities.findIndex((e) => e.id === id);
      if (index >= 0) {
        entities[index] = { ...entities[index], ...data };
        return { affected: 1, raw: {}, generatedMaps: [] };
      }
      return { affected: 0, raw: {}, generatedMaps: [] };
    }),
    delete: jest.fn(async (id: string) => {
      const index = entities.findIndex((e) => e.id === id);
      if (index >= 0) {
        entities.splice(index, 1);
        return { affected: 1, raw: {} };
      }
      return { affected: 0, raw: {} };
    }),
    remove: jest.fn(async (entity: T) => {
      const index = entities.findIndex((e) => e.id === entity.id);
      if (index >= 0) {
        entities.splice(index, 1);
        return entity;
      }
      return entity;
    }),
    createQueryBuilder: jest.fn(() => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
    clear: () => {
      entities.length = 0;
    },
    getEntities: () => [...entities],
    setEntities: (newEntities: T[]) => {
      entities.length = 0;
      entities.push(...newEntities);
    },
  };
};

export const createMockUserRepository = () => {
  const mock = createMockRepository<User>();
  const userRepo = mock as jest.Mocked<Partial<Repository<User>>> & {
    findByEmail: jest.Mock;
    findByPhone: jest.Mock;
    findById: jest.Mock;
    findByEmailWithPassword: jest.Mock;
    findByPhoneWithPassword: jest.Mock;
  };

  userRepo.findByEmail = jest.fn(async (email: string) => {
    const entities = mock.getEntities();
    return entities.find((u) => u.email === email) || null;
  });

  userRepo.findByPhone = jest.fn(async (phone: string) => {
    const entities = mock.getEntities();
    return entities.find((u) => u.phone === phone) || null;
  });

  userRepo.findById = jest.fn(async (id: string) => {
    const entities = mock.getEntities();
    return entities.find((u) => u.id === id) || null;
  });

  userRepo.findByEmailWithPassword = jest.fn(async (email: string) => {
    const entities = mock.getEntities();
    const user = entities.find((u) => u.email === email);
    return user || null;
  });

  userRepo.findByPhoneWithPassword = jest.fn(async (phone: string) => {
    const entities = mock.getEntities();
    const user = entities.find((u) => u.phone === phone);
    return user || null;
  });

  return userRepo;
};

export const createMockVerificationCodeRepository = () => {
  const mock = createMockRepository<VerificationCode>();
  const vcRepo = mock as jest.Mocked<Partial<Repository<VerificationCode>>> & {
    findByPhone: jest.Mock;
  };

  vcRepo.findByPhone = jest.fn(async (phone: string) => {
    const entities = mock.getEntities();
    return entities.find((v) => v.phone === phone) || null;
  });

  return vcRepo;
};

export const mockJwtService = {
  sign: jest.fn((payload) => `mock-jwt-token-${JSON.stringify(payload)}`),
  verify: jest.fn((token) => {
    if (token.startsWith('mock-jwt-token-')) {
      return JSON.parse(token.replace('mock-jwt-token-', ''));
    }
    throw new Error('Invalid token');
  }),
  decode: jest.fn((token) => {
    if (token.startsWith('mock-jwt-token-')) {
      return JSON.parse(token.replace('mock-jwt-token-', ''));
    }
    return null;
  }),
};

export const mockSmsService = {
  sendCode: jest.fn(async (phone: string, code: string) => {
    console.log(`[MOCK SMS] To: ${phone}, Code: ${code}`);
    return { success: true };
  }),
  sendBulk: jest.fn(async (phones: string[], message: string) => {
    console.log(
      `[MOCK BULK SMS] To: ${phones.join(', ')}, Message: ${message}`,
    );
    return { success: true, sent: phones.length };
  }),
};

export const mockPermissionsService = {
  getRolePermissions: jest.fn(async () => ({
    admin: ['*'],
    manager: ['orders:read', 'orders:write', 'products:read', 'products:write'],
    customer: ['orders:read', 'cart:write', 'profile:write'],
  })),
  getUserPermissions: jest.fn(async (userId: string) => []),
  assignPermissionToUser: jest.fn(
    async (userId: string, permissionKey: string) => ({ success: true }),
  ),
  removePermissionFromUser: jest.fn(
    async (userId: string, permissionKey: string) => ({ success: true }),
  ),
  hasPermission: jest.fn(
    async (userId: string, permissionKey: string) => false,
  ),
};

export const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, any> = {
      NODE_ENV: 'test',
      PORT: 3001,
      API_PREFIX: 'api',
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
    };
    return config[key];
  }),
};

export const mockRequest = (user?: User) => ({
  user,
  headers: {},
  ip: '127.0.0.1',
  method: 'GET',
  url: '/api/test',
  cookies: {},
  get: jest.fn((name: string) => {
    const headers: Record<string, string> = {
      'user-agent': 'jest-test',
      'content-type': 'application/json',
    };
    return headers[name.toLowerCase()];
  }),
});

export const mockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
  };
  return res;
};

export const mockNext = jest.fn();
