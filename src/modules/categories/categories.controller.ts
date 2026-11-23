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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { Category } from './category.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../users/users.entity';
import { PERMISSIONS } from '../auth/constants';

@ApiTags('دسته‌بندی‌ها')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد دسته‌بندی جدید (فقط ادمین)' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'دسته‌بندی ایجاد شد',
    type: Category,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.CATEGORIES_CREATE)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست دسته‌بندی‌ها' })
  @ApiPaginatedResponse(Category)
  async findAll(
    @Query() query: CategoryQueryDto,
  ): Promise<PaginatedResponse<Category>> {
    return this.categoriesService.findAll(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'جزئیات دسته‌بندی با نامک' })
  @ApiParam({ name: 'slug', description: 'نامک دسته‌بندی' })
  @ApiResponse({ status: 200, description: 'جزئیات دسته‌بندی', type: Category })
  async findBySlug(@Param('slug') slug: string): Promise<Category> {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک دسته‌بندی' })
  @ApiParam({ name: 'id', description: 'شناسه دسته‌بندی' })
  @ApiResponse({ status: 200, description: 'جزئیات دسته‌بندی', type: Category })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PERMISSIONS.CATEGORIES_VIEW)
  async findOne(@Param('id') id: string): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی دسته‌بندی (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه دسته‌بندی' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({
    status: 200,
    description: 'دسته‌بندی بروزرسانی شد',
    type: Category,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.CATEGORIES_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف دسته‌بندی (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه دسته‌بندی' })
  @ApiResponse({ status: 200, description: 'دسته‌بندی حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.CATEGORIES_DELETE)
  async remove(@Param('id') id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
