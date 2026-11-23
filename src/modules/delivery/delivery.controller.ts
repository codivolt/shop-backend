import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
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
import { DeliveryService } from './delivery.service';
import {
  CreateDeliveryMethodDto,
  UpdateDeliveryMethodDto,
  DeliveryMethodResponse,
} from './dto/delivery-method.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants';

@ApiTags('روش‌های ارسال')
@ApiBearerAuth('access-token')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('active')
  @ApiOperation({ summary: 'لیست روش‌های ارسال فعال (عمومی برای Checkout)' })
  @ApiResponse({
    status: 200,
    description: 'لیست روش‌های ارسال فعال',
    type: [DeliveryMethodResponse],
  })
  async findAllActive(): Promise<DeliveryMethodResponse[]> {
    const methods = await this.deliveryService.findAllActive();
    return methods.map((m) => ({
      id: m.id,
      name: m.name,
      price: m.price,
      description: m.description,
      isActive: m.isActive,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  @Get()
  @ApiOperation({ summary: 'لیست روش‌های ارسال' })
  @ApiResponse({
    status: 200,
    description: 'لیست روش‌های ارسال',
    type: [DeliveryMethodResponse],
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.DELIVERY_VIEW)
  async findAll(): Promise<DeliveryMethodResponse[]> {
    return this.deliveryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک روش ارسال' })
  @ApiParam({ name: 'id', description: 'شناسه روش ارسال' })
  @ApiResponse({
    status: 200,
    description: 'جزئیات روش ارسال',
    type: DeliveryMethodResponse,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.DELIVERY_VIEW)
  async findOne(@Param('id') id: string): Promise<DeliveryMethodResponse> {
    return this.deliveryService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد روش ارسال جدید' })
  @ApiBody({ type: CreateDeliveryMethodDto })
  @ApiResponse({
    status: 201,
    description: 'روش ارسال ایجاد شد',
    type: DeliveryMethodResponse,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.DELIVERY_CREATE)
  async create(
    @Body() dto: CreateDeliveryMethodDto,
  ): Promise<DeliveryMethodResponse> {
    return this.deliveryService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی روش ارسال' })
  @ApiParam({ name: 'id', description: 'شناسه روش ارسال' })
  @ApiBody({ type: UpdateDeliveryMethodDto })
  @ApiResponse({
    status: 200,
    description: 'روش ارسال بروزرسانی شد',
    type: DeliveryMethodResponse,
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.DELIVERY_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryMethodDto,
  ): Promise<DeliveryMethodResponse> {
    return this.deliveryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف روش ارسال' })
  @ApiParam({ name: 'id', description: 'شناسه روش ارسال' })
  @ApiResponse({ status: 200, description: 'روش ارسال حذف شد' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.DELIVERY_DELETE)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.deliveryService.remove(id);
    return { message: 'روش ارسال با موفقیت حذف شد' };
  }
}
