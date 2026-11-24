import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartItem } from './cart-item.entity';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';
import {
  createTestCartItem,
  createTestUser,
  createTestProduct,
} from '../../../test/utils/test-factories';

describe('CartController', () => {
  let controller: CartController;
  let cartService: jest.Mocked<Partial<CartService>>;

  const mockUser = createTestUser();
  const mockProduct = createTestProduct();
  const mockCartItem = createTestCartItem({
    userId: mockUser.id,
    productId: mockProduct.id,
    quantity: 2,
  });

  beforeEach(async () => {
    cartService = {
      getCart: jest.fn(),
      addToCart: jest.fn(),
      updateQuantity: jest.fn(),
      removeFromCart: jest.fn(),
      clearCart: jest.fn(),
      getCartCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: cartService }],
    }).compile();

    controller = module.get<CartController>(CartController);
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return user cart', async () => {
      const cartItems = [mockCartItem];
      cartService.getCart.mockResolvedValue(cartItems);

      const result = await controller.getCart(mockUser);

      expect(cartService.getCart).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(cartItems);
    });
  });

  describe('addToCart', () => {
    const addToCartDto: AddToCartDto = {
      productId: mockProduct.id,
      quantity: 1,
    };

    it('should add item to cart', async () => {
      const newCartItem = createTestCartItem({
        userId: mockUser.id,
        productId: mockProduct.id,
        quantity: 1,
      });
      cartService.addToCart.mockResolvedValue(newCartItem);

      const result = await controller.addToCart(addToCartDto, mockUser);

      expect(cartService.addToCart).toHaveBeenCalledWith(
        mockUser.id,
        addToCartDto,
      );
      expect(result).toEqual(newCartItem);
    });

    it('should throw NotFoundException if product not found', async () => {
      cartService.addToCart.mockRejectedValue(
        new NotFoundException('محصول یافت نشد'),
      );

      await expect(
        controller.addToCart(addToCartDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateQuantity', () => {
    const updateCartDto: UpdateCartDto = {
      quantity: 5,
    };

    it('should update cart item quantity', async () => {
      const updatedCartItem = { ...mockCartItem, quantity: 5 };
      cartService.updateQuantity.mockResolvedValue(updatedCartItem);

      const result = await controller.updateQuantity(
        mockCartItem.id,
        updateCartDto,
        mockUser,
      );

      expect(cartService.updateQuantity).toHaveBeenCalledWith(
        mockUser.id,
        mockCartItem.id,
        updateCartDto,
      );
      expect(result).toEqual(updatedCartItem);
    });

    it('should throw NotFoundException if cart item not found', async () => {
      cartService.updateQuantity.mockRejectedValue(
        new NotFoundException('آیتم سبد خرید یافت نشد'),
      );

      await expect(
        controller.updateQuantity('nonexistent', updateCartDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      cartService.removeFromCart.mockResolvedValue(undefined);

      const result = await controller.removeFromCart(mockCartItem.id, mockUser);

      expect(cartService.removeFromCart).toHaveBeenCalledWith(
        mockUser.id,
        mockCartItem.id,
      );
      expect(result).toEqual({ message: 'آیتم از سبد خرید حذف شد' });
    });
  });

  describe('clearCart', () => {
    it('should clear cart', async () => {
      cartService.clearCart.mockResolvedValue(undefined);

      const result = await controller.clearCart(mockUser);

      expect(cartService.clearCart).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: 'سبد خرید خالی شد' });
    });
  });

  describe('getCartCount', () => {
    it('should return cart item count', async () => {
      cartService.getCartCount.mockResolvedValue(5);

      const result = await controller.getCartCount(mockUser);

      expect(cartService.getCartCount).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ count: 5 });
    });
  });
});
