import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRole, User } from '../users/users.entity';
import { PERMISSIONS } from '../auth/constants';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  CourierDeliverDto,
} from './dto/order.dto';
import { Order } from './order.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { validateImageFile, processAndSaveImage, ALLOWED_IMAGE_EXTENSIONS, MAX_FILE_SIZE } from '../../common/utils/secure-upload.util';

const RECEIPT_DIR = join(process.cwd(), 'uploads', 'receipts');
mkdirSync(RECEIPT_DIR, { recursive: true });

@ApiTags('سفارش‌ها')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد سفارش جدید' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'سفارش ایجاد شد', type: Order })
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: User,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست سفارش‌های کاربر فعلی' })
  @ApiPaginatedResponse(Order)
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser() user: User,
    @Query() query: OrderQueryDto,
  ): Promise<PaginatedResponse<Order>> {
    return this.ordersService.findAllByUser(user.id, query);
  }

  @Get('admin')
  @ApiOperation({ summary: 'لیست همه سفارش‌ها (فقط ادمین)' })
  @ApiPaginatedResponse(Order)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.ORDERS_VIEW)
  async findAllAdmin(
    @Query() query: OrderQueryDto,
  ): Promise<PaginatedResponse<Order>> {
    return this.ordersService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک سفارش' })
  @ApiParam({ name: 'id', description: 'شناسه سفارش' })
  @ApiResponse({ status: 200, description: 'جزئیات سفارش', type: Order })
  @UseGuards(JwtAuthGuard)
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<Order> {
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    const order =
      isAdmin
        ? await this.ordersService.findById(id)
        : await this.ordersService.findByIdAndUser(id, user.id);

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    return order;
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'تغییر وضعیت سفارش (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه سفارش' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({ status: 200, description: 'وضعیت تغییر یافت', type: Order })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @Put(':id/payment')
  @ApiOperation({ summary: 'تغییر وضعیت پرداخت (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه سفارش' })
  @ApiBody({ type: UpdatePaymentStatusDto })
  @ApiResponse({
    status: 200,
    description: 'وضعیت پرداخت تغییر یافت',
    type: Order,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.ORDERS_UPDATE)
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<Order> {
    return this.ordersService.updatePaymentStatus(id, updatePaymentStatusDto);
  }

  @Post(':id/receipt')
  @ApiOperation({ summary: 'بارگذاری فیش پرداخت برای سفارش' })
  @ApiParam({ name: 'id', description: 'شناسه سفارش' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'فیش بارگذاری شد', type: Order })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async uploadReceipt(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Order> {
    if (!file) {
      throw new BadRequestException('فایل فیش را انتخاب کنید');
    }

    validateImageFile(file);

    const filename = await processAndSaveImage(file, RECEIPT_DIR, { width: 1920, height: 1920 });

    const order =
      user.role === UserRole.ADMIN
        ? await this.ordersService.findById(id)
        : await this.ordersService.findByIdAndUser(id, user.id);

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    return this.ordersService.updateReceipt(id, `/files/receipts/${filename}`);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف سفارش (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه سفارش' })
  @ApiResponse({ status: 200, description: 'سفارش حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.ORDERS_DELETE)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.ordersService.remove(id);
    return { message: 'سفارش با موفقیت حذف شد' };
  }

  @Put('courier/deliver')
  @ApiOperation({ summary: 'تغییر وضعیت به تحویل داده شده توسط کوریری' })
  @ApiBody({ type: CourierDeliverDto })
  @ApiResponse({
    status: 200,
    description: 'سفارش به عنوان تحویل داده شده علامت‌گذاری شد',
    type: Order,
  })
  @ApiResponse({ status: 404, description: 'سفارش یافت نشد' })
  @ApiResponse({
    status: 400,
    description: 'سفارش قبلاً تحویل داده شده یا لغو شده است',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  async courierDeliver(
    @Body() courierDeliverDto: CourierDeliverDto,
  ): Promise<Order> {
    return this.ordersService.markAsDeliveredByCourier(courierDeliverDto);
  }
}
