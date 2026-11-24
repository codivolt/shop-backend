import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('referral_tiers')
export class ReferralTier {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 10, description: 'حداقل تعداد رفرال برای این سطح' })
  @Column({ type: 'int', unique: true })
  minReferrals: number;

  @ApiPropertyOptional({ example: 10, description: 'درصد تخفیف' })
  @Column({ type: 'int', nullable: true })
  discountPercent?: number;

  @ApiPropertyOptional({ example: 50000, description: 'مبلغ تخفیف ثابت (تومان)' })
  @Column({ type: 'bigint', nullable: true })
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'نقره', description: 'نام سطح' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  name?: string;

  @ApiPropertyOptional({ example: 'توضیحات سطح', description: 'توضیحات' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ example: true, description: 'فعال/غیرفعال' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}