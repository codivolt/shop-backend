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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { Address } from './address.entity';
import { User } from '../users/users.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('آدرس‌ها')
@ApiBearerAuth('access-token')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'افزودن آدرس جدید' })
  @ApiBody({ type: CreateAddressDto })
  @ApiResponse({ status: 201, description: 'آدرس ایجاد شد', type: Address })
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: User,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    return this.addressesService.create(user.id, createAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست آدرس‌های کاربر فعلی' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'لیست آدرس‌ها' })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.addressesService.findAllByUser(user.id, paginationDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'به‌روزرسانی آدرس' })
  @ApiParam({ name: 'id', description: 'شناسه آدرس' })
  @ApiBody({ type: UpdateAddressDto })
  @ApiResponse({
    status: 200,
    description: 'آدرس به‌روزرسانی شد',
    type: Address,
  })
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    return this.addressesService.update(id, user.id, updateAddressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف آدرس' })
  @ApiParam({ name: 'id', description: 'شناسه آدرس' })
  @ApiResponse({ status: 200, description: 'آدرس حذف شد' })
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.addressesService.remove(id, user.id);
    return { message: 'آدرس با موفقیت حذف شد' };
  }

  @Put(':id/default')
  @ApiOperation({ summary: 'تنظیم آدرس به عنوان پیش‌فرض' })
  @ApiParam({ name: 'id', description: 'شناسه آدرس' })
  @ApiResponse({
    status: 200,
    description: 'آدرس پیش‌فرض تنظیم شد',
    type: Address,
  })
  @UseGuards(JwtAuthGuard)
  async setDefault(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<Address> {
    return this.addressesService.setDefault(id, user.id);
  }
}
