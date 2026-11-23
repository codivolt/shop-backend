import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { decimalTransformer } from '../../common/transformers/decimal.transformer';

@Entity('order_items')
export class OrderItem {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه آیتم سفارش',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'شناسه سفارش',
  })
  @Column({ type: 'char', length: 36 })
  orderId: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440003',
    description: 'شناسه محصول',
    nullable: true,
  })
  @Column({ type: 'char', length: 36, nullable: true })
  productId: string | null;

  @ApiProperty({ example: 'گوشی موبایل', description: 'نام محصول (اسنپ‌شات)' })
  @Column({ type: 'varchar', length: 300 })
  productNameSnapshot: string;

  @ApiProperty({ example: 1500000, description: 'قیمت یک واحد' })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  unitPrice: number;

  @ApiProperty({ example: 2, description: 'تعداد' })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiProperty({ example: 3000000, description: 'قیمت کل آیتم' })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalPrice: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'تاریخ ایجاد' })
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
