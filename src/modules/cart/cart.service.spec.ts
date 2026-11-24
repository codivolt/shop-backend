import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartService } from './cart.service';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../users/users.entity';
import { AddToCartDto, UpdateCartDto } from './dto/cart.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import {
  createTestCartItem,
  createTestUser,
  createTestProduct,
} from '../../../test/utils/test-factories';

describe('CartService', () => {
  let service: CartService;
  let cartItemRepository: jest.Mocked<Partial<Repository<CartItem>>>;
  let productRepository: jest.Mocked<Partial<Repository<Product>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  const mockUser = createTestUser();
  const mockProduct = createTestProduct({ inventoryQuantity: 10 });
  const mockCartItem = createTestCartItem({
    userId: mockUser.id,
    productId: mockProduct.id,
    quantity: 2,
  });

  beforeEach(async () => {
    cartItemRepository = createMockRepository<CartItem>();
    productRepository = createMockRepository<Product>();
    userRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(CartItem), useValue: cartItemRepository },
        { provide: getRepositoryToken(Product), useValue: productRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return user cart with products', async () => {
      const cartItems = [mockCartItem];
      cartItemRepository.find.mockResolvedValue(cartItems);

      const result = await service.getCart(mockUser.id);

      expect(cartItemRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        relations: ['product'],
      });
      expect(result).toEqual(cartItems);
    });
  });

  describe('addToCart', () => {
    const addToCartDto: AddToCartDto = {
      productId: mockProduct.id,
      quantity: 1,
    };

    it('should add new item to cart', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      cartItemRepository.findOne.mockResolvedValue(null);
      cartItemRepository.save.mockResolvedValue({
        ...mockCartItem,
        quantity: 1,
      } as any);

      const result = await service.addToCart(mockUser.id, addToCartDto);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: addToCartDto.productId },
      });
      expect(cartItemRepository.save).toHaveBeenCalled();
      expect(result.quantity).toBe(1);
    });

    it('should update quantity if item already in cart', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      cartItemRepository.findOne.mockResolvedValue(mockCartItem);
      cartItemRepository.save.mockResolvedValue({
        ...mockCartItem,
        quantity: 3,
      } as any);

      const result = await service.addToCart(mockUser.id, {
        ...addToCartDto,
        quantity: 1,
      });

      expect(cartItemRepository.findOne).toHaveBeenCalledWith({
        where: { userId: mockUser.id, productId: addToCartDto.productId },
      });
      expect(result.quantity).toBe(3);
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addToCart(mockUser.id, addToCartDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if product inactive', async () => {
      const inactiveProduct = { ...mockProduct, isActive: false };
      productRepository.findOne.mockResolvedValue(inactiveProduct);

      await expect(
        service.addToCart(mockUser.id, addToCartDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if insufficient inventory', async () => {
      productRepository.findOne.mockResolvedValue({
        ...mockProduct,
        inventoryQuantity: 1,
      });
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addToCart(mockUser.id, { ...addToCartDto, quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateQuantity', () => {
    const updateCartDto: UpdateCartDto = {
      quantity: 5,
    };

    it('should update cart item quantity', async () => {
      cartItemRepository.findOne.mockResolvedValue(mockCartItem);
      productRepository.findOne.mockResolvedValue(mockProduct);
      cartItemRepository.save.mockResolvedValue({
        ...mockCartItem,
        quantity: 5,
      } as any);

      const result = await service.updateQuantity(
        mockUser.id,
        mockCartItem.id,
        updateCartDto,
      );

      expect(cartItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCartItem.id, userId: mockUser.id },
      });
      expect(result.quantity).toBe(5);
    });

    it('should throw NotFoundException if cart item not found', async () => {
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateQuantity(mockUser.id, 'nonexistent', updateCartDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if insufficient inventory', async () => {
      cartItemRepository.findOne.mockResolvedValue(mockCartItem);
      productRepository.findOne.mockResolvedValue({
        ...mockProduct,
        inventoryQuantity: 3,
      });

      await expect(
        service.updateQuantity(mockUser.id, mockCartItem.id, { quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      cartItemRepository.findOne.mockResolvedValue(mockCartItem);
      cartItemRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.removeFromCart(mockUser.id, mockCartItem.id);

      expect(cartItemRepository.delete).toHaveBeenCalledWith({
        id: mockCartItem.id,
        userId: mockUser.id,
      });
    });

    it('should throw NotFoundException if cart item not found', async () => {
      cartItemRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeFromCart(mockUser.id, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('should clear all cart items', async () => {
      cartItemRepository.delete.mockResolvedValue({ affected: 3, raw: {} });

      await service.clearCart(mockUser.id);

      expect(cartItemRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
    });
  });

  describe('getCartCount', () => {
    it('should return total item count in cart', async () => {
      cartItemRepository.count.mockResolvedValue(5);

      const result = await service.getCartCount(mockUser.id);

      expect(cartItemRepository.count).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(result).toBe(5);
    });
  });
});
