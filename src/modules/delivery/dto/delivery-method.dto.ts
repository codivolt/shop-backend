import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDeliveryMethodDto {
  @ApiProperty({ example: 'پست ایران', description: 'نام روش ارسال' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 50000, description: 'قیمت ارسال به تومان' })
  @IsNumber()
  @IsPositive()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 'ارسال از طریق پست ایران',
    description: 'توضیحات روش ارسال',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({ example: true, description: 'فعال/غیرفعال' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateDeliveryMethodDto {
  @ApiPropertyOptional({
    example: 'پست ایران سریع',
    description: 'نام روش ارسال',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 75000, description: 'قیمت ارسال به تومان' })
  @IsNumber()
  @IsPositive()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    example: 'ارسال از طریق پست ایران سریع',
    description: 'توضیحات روش ارسال',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({ example: true, description: 'فعال/غیرفعال' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class DeliveryMethodResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
