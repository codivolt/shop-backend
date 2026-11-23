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
import { CategoryAttribute } from './category-attribute.entity';
import { Product } from '../products/product.entity';
import { slugify } from '../../common/utils/slug.util';

@Entity('categories')
@Index(['name'])
@Index(['isActive'])
@Index(['parentId'])
export class Category {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه دسته‌بندی',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'شناسه دسته‌بندی والد',
    nullable: true,
  })
  @Column({ type: 'char', length: 36, nullable: true })
  parentId: string | null;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(() => CategoryAttribute, (attribute) => attribute.category)
  attributes: CategoryAttribute[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @ApiProperty({ example: 'موبایل', description: 'نام دسته‌بندی' })
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @ApiProperty({ example: 'mobile', description: 'نامک برای URL' })
  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @ApiPropertyOptional({
    example: 'تلفن همراه و تبلت',
    description: 'توضیحات',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: true, description: 'فعال/غیرفعال' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

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
