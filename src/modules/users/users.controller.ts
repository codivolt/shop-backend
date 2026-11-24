import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { User, UserRole } from './users.entity';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants';

const AVATAR_DIR = join(process.cwd(), 'uploads', 'avatars');
mkdirSync(AVATAR_DIR, { recursive: true });

@ApiTags('کاربران')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'ثبت نام کاربر (عمومی)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'کاربر ایجاد شد', type: User })
  @ApiResponse({ status: 409, description: 'ایمیل تکراری است' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.USERS_CREATE)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.usersService.create(createUserDto, currentUser.role);
  }

  @Get('me')
  @ApiOperation({ summary: 'مشخصات کاربر فعلی' })
  @ApiResponse({ status: 200, description: 'مشخصات کاربر', type: User })
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Put('me')
  @ApiOperation({ summary: 'ویرایش پروفایل کاربر فعلی' })
  @ApiBody({ type: UpdateProfileDto })
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Put('me/password')
  @ApiOperation({ summary: 'تعیین یا تغییر رمز عبور کاربر فعلی' })
  @ApiBody({ type: ChangePasswordDto })
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(user.id, dto);
    return { message: 'رمز عبور با موفقیت به‌روزرسانی شد' };
  }

  @Post('me/referral')
  @ApiOperation({ summary: 'اعمال کد رفرال به حساب کاربر' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        referralCode: { type: 'string', example: 'REF12345' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'کد رفرال اعمال شد' })
  @ApiResponse({ status: 400, description: 'کد رفرال معتبر نیست یا قبلاً ثبت شده است' })
  @UseGuards(JwtAuthGuard)
  async applyReferral(
    @CurrentUser() user: User,
    @Body() body: { referralCode: string },
  ): Promise<{ message: string }> {
    await this.usersService.applyReferralCode(user.id, body.referralCode);
    return { message: 'کد رفرال با موفقیت اعمال شد' };
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'بارگذاری عکس پروفایل' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: AVATAR_DIR,
        filename: (_request, file, callback) => {
          callback(
            null,
            `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          );
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('فقط فایل تصویری مجاز است'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<User> {
    if (!file) {
      throw new BadRequestException('فایل تصویر را انتخاب کنید');
    }

    return this.usersService.updateProfile(user.id, {
      avatarUrl: `/uploads/avatars/${file.filename}`,
    });
  }

  @Get()
  @ApiOperation({ summary: 'لیست همه کاربران (فقط ادمین)' })
  @ApiPaginatedResponse(User)
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.USERS_VIEW)
  async findAll(
    @Query() query: UserQueryDto,
  ): Promise<PaginatedResponse<User>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات یک کاربر (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کاربر' })
  @ApiResponse({ status: 200, description: 'جزئیات کاربر', type: User })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }
    return user;
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی کاربر (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کاربر' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'کاربر بروزرسانی شد',
    type: User,
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.USERS_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto, currentUser.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف کاربر (فقط ادمین)' })
  @ApiParam({ name: 'id', description: 'شناسه کاربر' })
  @ApiResponse({ status: 200, description: 'کاربر حذف شد' })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN)
  @Permissions(PERMISSIONS.USERS_DELETE)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: 'کاربر با موفقیت حذف شد' };
  }
}
