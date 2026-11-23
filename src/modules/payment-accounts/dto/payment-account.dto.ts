import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentAccount, PaymentAccountType } from '../payment-account.entity';

export class CreatePaymentAccountDto {
  @ApiProperty({
    example: 'کارت به کارت بانک ملی',
    description: 'نام روش پرداخت',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'card_to_card',
    enum: PaymentAccountType,
    description: 'نوع روش پرداخت',
  })
  @IsEnum(PaymentAccountType)
  type: PaymentAccountType;

  @ApiPropertyOptional({ example: 'ملی', description: 'نام بانک' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'احمد exogenous', description: 'صاحب حساب' })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({
    example: '6037991234567890',
    description: 'شماره کارت',
  })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiPropertyOptional({
    example: 'IR123456789012345678901234',
    description: 'شماره شبا',
  })
  @IsOptional()
  @IsString()
  sheba?: string;

  @ApiPropertyOptional({
    example: 'USDT TRC20 ...',
    description: 'آدرس کیف پول ارزی',
  })
  @IsOptional()
  @IsString()
  cryptoAddress?: string;

  @ApiPropertyOptional({ example: true, description: 'فعال/غیرفعال' })
  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'ترتیب نمایش' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  sortOrder?: number;
}

export class UpdatePaymentAccountDto {
  @ApiPropertyOptional({ example: 'کارت به کارت بانک ملی' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'card_to_card', enum: PaymentAccountType })
  @IsOptional()
  @IsEnum(PaymentAccountType)
  type?: PaymentAccountType;

  @ApiPropertyOptional({ example: 'ملی' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'احمد exogenous' })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({ example: '6037991234567890' })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiPropertyOptional({ example: 'IR123456789012345678901234' })
  @IsOptional()
  @IsString()
  sheba?: string;

  @ApiPropertyOptional({ example: 'USDT TRC20 ...' })
  @IsOptional()
  @IsString()
  cryptoAddress?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  sortOrder?: number;
}

export class PaymentAccountResponse {
  id: string;
  name: string;
  type: PaymentAccountType;
  bankName?: string;
  accountHolder?: string;
  cardNumber?: string;
  sheba?: string;
  cryptoAddress?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(paymentAccount: PaymentAccount): PaymentAccountResponse {
    return {
      id: paymentAccount.id,
      name: paymentAccount.name,
      type: paymentAccount.type,
      bankName: paymentAccount.bankName,
      accountHolder: paymentAccount.accountHolder,
      cardNumber: paymentAccount.cardNumber,
      sheba: paymentAccount.sheba,
      cryptoAddress: paymentAccount.cryptoAddress,
      isActive: paymentAccount.isActive,
      sortOrder: paymentAccount.sortOrder,
      createdAt: paymentAccount.createdAt,
      updatedAt: paymentAccount.updatedAt,
    };
  }
}
