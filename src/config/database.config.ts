import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  if (isProduction) {
    // In production, require explicit config and disable synchronize
    const sync = configService.get<string>('DB_SYNC', 'false') === 'true';
    if (sync) {
      throw new Error('DB_SYNC must be false in production. Use migrations instead.');
    }
  }

  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST', 'host.docker.internal'),
    port: configService.get<number>('DB_PORT', 3306),
    username: configService.get<string>('DB_USERNAME', 'shop_user'),
    password: configService.get<string>('DB_PASSWORD', 'shop_password'),
    database: configService.get<string>('DB_DATABASE', 'shop_db'),
    entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: !isProduction && configService.get<string>('DB_SYNC', 'true') === 'true',
    logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
    charset: 'utf8mb4',
    timezone: '+00:00',
  };
};
