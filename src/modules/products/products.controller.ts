import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Product } from './product.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../users/users.entity';
import { PERMISSIONS } from '../auth/constants';
import { validateImageFile, processAndSaveImage, MAX_FILE_SIZE } from '../../common/utils/secure-upload.util';

const PRODUCT_IMAGE_DIR = join(process.cwd(), 'uploads', 'products');
mkdirSync(PRODUCT_IMAGE_DIR, { recursive: true });

@ApiTags('محصولات')
@ApiBearerAuth('access-token')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد محصول جدید (فقط ادمین)' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'محصول ایجاد شد', type: Product })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست محصولات' })
  @ApiPaginatedResponse(Product)
  async findAll(
    @Query() query: ProductQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    return this.productsService.findAll(query);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'محصولات یک دسته‌بندی' })
  @ApiParam({ name: 'categoryId', description: 'شناسه دسته‌بندی' })
  @ApiPaginatedResponse(Product)
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query() query: ProductQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    return this.productsService.findByCategory(categoryId, query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'جزئیات محصول با نامک' })
  @ApiParam({ name: 'slug', description: 'نامک محصول' })
  @ApiResponse({ status: 200, description: 'جزئیات محصول', type: Product })
  async findBySlug(@Param('slug') slug: string): Promise<Product> {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک محصول' })
  @ApiParam({ name: 'id', description: 'شناسه محصول' })
  @ApiResponse({ status: 200, description: 'جزئیات محصول', type: Product })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.PRODUCTS_VIEW)
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی محصول (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه محصول' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'محصول بروزرسانی شد',
    type: Product,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف محصول (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه محصول' })
  @ApiResponse({ status: 200, description: 'محصول حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_DELETE)
  async remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }

  @Get('featured/list')
  @ApiOperation({ summary: 'لیست محصولات پیشنهادی' })
  @ApiResponse({ status: 200, description: 'لیست محصولات پیشنهادی', type: [Product] })
  async getFeatured(): Promise<Product[]> {
    return this.productsService.getFeatured();
  }

  @Post('upload-image')
  @ApiOperation({ summary: 'آپلود تصویر محصول (فقط ادمین)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'تصویر آپلود شد', schema: { type: 'object', properties: { imageUrl: { type: 'string' } } } })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async uploadImage(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new BadRequestException('فایل تصویر را انتخاب کنید');
    }

    validateImageFile(file);

    const filename = await processAndSaveImage(file, PRODUCT_IMAGE_DIR, { width: 1920, height: 1920 });

    return { imageUrl: `/uploads/products/${filename}` };
  }
}
