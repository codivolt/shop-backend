import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max, IsString, MaxLength } from 'class-validator';

export class CreateReferralTierDto {
  @ApiProperty({ example: 10, description: 'حداقل تعداد رفرال برای این سطح' })
  @IsInt()
  @Min(1)
  minReferrals: number;

  @ApiPropertyOptional({ example: 10, description: 'درصد تخفیف (0-100)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 50000, description: 'مبلغ تخفیف ثابت (تومان)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'نقره', description: 'نام سطح' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'توضیحات سطح', description: 'توضیحات' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'فعال/غیرفعال' })
  @IsOptional()
  isActive?: boolean;
}

export class UpdateReferralTierDto {
  @ApiPropertyOptional({ example: 10, description: 'حداقل تعداد رفرال برای این سطح' })
  @IsInt()
  @IsOptional()
  @Min(1)
  minReferrals?: number;

  @ApiPropertyOptional({ example: 10, description: 'درصد تخفیف (0-100)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ example: 50000, description: 'مبلغ تخفیف ثابت (تومان)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ example: 'نقره', description: 'نام سطح' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'توضیحات سطح', description: 'توضیحات' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'فعال/غیرفعال' })
  @IsOptional()
  isActive?: boolean;
}