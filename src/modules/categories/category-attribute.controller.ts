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
import { CategoryAttributeService } from './category-attribute.service';
import {
  CreateCategoryAttributeDto,
  UpdateCategoryAttributeDto,
  CategoryAttributeResponse,
} from './dto/category-attribute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { UserRole } from '../users/users.entity';
import { PERMISSIONS } from '../auth/constants';

@ApiTags('ویژگی‌های دسته‌بندی')
@ApiBearerAuth('access-token')
@ApiParam({ name: 'categoryId', description: 'شناسه دسته‌بندی' })
@Controller('categories/:categoryId/attributes')
export class CategoryAttributeController {
  constructor(private readonly attributeService: CategoryAttributeService) {}

  @Post()
  @ApiOperation({ summary: 'افزودن ویژگی به دسته‌بندی (فقط ادمین)' })
  @ApiBody({ type: CreateCategoryAttributeDto })
  @ApiResponse({
    status: 201,
    description: 'ویژگی ایجاد شد',
    type: CategoryAttributeResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.CATEGORIES_ATTRIBUTES_CREATE)
  async create(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateCategoryAttributeDto,
  ): Promise<CategoryAttributeResponse> {
    return this.attributeService.create(categoryId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست ویژگی‌های یک دسته‌بندی' })
  @ApiResponse({
    status: 200,
    description: 'لیست ویژگی‌ها',
    type: [CategoryAttributeResponse],
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(
    PERMISSIONS.CATEGORIES_ATTRIBUTES_VIEW,
    PERMISSIONS.CATEGORIES_ATTRIBUTES_CREATE,
    PERMISSIONS.CATEGORIES_ATTRIBUTES_UPDATE,
    PERMISSIONS.CATEGORIES_ATTRIBUTES_DELETE,
  )
  async findAll(
    @Param('categoryId') categoryId: string,
  ): Promise<CategoryAttributeResponse[]> {
    return this.attributeService.findAll(categoryId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی ویژگی (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه ویژگی' })
  @ApiBody({ type: UpdateCategoryAttributeDto })
  @ApiResponse({
    status: 200,
    description: 'ویژگی بروزرسانی شد',
    type: CategoryAttributeResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.CATEGORIES_ATTRIBUTES_UPDATE)
  async update(
    @Param('categoryId') categoryId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryAttributeDto,
  ): Promise<CategoryAttributeResponse> {
    return this.attributeService.update(categoryId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف ویژگی (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه ویژگی' })
  @ApiResponse({ status: 200, description: 'ویژگی حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.CATEGORIES_ATTRIBUTES_DELETE)
  async remove(
    @Param('categoryId') categoryId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.attributeService.remove(categoryId, id);
  }
}
