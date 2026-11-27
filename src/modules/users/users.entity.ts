import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserPermission } from '../permissions/user-permission.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  COURIER = 'courier',
}

const REFERRAL_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const REFERRAL_CODE_LENGTH = 8;

function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += REFERRAL_CODE_CHARS.charAt(Math.floor(Math.random() * REFERRAL_CODE_CHARS.length));
  }
  return code;
}

@Entity('users')
export class User {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'شناسه کاربر',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'ali@example.com', description: 'ایمیل' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ example: '123456', description: 'رمز عبور', writeOnly: true })
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @ApiPropertyOptional({ example: 'علی', description: 'نام' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @ApiPropertyOptional({ example: 'أحمدی', description: 'نام خانوادگی' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @ApiPropertyOptional({ example: '09123456789', description: 'شماره تماس' })
  @Column({ type: 'varchar', length: 30, nullable: true, unique: true })
  phone: string;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00Z',
    description: 'زمان تأیید شماره تماس',
    nullable: true,
  })
  @Column({ type: 'datetime', nullable: true })
  phoneVerifiedAt: Date | null;

  @ApiPropertyOptional({ example: '0012345679', description: 'کد ملی' })
  @Column({ type: 'varchar', length: 10, nullable: true, unique: true })
  nationalId: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'لینک آواتار',
  })
  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00Z',
    description: 'زمان تعیین رمز عبور توسط کاربر (null یعنی رمز تعیین نشده)',
    nullable: true,
  })
  @Column({ type: 'datetime', nullable: true })
  passwordSetAt: Date | null;

  @ApiProperty({
    example: 'customer',
    enum: UserRole,
    description: 'نقش کاربر',
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty({ example: true, description: 'فعال/غیرفعال' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'نسخه توکن برای انقضای توکن‌های قبلی' })
  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @ApiPropertyOptional({ description: 'توکن تازه‌سازی (هش شده)' })
  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash: string | null;

  @ApiPropertyOptional({ example: 'REF12345', description: 'کد رفرال کاربر' })
  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  referralCode: string | null;

  @ApiPropertyOptional({ description: 'کاربر معرف (کد رفرال)' })
  @Column({ type: 'char', length: 36, nullable: true })
  referredBy: string | null;

  @ApiPropertyOptional({ description: 'کاربرانی که با کد رفرال این کاربر ثبت‌نام کرده‌اند' })
  referredUsers: User[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'تاریخ ایجاد' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'تاریخ به‌روزرسانی',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'مجازهای اختصاص یافته' })
  @OneToMany(() => UserPermission, (up) => up.user)
  permissions: UserPermission[];

  @BeforeInsert()
  async generateReferralCodeIfNeeded() {
    if (!this.referralCode) {
      this.referralCode = generateReferralCode();
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}
