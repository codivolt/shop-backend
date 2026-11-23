import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImageController } from './product-image.controller';
import { ProductImageService } from './product-image.service';
import { ProductImage } from './product-image.entity';
import { Product } from './product.entity';
import { ProductsModule } from './products.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProductImage, Product]), ProductsModule],
  controllers: [ProductImageController],
  providers: [ProductImageService],
  exports: [ProductImageService],
})
export class ProductImageModule {}
