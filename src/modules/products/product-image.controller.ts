import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ProductImageService } from './product-image.service';
import {
  CreateProductImageDto,
  UpdateProductImageDto,
  ProductImageResponse,
} from './dto/product-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';

@ApiTags('تصاویر محصول')
@ApiBearerAuth('access-token')
@ApiParam({ name: 'productId', description: 'شناسه محصول' })
@Controller('products/:productId/images')
export class ProductImageController {
  constructor(private readonly imageService: ProductImageService) {}

  @Post()
  @ApiOperation({ summary: 'افزودن تصویر به محصول (فقط ادمین)' })
  @ApiBody({ type: CreateProductImageDto })
  @ApiResponse({
    status: 201,
    description: 'تصویر اضافه شد',
    type: ProductImageResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductImageDto,
  ): Promise<ProductImageResponse> {
    return this.imageService.create(productId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست تصاویر یک محصول' })
  @ApiResponse({
    status: 200,
    description: 'لیست تصاویر',
    type: [ProductImageResponse],
  })
  async findAll(
    @Param('productId') productId: string,
  ): Promise<ProductImageResponse[]> {
    return this.imageService.findAll(productId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی تصویر (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه تصویر' })
  @ApiBody({ type: UpdateProductImageDto })
  @ApiResponse({
    status: 200,
    description: 'تصویر بروزرسانی شد',
    type: ProductImageResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('productId') productId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductImageDto,
  ): Promise<ProductImageResponse> {
    return this.imageService.update(productId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف تصویر (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه تصویر' })
  @ApiResponse({ status: 200, description: 'تصویر حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('productId') productId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.imageService.remove(productId, id);
  }
}
