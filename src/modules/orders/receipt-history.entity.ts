import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum ReceiptHistoryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('receipt_histories')
export class ReceiptHistory {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه kayıت تاریخچه فیش',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'شناسه سفارش مرتبط',
  })
  @Column({ type: 'char', length: 36 })
  orderId: string;

  @ApiPropertyOptional({
    example: '/files/receipts/abc123.jpg',
    description: 'آدرس فیش پرداخت بارگذاری شده',
  })
  @Column({ type: 'text', nullable: true })
  receiptImageUrl: string | null;

  @ApiProperty({
    example: 'pending',
    enum: ReceiptHistoryStatus,
    description: 'وضعیت بررسی فیش',
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: ReceiptHistoryStatus.PENDING,
  })
  status: ReceiptHistoryStatus;

  @ApiPropertyOptional({
    example: 'فیش نامعتبر است',
    description: 'دلیل رد فیش توسط ادمین',
  })
  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @ApiPropertyOptional({
    example: '2024-01-02T00:00:00Z',
    description: 'تاریخ بررسی توسط ادمین',
  })
  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'تاریخ بارگذاری' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'تاریخ به‌روزرسانی',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Order, (order) => order.receiptHistory)
  order: Order;
}
