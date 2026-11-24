import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { ProductImage } from './product-image.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';
import { slugify } from '../../common/utils/slug.util';

@Entity('products')
@Index(['name'])
@Index(['isActive'])
@Index(['categoryId'])
@Index(['brandId'])
export class Product {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه محصول',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'شناسه دسته‌بندی',
  })
  @Column({ type: 'char', length: 36 })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'شناسه برند',
    nullable: true,
  })
  @Column({ type: 'char', length: 36, nullable: true })
  brandId: string | null;

  @ManyToOne(() => Brand, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand | null;

  @ApiProperty({ example: 'گوشی هوشمند', description: 'نام محصول' })
  @Column({ type: 'varchar', length: 300 })
  name: string;

  @ApiProperty({ example: 'smartphone', description: 'نامک برای URL' })
  @Column({ type: 'varchar', length: 300, unique: true })
  slug: string;

  @ApiPropertyOptional({
    example: 'گوشی با دوربین عالی',
    description: 'توضیحات',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: 5000000, description: 'قیمت' })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  price: number;

  @ApiProperty({ example: 10, description: 'موجودی' })
  @Column({ type: 'int', default: 0 })
  stock: number;

  @ApiPropertyOptional({
    example: 'SKU-123',
    description: 'کد محصول',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  sku: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'لینک تصویر اصلی',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: true, description: 'فعال/غیرفعال' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: false, description: 'محصول پیشنهادی/ویژه' })
  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];

  @OneToMany(
    () => ProductAttributeValue,
    (attributeValue) => attributeValue.product,
  )
  attributeValues: ProductAttributeValue[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'تاریخ ایجاد' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'تاریخ به‌روزرسانی',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (!this.slug && this.name) {
      this.slug = slugify(this.name);
    }
  }
}
