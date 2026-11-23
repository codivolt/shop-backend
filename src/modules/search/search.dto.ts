import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchQueryDto {
  @ApiProperty({ example: 'گوشی', description: 'عبارت جستجو' })
  @IsString()
  @IsNotEmpty()
  q: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'حداکثر نتیجه از هر دسته',
    default: 5,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

export type SearchResultType =
  'product' | 'category' | 'brand' | 'user' | 'order';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  count?: number;
}
