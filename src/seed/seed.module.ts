import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '../config/config.module';
import { User } from '../modules/users/users.entity';
import { Permission } from '../modules/permissions/permission.entity';
import { RolePermission } from '../modules/permissions/role-permission.entity';
import { UserPermission } from '../modules/permissions/user-permission.entity';
import { UsersModule } from '../modules/users/users.module';
import { PermissionsModule } from '../modules/permissions/permissions.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      Permission,
      RolePermission,
      UserPermission,
    ]),
    UsersModule,
    PermissionsModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
