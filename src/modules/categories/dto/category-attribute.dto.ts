import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { AttributeType } from '../category-attribute.entity';

export class CreateCategoryAttributeDto {
  @ApiProperty({ example: 'رنگ', description: 'نام ویژگی' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'select',
    enum: AttributeType,
    description: 'نوع ویژگی',
  })
  @IsEnum(AttributeType)
  type: AttributeType;

  @ApiPropertyOptional({
    example: '["قرمز","آبی","سبز"]',
    description: 'گزینه‌ها برای نوع select (JSON)',
  })
  @IsString()
  @IsOptional()
  options?: string;

  @ApiPropertyOptional({ example: false, description: 'اجباری است؟' })
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'ترتیب نمایش' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateCategoryAttributeDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: AttributeType })
  @IsEnum(AttributeType)
  @IsOptional()
  type?: AttributeType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  options?: string;

  @ApiPropertyOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class CategoryAttributeResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AttributeType })
  type: AttributeType;

  @ApiPropertyOptional({ nullable: true })
  options: string | null;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
