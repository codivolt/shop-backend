import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DiscountService } from './discount.service';
import { CreateDiscountCodeDto, UpdateDiscountCodeDto, ValidateDiscountCodeDto, DiscountCodeQueryDto } from './dto/discount-code.dto';
import { DiscountCode, DiscountStatus } from './discount-code.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants';
import { User, UserRole } from '../users/users.entity';

@ApiTags('کدهای تخفیف')
@ApiBearerAuth('access-token')
@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد کد تخفیف (فقط ادمین)' })
  @ApiBody({ type: CreateDiscountCodeDto })
  @ApiResponse({ status: 201, description: 'کد تخفیف ایجاد شد', type: DiscountCode })
  @ApiResponse({ status: 409, description: 'کد تخفیف تکراری است' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_CREATE)
  async create(
    @Body() dto: CreateDiscountCodeDto,
  ): Promise<DiscountCode> {
    return this.discountService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست کدهای تخفیف (فقط ادمین)' })
  @ApiPaginatedResponse(DiscountCode)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_VIEW)
  async findAll(
    @Query() query: DiscountCodeQueryDto,
  ): Promise<PaginatedResponse<DiscountCode>> {
    return this.discountService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'آمار کدهای تخفیف (فقط ادمین)' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_VIEW)
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    expired: number;
    usedUp: number;
  }> {
    const [total, active, inactive, expired, usedUp] = await Promise.all([
      this.discountService['discountRepository'].count(),
      this.discountService['discountRepository'].count({ where: { status: DiscountStatus.ACTIVE } }),
      this.discountService['discountRepository'].count({ where: { status: DiscountStatus.INACTIVE } }),
      this.discountService['discountRepository'].count({ where: { status: DiscountStatus.EXPIRED } }),
      this.discountService['discountRepository'].count({ where: { status: DiscountStatus.USED_UP } }),
    ]);

    return { total, active, inactive, expired, usedUp };
  }

  @Post('validate')
  @ApiOperation({ summary: 'اعتبارسنجی کد تخفیف (برای چک‌اوت)' })
  @ApiBody({ type: ValidateDiscountCodeDto })
  @ApiResponse({ status: 200, description: 'نتیجه اعتبارسنجی' })
  @UseGuards(JwtAuthGuard)
  async validate(
    @CurrentUser() user: User,
    @Body() dto: ValidateDiscountCodeDto,
  ): Promise<{ valid: boolean; discount?: DiscountCode; discountAmount: number; message?: string }> {
    return this.discountService.validate({
      ...dto,
      userId: user.id,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات کد تخفیف (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کد تخفیف' })
  @ApiResponse({ status: 200, description: 'جزئیات کد تخفیف', type: DiscountCode })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_VIEW)
  async findOne(@Param('id') id: string): Promise<DiscountCode> {
    return this.discountService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی کد تخفیف (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کد تخفیف' })
  @ApiBody({ type: UpdateDiscountCodeDto })
  @ApiResponse({ status: 200, description: 'کد تخفیف بروزرسانی شد', type: DiscountCode })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountCodeDto,
  ): Promise<DiscountCode> {
    return this.discountService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف کد تخفیف (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کد تخفیف' })
  @ApiResponse({ status: 200, description: 'کد تخفیف حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PRODUCTS_DELETE)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.discountService.delete(id);
    return { message: 'کد تخفیف با موفقیت حذف شد' };
  }
}