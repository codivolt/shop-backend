import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('addresses')
export class Address {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه آدرس',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'شناسه کاربر',
  })
  @Column({ type: 'char', length: 36 })
  userId: string;

  @ApiPropertyOptional({ example: 'خانه', description: 'عنوان آدرس' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string;

  @ApiPropertyOptional({ example: 'علی احمدی', description: 'نام گیرنده' })
  @Column({ type: 'varchar', length: 200, nullable: true })
  recipientName: string;

  @ApiPropertyOptional({ example: '09123456789', description: 'شماره تماس' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string;

  @ApiProperty({
    example: 'تهران، خیابان ولیعصر،building 123',
    description: 'آدرس کامل',
  })
  @Column({ type: 'text' })
  addressLine: string;

  @ApiProperty({ example: 'تهران', description: 'شهر' })
  @Column({ type: 'varchar', length: 100 })
  city: string;

  @ApiProperty({ example: 'تهران', description: 'استان' })
  @Column({ type: 'varchar', length: 100 })
  province: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'کد پستی' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @ApiProperty({ example: 'ایران', description: 'کشور' })
  @Column({ type: 'varchar', length: 100, default: 'ایران' })
  country: string;

  @ApiProperty({ example: true, description: 'آدرس پیش‌فرض' })
  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

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
