import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';
import {
  AssignPermissionsDto,
  CreatePermissionDto,
  PermissionResponse,
  UpdatePermissionDto,
} from './dto/permission.dto';
import { Permission } from './permission.entity';
import { PermissionsService } from './permissions.service';

@ApiTags('دسترسی‌ها')
@ApiBearerAuth('access-token')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'لیست ویژگی‌های مجاز' })
  @ApiResponse({ status: 200, type: [Permission] })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(): Promise<Permission[]> {
    return this.permissionsService.findAll();
  }

  @Get('roles')
  @ApiOperation({ summary: 'دسترسی‌های هر نقش' })
  @ApiResponse({
    status: 200,
    description: 'نگاشت نقش به کلیدهای مجاز',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getRolePermissions(): Promise<Record<string, string[]>> {
    return this.permissionsService.getRolePermissions();
  }

  @Put('roles/:role')
  @ApiOperation({ summary: 'تعیین دسترسی‌های یک نقش (فقط مدیر ارشد)' })
  @ApiParam({ name: 'role', enum: UserRole, description: 'نقش' })
  @ApiBody({ type: AssignPermissionsDto })
  @ApiResponse({ status: 200, description: 'دسترسی‌ها به‌روزرسانی شد' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async setRolePermissions(
    @Param('role') role: string,
    @Body() dto: AssignPermissionsDto,
  ): Promise<Record<string, string[]>> {
    return this.permissionsService.setRolePermissions(role, dto);
  }

  @Post()
  @ApiOperation({ summary: 'ایجاد ویژگی مجاز (فقط مدیر ارشد)' })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({
    status: 201,
    description: 'ویژگی مجاز ایجاد شد',
    type: PermissionResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async create(@Body() dto: CreatePermissionDto): Promise<Permission> {
    return this.permissionsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'ویرایش ویژگی مجاز (فقط مدیر ارشد)' })
  @ApiParam({ name: 'id', description: 'شناسه مجاز' })
  @ApiBody({ type: UpdatePermissionDto })
  @ApiResponse({
    status: 200,
    description: 'ویژگی مجاز به‌روزرسانی شد',
    type: PermissionResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف ویژگی مجاز (فقط مدیر ارشد)' })
  @ApiParam({ name: 'id', description: 'شناسه مجاز' })
  @ApiResponse({ status: 200, description: 'ویژگی مجاز حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.permissionsService.remove(id);
    return { message: 'مجاز با موفقیت حذف شد' };
  }
}
