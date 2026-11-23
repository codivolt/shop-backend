import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'خانه', description: 'عنوان آدرس' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'علی احمدی', description: 'نام گیرنده' })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiPropertyOptional({ example: '09123456789', description: 'شماره تماس' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'تهران، خیابان ولیعصر،building 123',
    description: 'آدرس کامل',
  })
  @IsString()
  @IsNotEmpty()
  addressLine: string;

  @ApiProperty({ example: 'تهران', description: 'شهر' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'تهران', description: 'استان' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'کد پستی' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'ایران', description: 'کشور' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: false, description: 'آدرس پیش‌فرض' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'خانه', description: 'عنوان آدرس' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'علی احمدی', description: 'نام گیرنده' })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiPropertyOptional({ example: '09123456789', description: 'شماره تماس' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'تهران، خیابان ولیعصر،building 123',
    description: 'آدرس کامل',
  })
  @IsString()
  @IsOptional()
  addressLine?: string;

  @ApiPropertyOptional({ example: 'تهران', description: 'شهر' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'تهران', description: 'استان' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ example: '1234567890', description: 'کد پستی' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'ایران', description: 'کشور' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: false, description: 'آدرس پیش‌فرض' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
