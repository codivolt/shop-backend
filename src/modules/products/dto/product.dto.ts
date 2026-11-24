import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class CreateProductDto {
  @ApiProperty({ example: 'گوشی هوشمند', description: 'نام محصول' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'smartphone', description: 'نامک برای URL' })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    example: 'گوشی با دوربین عالی',
    description: 'توضیحات',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5000000, description: 'قیمت' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 10, description: 'موجودی' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ example: 'SKU-123', description: 'کد محصول' })
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'لینک تصویر',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'uuid-category', description: 'شناسه دسته‌بندی' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'uuid-brand',
    description: 'شناسه برند',
  })
  @Transform(emptyToUndefined)
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ example: true, description: 'فعال/غیرفعال' })
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false, description: 'محصول پیشنهادی' })
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
