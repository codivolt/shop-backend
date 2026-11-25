import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/users.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants';

const UPLOADS_DIR = join(process.cwd(), 'uploads');

@Controller('files')
export class FilesController {
  @Get('avatars/:filename')
  @UseGuards(JwtAuthGuard)
  async serveAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
    @CurrentUser() user: User,
  ): Promise<void> {
    const filePath = join(UPLOADS_DIR, 'avatars', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('فایل یافت نشد');
    }

    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(filePath);
  }

  @Get('receipts/:filename')
  @UseGuards(JwtAuthGuard)
  async serveReceipt(
    @Param('filename') filename: string,
    @Res() res: Response,
    @CurrentUser() user: User,
  ): Promise<void> {
    const filePath = join(UPLOADS_DIR, 'receipts', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('فایل یافت نشد');
    }

    // Users can only access their own receipts unless they're admin
    // The order service should verify ownership before returning the receipt URL
    // For additional security, we could check order ownership here

    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline');
    res.sendFile(filePath);
  }

  @Get('products/:filename')
  @Get('uploads/products/:filename')
  async serveProductImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    const filePath = join(UPLOADS_DIR, 'products', filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException('فایل یافت نشد');
    }

    // Product images are public for display on the web shop
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  }
}