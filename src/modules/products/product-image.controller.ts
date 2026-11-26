import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProductImageService } from './product-image.service';
import {
  CreateProductImageDto,
  UpdateProductImageDto,
  ProductImageResponse,
} from './dto/product-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../users/users.entity';
import { PERMISSIONS } from '../auth/constants';
import { StorageService } from '../storage/storage.service';
import {
  processAndSaveImage,
  MAX_FILE_SIZE,
} from '../../common/utils/secure-upload.util';

@ApiTags('تصاویر محصول')
@ApiBearerAuth('access-token')
@ApiParam({ name: 'productId', description: 'شناسه محصول' })
@Controller('products/:productId/images')
export class ProductImageController {
  constructor(
    private readonly imageService: ProductImageService,
    private readonly storage: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'افزودن تصویر به محصول (فقط ادمین)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        isPrimary: { type: 'boolean' },
        sortOrder: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'تصویر اضافه شد',
    type: ProductImageResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async create(
    @Param('productId') productId: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body() dto?: CreateProductImageDto,
  ): Promise<ProductImageResponse> {
    let imageUrl = dto?.imageUrl;
    if (file) {
      const filename = await processAndSaveImage(
        file,
        'products',
        this.storage,
        { width: 1920, height: 1920 },
      );
      imageUrl = `/files/products/${filename}`;
    }
    if (!imageUrl) {
      throw new BadRequestException('فایل تصویر را انتخاب کنید');
    }
    return this.imageService.create(productId, {
      imageUrl,
      isPrimary: dto?.isPrimary,
      sortOrder: dto?.sortOrder,
    });
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
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
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_DELETE)
  async remove(
    @Param('productId') productId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.imageService.remove(productId, id);
  }
}
