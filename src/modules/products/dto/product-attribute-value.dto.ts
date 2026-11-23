import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateProductAttributeValueDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'شناسه ویژگی دسته‌بندی',
  })
  @IsUUID()
  attributeId: string;

  @ApiProperty({ example: 'آبی', description: 'مقدار ویژگی' })
  @IsString()
  @IsNotEmpty()
  value: string;
}

export class UpdateProductAttributeValueDto {
  @ApiPropertyOptional({ example: 'قرمز', description: 'مقدار جدید' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  value?: string;
}

export class ProductAttributeValueResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  attributeId: string;

  @ApiProperty({ example: 'آبی' })
  value: string;

  @ApiPropertyOptional({
    description: 'اطلاعات ویژگی مربوطه',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      type: { type: 'string' },
    },
  })
  attribute?: {
    id: string;
    name: string;
    type: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
