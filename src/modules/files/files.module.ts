import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [UsersModule, OrdersModule],
  controllers: [FilesController],
})
export class FilesModule {}