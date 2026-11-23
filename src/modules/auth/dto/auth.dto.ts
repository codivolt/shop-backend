import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsOptional,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ali@example.com', description: 'ایمیل کاربر' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'رمز عبور حداقل 6 کاراکتر' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'علی', description: 'نام', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    example: 'أحمدی',
    description: 'نام خانوادگی',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    example: '09123456789',
    description: 'شماره تماس',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: '09123456789', description: 'شماره موبایل' })
  @IsString()
  @Matches(/^(\+98|0)?9\d{9}$/, { message: 'شماره موبایل نامعتبر است' })
  phone: string;

  @ApiProperty({ example: '123456', description: 'رمز عبور' })
  @IsString()
  password: string;
}

export class AuthResponse {
  @ApiProperty({ example: 'eyJhbGci...', description: 'توکن دسترسی JWT' })
  access_token: string;

  @ApiProperty({ description: 'مشخصات کاربر' })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl?: string | null;
    passwordSetAt?: Date | null;
    role: string;
    permissions: string[];
  };
}
