import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

export enum DiscountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  USED_UP = 'used_up',
}

@Entity('discount_codes')
export class DiscountCode {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'SAVE20', description: 'کد تخفیف' })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @ApiPropertyOptional({ example: 'تخفیف ویژه بهار', description: 'توضیحات' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ enum: DiscountType, example: 'percent', description: 'نوع تخفیف' })
  @Column({
    type: 'enum',
    enum: DiscountType,
  })
  type: DiscountType;

  @ApiProperty({ example: 20, description: 'مقدار تخفیف (درصد یا مبلغ ثابت)' })
  @Column({ type: 'int' })
  value: number;

  @ApiPropertyOptional({ example: 50000, description: 'حداقل مبلغ سفارش برای اعمال (تومان)' })
  @Column({ type: 'bigint', nullable: true })
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 100000, description: 'حداکثر مبلغ تخفیف (برای درصدی) (تومان)' })
  @Column({ type: 'bigint', nullable: true })
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ example: 100, description: 'محدودیت تعداد استفاده کل' })
  @Column({ type: 'int', nullable: true })
  usageLimit?: number;

  @ApiPropertyOptional({ example: 1, description: 'محدودیت استفاده برای هر کاربر' })
  @Column({ type: 'int', default: 1 })
  usageLimitPerUser: number;

  @ApiProperty({ example: 0, description: 'تعداد استفاده شده' })
  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'تاریخ انقضا' })
  @Column({ type: 'datetime', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ enum: DiscountStatus, example: 'active', description: 'وضعیت' })
  @Column({
    type: 'enum',
    enum: DiscountStatus,
    default: DiscountStatus.ACTIVE,
  })
  status: DiscountStatus;

  @ApiProperty({ example: true, description: 'فعال/غیرفعال' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}