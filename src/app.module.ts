import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
