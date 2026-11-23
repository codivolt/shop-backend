import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryAttributeController } from './category-attribute.controller';
import { CategoryAttributeService } from './category-attribute.service';
import { Category } from './category.entity';
import { CategoryAttribute } from './category-attribute.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, CategoryAttribute])],
  controllers: [CategoriesController, CategoryAttributeController],
  providers: [CategoriesService, CategoryAttributeService],
  exports: [CategoriesService, CategoryAttributeService, TypeOrmModule],
})
export class CategoriesModule {}
