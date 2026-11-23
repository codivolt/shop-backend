import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SendCodeDto {
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'شماره تلفن نامعتبر است' })
  phone: string;
}

export class VerifyCodeDto {
  @ApiProperty({ example: '09123456789', description: 'شماره تلفن همراه' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456', description: 'کد تایید 6 رقمی' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'کد تایید 6 رقمی است' })
  code: string;
}
