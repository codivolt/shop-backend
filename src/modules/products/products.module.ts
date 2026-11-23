import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductImageController } from './product-image.controller';
import { ProductImageService } from './product-image.service';
import { ProductAttributeValueController } from './product-attribute-value.controller';
import { ProductAttributeValueService } from './product-attribute-value.service';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { CategoryAttribute } from '../categories/category-attribute.entity';
import { CategoriesModule } from '../categories/categories.module';
import { BrandsModule } from '../brands/brands.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      ProductAttributeValue,
      CategoryAttribute,
    ]),
    CategoriesModule,
    BrandsModule,
  ],
  controllers: [
    ProductsController,
    ProductImageController,
    ProductAttributeValueController,
  ],
  providers: [
    ProductsService,
    ProductImageService,
    ProductAttributeValueService,
  ],
  exports: [
    ProductsService,
    ProductImageService,
    ProductAttributeValueService,
    TypeOrmModule,
  ],
})
export class ProductsModule {}
