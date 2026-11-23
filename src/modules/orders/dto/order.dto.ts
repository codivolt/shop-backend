import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsUUID,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { OrderStatus, PaymentStatus } from '../order.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CourierDeliverDto {
  @ApiProperty({
    example: 'ORD-20240101-ABC123',
    description: 'کد سفارش برای تحویل',
  })
  @IsString()
  orderCode: string;
}

export class CreateOrderItemDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440003',
    description: 'شناسه محصول (برای محاسبهٔ قیمت از پایگاه داده)',
  })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    example: 'گوشی موبایل',
    description: 'نام محصول (در صورت نداشتن شناسه محصول)',
  })
  @IsString()
  @IsOptional()
  productNameSnapshot?: string;

  @ApiPropertyOptional({
    example: 1500000,
    description: 'قیمت یک واحد (فقط برای اقلام بدون شناسه محصول)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @ApiProperty({ example: 2, description: 'تعداد' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'شناسه آدرس',
  })
  @IsUUID()
  addressId: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440003',
    description: 'شناسه روش ارسال',
  })
  @IsUUID()
  @IsOptional()
  deliveryMethodId?: string;

  @ApiPropertyOptional({
    example: 'card_to_card',
    description: 'روش پرداخت انتخاب شده',
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({
    example: [
      {
        productId: '...',
        productNameSnapshot: 'گوشی',
        unitPrice: 1500000,
        quantity: 2,
      },
    ],
    description: 'لیست آیتم‌های سفارش',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 'processing',
    enum: OrderStatus,
    description: 'وضعیت جدید سفارش',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({
    example: 'paid',
    enum: PaymentStatus,
    description: 'وضعیت پرداخت جدید',
  })
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}

export class OrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس شناسه کاربر' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
