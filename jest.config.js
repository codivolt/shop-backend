module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      testEnvironment: 'node',
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      transform: {
        '^.+\\.(t|j)s$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
            module: 'commonjs',
            moduleResolution: 'node',
            resolvePackageJsonExports: false,
            verbatimModuleSyntax: false,
          },
        ],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@nestjs|rxjs|uuid|class-transformer|class-validator|reflect-metadata|typeorm))'
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@nestjs/swagger$': '<rootDir>/test/mocks/nestjs-swagger.mock.ts',
        '^@nestjs/typeorm$': '<rootDir>/test/mocks/nestjs-typeorm.mock.ts',
        '^@nestjs/cache-manager$': '<rootDir>/test/mocks/nestjs-cache-manager.mock.ts',
        '^@nestjs/passport$': '<rootDir>/test/mocks/nestjs-passport.mock.ts',
        '^@nestjs/jwt$': '<rootDir>/test/mocks/nestjs-jwt.mock.ts',
      },
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.spec.ts',
        '!src/**/*.d.ts',
        '!src/main.ts',
      ],
      coverageDirectory: '../coverage/unit',
      setupFilesAfterEnv: ['<rootDir>/test/setup/unit.setup.ts'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
      testEnvironment: 'node',
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      transform: {
        '^.+\\.(t|j)s$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
            module: 'commonjs',
            moduleResolution: 'node',
            resolvePackageJsonExports: false,
            verbatimModuleSyntax: false,
          },
        ],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@nestjs|rxjs|uuid|class-transformer|class-validator|reflect-metadata|typeorm))'
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@nestjs/swagger$': '<rootDir>/test/mocks/nestjs-swagger.mock.ts',
        '^@nestjs/typeorm$': '<rootDir>/test/mocks/nestjs-typeorm.mock.ts',
        '^@nestjs/cache-manager$': '<rootDir>/test/mocks/nestjs-cache-manager.mock.ts',
        '^@nestjs/passport$': '<rootDir>/test/mocks/nestjs-passport.mock.ts',
        '^@nestjs/jwt$': '<rootDir>/test/mocks/nestjs-jwt.mock.ts',
      },
      coverageDirectory: '../coverage/integration',
      setupFilesAfterEnv: ['<rootDir>/test/setup/integration.setup.ts'],
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.spec.ts'],
      testEnvironment: 'node',
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: '.',
      transform: {
        '^.+\\.(t|j)s$': [
          'ts-jest',
          {
            tsconfig: 'tsconfig.json',
            module: 'commonjs',
            moduleResolution: 'node',
            resolvePackageJsonExports: false,
            verbatimModuleSyntax: false,
          },
        ],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(@nestjs|rxjs|uuid|class-transformer|class-validator|reflect-metadata|typeorm))'
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@nestjs/swagger$': '<rootDir>/test/mocks/nestjs-swagger.mock.ts',
        '^@nestjs/typeorm$': '<rootDir>/test/mocks/nestjs-typeorm.mock.ts',
        '^@nestjs/cache-manager$': '<rootDir>/test/mocks/nestjs-cache-manager.mock.ts',
        '^@nestjs/passport$': '<rootDir>/test/mocks/nestjs-passport.mock.ts',
        '^@nestjs/jwt$': '<rootDir>/test/mocks/nestjs-jwt.mock.ts',
      },
      coverageDirectory: '../coverage/e2e',
      setupFilesAfterEnv: ['<rootDir>/test/setup/e2e.setup.ts'],
    },
  ],
};