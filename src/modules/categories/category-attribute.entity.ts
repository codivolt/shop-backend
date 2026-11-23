import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

export enum AttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  BOOLEAN = 'boolean',
}

@Entity('category_attributes')
export class CategoryAttribute {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه ویژگی',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'شناسه دسته‌بندی',
  })
  @Column({ type: 'char', length: 36 })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.attributes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ApiProperty({ example: 'رنگ', description: 'نام ویژگی' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({
    example: 'select',
    enum: AttributeType,
    description: 'نوع ویژگی',
  })
  @Column({
    type: 'enum',
    enum: AttributeType,
    default: AttributeType.TEXT,
  })
  type: AttributeType;

  @ApiPropertyOptional({
    example: '["قرمز","آبی","سبز"]',
    description: 'گزینه‌ها برای نوع select (JSON)',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  options: string | null;

  @ApiProperty({ example: true, description: 'اجباری است؟' })
  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

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
