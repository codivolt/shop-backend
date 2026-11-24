import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { CategoryAttribute } from '../categories/category-attribute.entity';

@Entity('product_attribute_values')
export class ProductAttributeValue {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه مقدار ویژگی',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'شناسه محصول',
  })
  @Column({ type: 'char', length: 36 })
  productId: string;

  @ManyToOne(() => Product, (product) => product.attributeValues, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'شناسه ویژگی دسته‌بندی',
  })
  @Column({ type: 'char', length: 36 })
  attributeId: string;

  @ManyToOne(() => CategoryAttribute, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attributeId' })
  attribute: CategoryAttribute;

  @ApiProperty({ example: 'آبی', description: 'مقدار ویژگی' })
  @Column({ type: 'varchar', length: 255 })
  value: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'تاریخ ایجاد' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'تاریخ به‌روزرسانی',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
