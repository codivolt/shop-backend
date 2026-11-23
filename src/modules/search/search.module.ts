import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { BrandsModule } from '../brands/brands.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    UsersModule,
    OrdersModule,
    CacheModule.registerAsync({
      isGlobal: false,
      useFactory: async () => ({
        store: (await import('cache-manager-redis-store')).default,
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
        ttl: 60 * 1000,
        max: 1000,
      }),
    }),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
