import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CategoryAttributeModule } from './modules/categories/category-attribute.module';
import { ProductsModule } from './modules/products/products.module';
import { ProductImageModule } from './modules/products/product-image.module';
import { ProductAttributeValueModule } from './modules/products/product-attribute-value.module';
import { CartModule } from './modules/cart/cart.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BrandsModule } from './modules/brands/brands.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { PaymentAccountsModule } from './modules/payment-accounts/payment-accounts.module';
import { DiscountModule } from './modules/discounts/discount.module';
import { FilesModule } from './modules/files/files.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './modules/audit/audit.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
      errorMessage: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفا بعدا تلاش کنید.',
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    CategoryAttributeModule,
    ProductsModule,
    ProductImageModule,
    ProductAttributeValueModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    BrandsModule,
    NotificationsModule,
    SearchModule,
    PermissionsModule,
    DeliveryModule,
    PaymentAccountsModule,
    DiscountModule,
    FilesModule,
    StorageModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
