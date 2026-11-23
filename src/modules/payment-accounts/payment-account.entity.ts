import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PaymentAccountType {
  CARD_TO_CARD = 'card_to_card',
  SHEBA = 'sheba',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  CRYPTO = 'crypto',
}

@Entity('payment_accounts')
export class PaymentAccount {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه حساب',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'کارت به کارت بانک ملی',
    description: 'نام روش پرداخت',
  })
  @Column()
  name: string;

  @ApiProperty({
    example: 'card_to_card',
    enum: PaymentAccountType,
    description: 'نوع روش پرداخت',
  })
  @Column({ type: 'varchar', length: 50 })
  type: PaymentAccountType;

  @ApiPropertyOptional({ example: 'ملی', description: 'نام بانک' })
  @Column({ nullable: true })
  bankName?: string;

  @ApiPropertyOptional({ example: 'احمد exogenous', description: 'صاحب حساب' })
  @Column({ nullable: true })
  accountHolder?: string;

  @ApiPropertyOptional({
    example: '6037991234567890',
    description: 'شماره کارت',
  })
  @Column({ nullable: true })
  cardNumber?: string;

  @ApiPropertyOptional({
    example: 'IR123456789012345678901234',
    description: 'شماره شبا',
  })
  @Column({ nullable: true })
  sheba?: string;

  @ApiPropertyOptional({
    example: 'USDT TRC20 ...',
    description: 'آدرس کیف پول ارزی',
  })
  @Column({ nullable: true })
  cryptoAddress?: string;

  @ApiProperty({ example: true, description: 'فعال/غیرفعال' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ example: 1, description: 'ترتیب نمایش' })
  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
