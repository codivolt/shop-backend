import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CartItemResponse } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/users.entity';

@ApiTags('سبد خرید')
@ApiBearerAuth('access-token')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'مشاهده سبد خرید کاربر' })
  @ApiResponse({
    status: 200,
    description: 'محصولات سبد خرید',
    type: [CartItemResponse],
  })
  async getCart(@CurrentUser() user: User): Promise<CartItemResponse[]> {
    return this.cartService.getCart(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'افزودن محصول به سبد خرید' })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({
    status: 201,
    description: 'افزوده شد',
    type: CartItemResponse,
  })
  async addToCart(
    @CurrentUser() user: User,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartItemResponse> {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'بروزرسانی تعداد آیتم سبد خرید' })
  @ApiBody({ type: UpdateCartItemDto })
  @ApiResponse({
    status: 200,
    description: 'بروزرسانی شد',
    type: CartItemResponse,
  })
  async updateCartItem(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItemResponse> {
    return this.cartService.updateCartItem(user.id, id, updateCartItemDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف آیتم از سبد خرید' })
  @ApiResponse({ status: 200, description: 'حذف شد' })
  async removeFromCart(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<void> {
    return this.cartService.removeFromCart(user.id, id);
  }

  @Delete()
  @ApiOperation({ summary: 'خالی کردن کل سبد خرید' })
  @ApiResponse({ status: 200, description: 'سبد خالی شد' })
  async clearCart(@CurrentUser() user: User): Promise<void> {
    return this.cartService.clearCart(user.id);
  }
}
