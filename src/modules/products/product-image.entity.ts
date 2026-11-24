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

@Entity('product_images')
export class ProductImage {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه تصویر',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'شناسه محصول',
  })
  @Column({ type: 'char', length: 36 })
  productId: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'لینک تصویر',
  })
  @Column({ type: 'text' })
  imageUrl: string;

  @ApiProperty({ example: false, description: 'تصویر اصلی؟' })
  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @ApiProperty({ example: 1, description: 'ترتیب نمایش' })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

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
