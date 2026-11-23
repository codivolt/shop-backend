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
import { ProductAttributeValueService } from './product-attribute-value.service';
import {
  CreateProductAttributeValueDto,
  UpdateProductAttributeValueDto,
  ProductAttributeValueResponse,
} from './dto/product-attribute-value.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';

@ApiTags('مقادیر ویژگی محصول')
@ApiBearerAuth('access-token')
@ApiParam({ name: 'productId', description: 'شناسه محصول' })
@Controller('products/:productId/attribute-values')
export class ProductAttributeValueController {
  constructor(private readonly valueService: ProductAttributeValueService) {}

  @Post()
  @ApiOperation({ summary: 'افزودن مقدار ویژگی به محصول (فقط ادمین)' })
  @ApiBody({ type: CreateProductAttributeValueDto })
  @ApiResponse({
    status: 201,
    description: 'مقدار ویژگی اضافه شد',
    type: ProductAttributeValueResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductAttributeValueDto,
  ): Promise<ProductAttributeValueResponse> {
    return this.valueService.create(productId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست مقادیر ویژگی یک محصول' })
  @ApiResponse({
    status: 200,
    description: 'لیست مقادیر ویژگی',
    type: [ProductAttributeValueResponse],
  })
  async findAll(
    @Param('productId') productId: string,
  ): Promise<ProductAttributeValueResponse[]> {
    return this.valueService.findAll(productId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی مقدار ویژگی (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه مقدار ویژگی' })
  @ApiBody({ type: UpdateProductAttributeValueDto })
  @ApiResponse({
    status: 200,
    description: 'مقدار ویژگی بروزرسانی شد',
    type: ProductAttributeValueResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('productId') productId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductAttributeValueDto,
  ): Promise<ProductAttributeValueResponse> {
    return this.valueService.update(productId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف مقدار ویژگی (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه مقدار ویژگی' })
  @ApiResponse({ status: 200, description: 'مقدار ویژگی حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('productId') productId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.valueService.remove(productId, id);
  }
}
