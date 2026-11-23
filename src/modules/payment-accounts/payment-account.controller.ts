import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PaymentAccountService } from './payment-account.service';
import {
  CreatePaymentAccountDto,
  UpdatePaymentAccountDto,
  PaymentAccountResponse,
} from './dto/payment-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';

@ApiTags('روش‌های پرداخت')
@ApiBearerAuth('access-token')
@Controller('payment-accounts')
export class PaymentAccountController {
  constructor(private readonly paymentAccountService: PaymentAccountService) {}

  @Get('active')
  @ApiOperation({ summary: 'لیست روش‌های پرداخت فعال (عمومی برای Checkout)' })
  @ApiResponse({
    status: 200,
    description: 'لیست روش‌های پرداخت فعال',
    type: [PaymentAccountResponse],
  })
  async findAllActive(): Promise<PaymentAccountResponse[]> {
    return this.paymentAccountService.findAllActive();
  }

  @Get()
  @ApiOperation({ summary: 'لیست همه روش‌های پرداخت (ادمین)' })
  @ApiResponse({
    status: 200,
    description: 'لیست همه روش‌های پرداخت',
    type: [PaymentAccountResponse],
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PAYMENTS_VIEW)
  async findAll(): Promise<PaymentAccountResponse[]> {
    const accounts = await this.paymentAccountService.findAll();
    return accounts.map((a) => PaymentAccountResponse.fromEntity(a));
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد روش پرداخت جدید (ادمین)' })
  @ApiBody({ type: CreatePaymentAccountDto })
  @ApiResponse({
    status: 201,
    description: 'روش پرداخت ایجاد شد',
    type: PaymentAccountResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PAYMENTS_CREATE)
  async create(
    @Body() dto: CreatePaymentAccountDto,
  ): Promise<PaymentAccountResponse> {
    return this.paymentAccountService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی روش پرداخت (ادمین)' })
  @ApiBody({ type: UpdatePaymentAccountDto })
  @ApiResponse({
    status: 200,
    description: 'روش پرداخت بروزرسانی شد',
    type: PaymentAccountResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PAYMENTS_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentAccountDto,
  ): Promise<PaymentAccountResponse> {
    return this.paymentAccountService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف روش پرداخت (ادمین)' })
  @ApiResponse({ status: 200, description: 'روش پرداخت حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.PAYMENTS_DELETE)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.paymentAccountService.remove(id);
    return { message: 'روش پرداخت با موفقیت حذف شد' };
  }
}
