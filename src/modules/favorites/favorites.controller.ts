import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { Product } from '../products/product.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/users.entity';

@ApiTags('علاقه‌مندی‌ها')
@ApiBearerAuth('access-token')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'لیست علاقه‌مندی‌های کاربر' })
  @ApiResponse({ status: 200, type: [Product] })
  async list(@CurrentUser() user: User): Promise<Product[]> {
    return this.favoritesService.list(user.id);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'افزودن محصول به علاقه‌مندی‌ها' })
  @ApiParam({ name: 'productId' })
  @ApiResponse({ status: 201, type: Product })
  async add(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ): Promise<Product> {
    return this.favoritesService.add(user.id, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'حذف محصول از علاقه‌مندی‌ها' })
  @ApiParam({ name: 'productId' })
  @ApiResponse({ status: 200, description: 'حذف شد' })
  async remove(
    @CurrentUser() user: User,
    @Param('productId') productId: string,
  ): Promise<{ message: string }> {
    await this.favoritesService.remove(user.id, productId);
    return { message: 'از علاقه‌مندی‌ها حذف شد' };
  }
}
