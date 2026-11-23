import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min, IsOptional } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'uuid-product', description: 'شناسه محصول' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ example: 2, description: 'تعداد', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, description: 'تعداد جدید' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CartItemResponse {
  @ApiProperty({ example: 'uuid-cart-item', description: 'شناسه آیتم سبد' })
  id: string;

  @ApiProperty({ example: 'uuid-product', description: 'شناسه محصول' })
  productId: string;

  @ApiProperty({
    description: 'جزئیات محصول',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      price: { type: 'number' },
      imageUrl: { type: 'string', nullable: true },
      stock: { type: 'number' },
    },
  })
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    imageUrl: string | null;
    stock: number;
  };

  @ApiProperty({ example: 2, description: 'تعداد' })
  quantity: number;

  @ApiProperty({ example: 10000000, description: 'مبلغ کل آیتم' })
  totalPrice: number;
}
