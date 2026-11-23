import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryAttributeController } from './category-attribute.controller';
import { CategoryAttributeService } from './category-attribute.service';
import { CategoryAttribute } from './category-attribute.entity';
import { Category } from './category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryAttribute, Category])],
  controllers: [CategoryAttributeController],
  providers: [CategoryAttributeService],
  exports: [CategoryAttributeService],
})
export class CategoryAttributeModule {}
