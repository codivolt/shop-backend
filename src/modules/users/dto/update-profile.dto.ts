import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'علی', description: 'نام' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'احمدی', description: 'نام خانوادگی' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '09123456789', description: 'شماره موبایل' })
  @IsString()
  @IsOptional()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone?: string;

  @ApiPropertyOptional({ example: '0012345679', description: 'کد ملی' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'کد ملی باید ۱۰ رقم باشد' })
  nationalId?: string;

  @ApiPropertyOptional({
    example: '/uploads/avatars/avatar.png',
    description: 'لینک آواتار',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'REF12345',
    description: 'کد رفرال (اختیاری، برای دریافت overwhel)',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Z0-9]{6,20}$/, {
    message: 'کد رفرال باید فقط شامل حروف بزرگ انگلیسی و عدد باشد (۶ تا ۲۰ کاراکتر)',
  })
  referralCode?: string;
}

export class ChangePasswordDto {
  @ApiPropertyOptional({
    example: '123456',
    description: 'رمز عبور فعلی (اگر قبلاً رمز تعیین شده باشد)',
  })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({ example: 'new-password', description: 'رمز عبور جدید' })
  @IsString()
  @MinLength(6, { message: 'رمز عبور باید حداقل ۶ کاراکتر باشد' })
  newPassword: string;
}
