import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../products/product.entity';
import { slugify } from '../../common/utils/slug.util';

@Entity('brands')
@Index(['name'])
@Index(['isActive'])
export class Brand {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه برند',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'سامسونگ', description: 'نام برند' })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiProperty({ example: 'samsung', description: 'نامک برای URL' })
  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @ApiPropertyOptional({
    example: 'برند کره‌ای',
    description: 'توضیحات',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
    description: 'لینک لوگو',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  logo: string | null;

  @ApiProperty({ example: true, description: 'فعال/غیرفعال' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Product, (product) => product.brand)
  products: Product[];

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
