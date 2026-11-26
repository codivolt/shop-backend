import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/users.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';

@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Get('avatars/:filename')
  @UseGuards(JwtAuthGuard)
  async serveAvatar(
    @Param('filename') filename: string,
    @Res() res: Response,
    @CurrentUser() _user: User,
  ): Promise<void> {
    await this.serve('avatars', filename, res);
  }

  @Get('receipts/:filename')
  @UseGuards(JwtAuthGuard)
  async serveReceipt(
    @Param('filename') filename: string,
    @Res() res: Response,
    @CurrentUser() _user: User,
  ): Promise<void> {
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

  private async serve(
    prefix: string,
    filename: string,
    res: Response,
    disposition = 'inline',
    cache = false,
  ): Promise<void> {
    const buffer = await this.storage.get(`${prefix}/${filename}`);

    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Disposition', disposition);
    if (cache) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    res.send(buffer);
  }
}