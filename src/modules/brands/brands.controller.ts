import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
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
import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { BrandQueryDto } from './dto/brand-query.dto';
import { Brand } from './brand.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../users/users.entity';
import { PERMISSIONS } from '../auth/constants';

@ApiTags('برندها')
@ApiBearerAuth('access-token')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد برند جدید (فقط ادمین)' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({ status: 201, description: 'برند ایجاد شد', type: Brand })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.BRANDS_CREATE)
  async create(@Body() createBrandDto: CreateBrandDto): Promise<Brand> {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست برندها' })
  @ApiPaginatedResponse(Brand)
  async findAll(
    @Query() query: BrandQueryDto,
  ): Promise<PaginatedResponse<Brand>> {
    return this.brandsService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'جزئیات برند با نامک' })
  @ApiParam({ name: 'slug', description: 'نامک برند' })
  @ApiResponse({ status: 200, description: 'جزئیات برند', type: Brand })
  async findBySlug(@Param('slug') slug: string): Promise<Brand> {
    return this.brandsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک برند' })
  @ApiParam({ name: 'id', description: 'شناسه برند' })
  @ApiResponse({ status: 200, description: 'جزئیات برند', type: Brand })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.BRANDS_VIEW)
  async findOne(@Param('id') id: string): Promise<Brand> {
    return this.brandsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی برند (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه برند' })
  @ApiBody({ type: UpdateBrandDto })
  @ApiResponse({ status: 200, description: 'برند بروزرسانی شد', type: Brand })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.BRANDS_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
  ): Promise<Brand> {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف برند (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه برند' })
  @ApiResponse({ status: 200, description: 'برند حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    return this.brandsService.remove(id);
  }
}
