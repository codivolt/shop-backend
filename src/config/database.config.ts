import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get<string>('DB_HOST', 'host.docker.internal'),
  port: configService.get<number>('DB_PORT', 3306),
  username: configService.get<string>('DB_USERNAME', 'shop_user'),
  password: configService.get<string>('DB_PASSWORD', 'shop_password'),
  database: configService.get<string>('DB_DATABASE', 'shop_db'),
  entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
  synchronize: configService.get<string>('DB_SYNC', 'true') === 'true',
  logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
  charset: 'utf8mb4',
  timezone: '+00:00',
});
