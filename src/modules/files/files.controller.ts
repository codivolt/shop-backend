import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/users.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';

@Controller('files')
export class FilesController {
  constructor(
    private readonly storage: StorageService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('avatars/:filename')
  @UseGuards(JwtAuthGuard)
  async serveAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
    @CurrentUser() user: User,
  ): Promise<void> {
    this.assertSafeFilename(filename);
    const isAdmin =
      user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    if (!isAdmin && !(await this.usersService.ownsAvatar(user.id, filename))) {
      throw new ForbiddenException('دسترسی به این فایل مجاز نیست');
    }
    await this.serve('avatars', filename, res);
  }

  @Get('receipts/:filename')
  @UseGuards(JwtAuthGuard)
  async serveReceipt(
    @Param('filename') filename: string,
    @Res() res: Response,
    @CurrentUser() user: User,
  ): Promise<void> {
    this.assertSafeFilename(filename);
    const isAdmin =
      user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    if (
      !isAdmin &&
      !(await this.ordersService.ownsReceipt(user.id, filename))
    ) {
      throw new ForbiddenException('دسترسی به این فایل مجاز نیست');
    }
    await this.serve('receipts', filename, res, 'inline');
  }

  @Get('products/:filename')
  @Get('uploads/products/:filename')
  async serveProductImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.serve('products', filename, res, 'inline', true);
  }

  @Get('categories/:filename')
  @Get('uploads/categories/:filename')
  async serveCategoryImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.serve('categories', filename, res, 'inline', true);
  }

  private assertSafeFilename(filename: string): void {
    if (!/^[A-Za-z0-9._-]+$/.test(filename)) {
      throw new ForbiddenException('نام فایل نامعتبر است');
    }
  }

  private async serve(
    prefix: string,
    filename: string,
    res: Response,
    disposition = 'inline',
    cache = false,
  ): Promise<void> {
    const buffer = await this.storage.get(`${prefix}/${filename}`);

    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; img-src 'self'",
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Disposition', disposition);
    if (cache) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    res.send(buffer);
  }
}
