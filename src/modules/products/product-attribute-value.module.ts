import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductAttributeValueController } from './product-attribute-value.controller';
import { ProductAttributeValueService } from './product-attribute-value.service';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { Product } from './product.entity';
import { CategoryAttribute } from '../categories/category-attribute.entity';
import { ProductsModule } from './products.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductAttributeValue,
      Product,
      CategoryAttribute,
    ]),
    ProductsModule,
    CategoriesModule,
  ],
  controllers: [ProductAttributeValueController],
  providers: [ProductAttributeValueService],
  exports: [ProductAttributeValueService],
})
export class ProductAttributeValueModule {}
