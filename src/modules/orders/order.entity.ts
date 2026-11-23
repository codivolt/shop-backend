import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه سفارش',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'ORD-20240101-ABC123',
    description: 'کد سفارش (برای پیگیری کوریری)',
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  orderCode: string | null;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'شناسه کاربر',
  })
  @Column({ type: 'char', length: 36 })
  userId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'شناسه آدرس',
  })
  @Column({ type: 'char', length: 36 })
  addressId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440003',
    description: 'شناسه روش ارسال',
  })
  @Column({ type: 'char', length: 36, nullable: true })
  deliveryMethodId: string | null;

  @ApiProperty({ example: 50000, description: 'هزینه ارسال' })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  deliveryPrice: number;

  @ApiPropertyOptional({
    example: 'card_to_card',
    description: 'روش پرداخت انتخاب شده',
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod: string | null;

  @ApiPropertyOptional({
    example: '/uploads/receipts/abc123.jpg',
    description: 'آدرس فیش پرداخت',
  })
  @Column({ type: 'text', nullable: true })
  receiptImageUrl: string | null;

  @ApiProperty({
    example: 'pending',
    enum: OrderStatus,
    description: 'وضعیت سفارش',
  })
  @Column({ type: 'varchar', length: 50, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({
    example: 'unpaid',
    enum: PaymentStatus,
    description: 'وضعیت پرداخت',
  })
  @Column({
    type: 'varchar',
    length: 50,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({ example: 1500000, description: 'مبلغ کل' })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalAmount: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'تاریخ ایجاد' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'تاریخ به‌روزرسانی',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];
}
