import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_logs')
@Index(['createdAt'])
export class AuditLog {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyOptional({ description: 'شناسه کاربر انجام‌دهنده' })
  @Column({ type: 'char', length: 36, nullable: true })
  userId: string | null;

  @ApiPropertyOptional({ description: 'نام کاربر انجام‌دهنده' })
  @Column({ type: 'varchar', length: 200, nullable: true })
  userName: string | null;

  @ApiPropertyOptional({ description: 'شماره تماس کاربر انجام‌دهنده' })
  @Column({ type: 'varchar', length: 30, nullable: true })
  userPhone: string | null;

  @ApiPropertyOptional({ description: 'نقش کاربر انجام‌دهنده' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  userRole: string | null;

  @ApiProperty({ description: 'متد HTTP' })
  @Column({ type: 'varchar', length: 10 })
  method: string;

  @ApiProperty({ description: 'مسیر درخواست' })
  @Column({ type: 'varchar', length: 500 })
  path: string;

  @ApiPropertyOptional({ description: 'کد وضعیت پاسخ' })
  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  @ApiPropertyOptional({ description: 'آی‌پی انجام‌دهنده' })
  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @ApiProperty({ description: 'زمان ثبت' })
  @CreateDateColumn()
  createdAt: Date;
}