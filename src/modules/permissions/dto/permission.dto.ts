import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';
import { Permission } from '../permission.entity';

export class CreatePermissionDto {
  @ApiProperty({ example: 'products.create' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'ایجاد محصول' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'توضیحات' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional({ example: 'ایجاد محصول' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'توضیحات' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class PermissionResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'products.create' })
  key: string;

  @ApiProperty({ example: 'ایجاد محصول' })
  name: string;

  @ApiPropertyOptional({ description: 'توضیحات' })
  description: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  static fromEntity(p: Permission): PermissionResponse {
    return {
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
    };
  }
}

export class AssignPermissionsDto {
  @ApiProperty({
    example: ['products.create', 'products.update'],
    description: 'کلیدهای مجاز',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissionKeys: string[];
}

export class UserPermissionResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  permissionId: string;

  @ApiProperty({ type: PermissionResponse })
  permission: PermissionResponse;
}
