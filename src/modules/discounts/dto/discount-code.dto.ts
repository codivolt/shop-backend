import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsDateString,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DiscountType, DiscountStatus } from '../discount-code.entity';

export class CreateDiscountCodeDto {
  @ApiProperty({ example: 'SAVE20', description: 'کد تخفیف (حروف بزرگ و عدد)' })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9]+$/, { message: 'کد تخفیف باید فقط شامل حروف بزرگ انگلیسی و عدد باشد' })
  code: string;

  @ApiPropertyOptional({ example: 'تخفیف ویژه بهار', description: 'توضیحات' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: DiscountType, example: 'percent', description: 'نوع تخفیف' })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ example: 20, description: 'مقدار تخفیف' })
  @IsInt()
  @Min(1)
  value: number;

  @ApiPropertyOptional({ example: 50000, description: 'حداقل مبلغ سفارش (تومان)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 100000, description: 'حداکثر مبلغ تخفیف برای نوع درصدی (تومان)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ example: 100, description: 'محدودیت تعداد استفاده کل' })
  @IsInt()
  @IsOptional()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ example: 1, description: 'محدودیت استفاده برای هر کاربر' })
  @IsInt()
  @IsOptional()
  @Min(1)
  usageLimitPerUser?: number;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'تاریخ انقضا' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: true, description: 'فعال/غیرفعال' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDiscountCodeDto {
  @ApiPropertyOptional({ example: 'تخفیف ویژه بهار', description: 'توضیحات' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: DiscountType, example: 'percent', description: 'نوع تخفیف' })
  @IsEnum(DiscountType)
  @IsOptional()
  type?: DiscountType;

  @ApiPropertyOptional({ example: 20, description: 'مقدار تخفیف' })
  @IsInt()
  @IsOptional()
  @Min(1)
  value?: number;

  @ApiPropertyOptional({ example: 50000, description: 'حداقل مبلغ سفارش (تومان)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: 100000, description: 'حداکثر مبلغ تخفیف برای نوع درصدی (تومان)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ example: 100, description: 'محدودیت تعداد استفاده کل' })
  @IsInt()
  @IsOptional()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ example: 1, description: 'محدودیت استفاده برای هر کاربر' })
  @IsInt()
  @IsOptional()
  @Min(1)
  usageLimitPerUser?: number;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'تاریخ انقضا' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ example: true, description: 'فعال/غیرفعال' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ValidateDiscountCodeDto {
  @ApiProperty({ example: 'SAVE20', description: 'کد تخفیف' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 150000, description: 'مبلغ سفارش (تومان)' })
  @IsInt()
  @Min(0)
  orderAmount: number;

  @ApiPropertyOptional({ example: 'user-id', description: 'شناسه کاربر' })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class DiscountCodeQueryDto {
  @ApiPropertyOptional({ example: 'SAVE', description: 'جستجو در کد یا توضیحات' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: DiscountStatus, example: 'active', description: 'فیلتر وضعیت' })
  @IsEnum(DiscountStatus)
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: DiscountStatus;

  @ApiPropertyOptional({ example: 1, description: 'شماره صفحه' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'تعداد در صفحه' })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}