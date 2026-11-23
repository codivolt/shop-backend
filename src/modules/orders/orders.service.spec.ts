import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { User } from '../users/users.entity';
import { Product } from '../products/product.entity';
import { CartItem } from '../cart/cart-item.entity';
import { DeliveryMethod } from '../delivery/delivery-method.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderQueryDto } from './dto/order.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import { createTestOrder, createTestOrderItem, createTestUser, createTestProduct, createTestDeliveryMethod } from '../../../test/utils/test-factories';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: jest.Mocked<Partial<Repository<Order>>>;
  let orderItemRepository: jest.Mocked<Partial<Repository<OrderItem>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let productRepository: jest.Mocked<Partial<Repository<Product>>>;
  let cartItemRepository: jest.Mocked<Partial<Repository<CartItem>>>;
  let deliveryMethodRepository: jest.Mocked<Partial<Repository<DeliveryMethod>>>;

  const mockUser = createTestUser();
  const mockProduct = createTestProduct({ inventoryQuantity: 10 });
  const mockDeliveryMethod = createTestDeliveryMethod();
  const mockOrder = createTestOrder({ userId: mockUser.id, deliveryMethodId: mockDeliveryMethod.id });
  const mockOrderItem = createTestOrderItem({ orderId: mockOrder.id, productId: mockProduct.id });

  beforeEach(async () => {
    orderRepository = createMockRepository<Order>();
    orderItemRepository = createMockRepository<OrderItem>();
    userRepository = createMockRepository<User>();
    productRepository = createMockRepository<Product>();
    cartItemRepository = createMockRepository<CartItem>();
    deliveryMethodRepository = createMockRepository<DeliveryMethod>();

    (orderRepository.createQueryBuilder as jest.Mock).mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: getRepositoryToken(Product), useValue: productRepository },
        { provide: getRepositoryToken(CartItem), useValue: cartItemRepository },
        { provide: getRepositoryToken(DeliveryMethod), useValue: deliveryMethodRepository },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateOrderDto = {
      items: [
        { productId: mockProduct.id, quantity: 2 },
      ],
      shippingAddress: {
        firstName: 'Test',
        lastName: 'User',
        phone: '09123456789',
        province: 'Tehran',
        city: 'Tehran',
        address: 'Test Address',
        postalCode: '1234567890',
      },
      billingAddress: {
        firstName: 'Test',
        lastName: 'User',
        phone: '09123456789',
        province: 'Tehran',
        city: 'Tehran',
        address: 'Test Address',
        postalCode: '1234567890',
      },
      paymentMethod: 'online',
      deliveryMethodId: mockDeliveryMethod.id,
      notes: 'Test order',
    };

    it('should create order from cart items', async () => {
      const cartItems = [
        { id: 'cart-1', userId: mockUser.id, productId: mockProduct.id, quantity: 2, product: mockProduct },
      ];
      userRepository.findOne.mockResolvedValue(mockUser);
      productRepository.findOne.mockResolvedValue(mockProduct);
      deliveryMethodRepository.findOne.mockResolvedValue(mockDeliveryMethod);
      cartItemRepository.find.mockResolvedValue(cartItems);
      orderRepository.save.mockResolvedValue(mockOrder as any);
      orderItemRepository.save.mockResolvedValue([mockOrderItem] as any);
      cartItemRepository.delete.mockResolvedValue({ affected: 1, raw: {} });
      productRepository.save.mockResolvedValue({ ...mockProduct, inventoryQuantity: 8 } as any);

      const result = await service.create(mockUser.id, createDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(productRepository.findOne).toHaveBeenCalledWith({ where: { id: mockProduct.id } });
      expect(orderRepository.save).toHaveBeenCalled();
      expect(orderItemRepository.save).toHaveBeenCalled();
      expect(cartItemRepository.delete).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.create(mockUser.id, createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if product not found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.create(mockUser.id, createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if insufficient inventory', async () => {
      const lowStockProduct = { ...mockProduct, inventoryQuantity: 1 };
      userRepository.findOne.mockResolvedValue(mockUser);
      productRepository.findOne.mockResolvedValue(lowStockProduct);

      await expect(service.create(mockUser.id, createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const query: OrderQueryDto = { page: 1, limit: 10 };

    it('should return paginated orders for user', async () => {
      const orders = [mockOrder];
      orderRepository.findAndCount.mockResolvedValue([orders, orders.length]);

      const result = await service.findAll(mockUser.id, query);

      expect(result.data).toEqual(orders);
      expect(result.total).toBe(orders.length);
    });

    it('should filter by status', async () => {
      orderRepository.findAndCount.mockResolvedValue([[mockOrder], 1]);

      await service.findAll(mockUser.id, { ...query, status: OrderStatus.PENDING });

      expect(orderRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ status: OrderStatus.PENDING, userId: mockUser.id }),
      }));
    });
  });

  describe('findOne', () => {
    it('should return order by id with items', async () => {
      const orderWithItems = { ...mockOrder, items: [mockOrderItem] };
      orderRepository.findOne.mockResolvedValue(orderWithItems);

      const result = await service.findOne(mockOrder.id, mockUser.id);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockOrder.id, userId: mockUser.id },
        relations: ['items', 'items.product', 'deliveryMethod', 'user'],
      });
      expect(result).toEqual(orderWithItems);
    });

    it('should throw NotFoundException if not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', mockUser.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllAdmin', () => {
    const query: OrderQueryDto = { page: 1, limit: 10 };

    it('should return all orders for admin', async () => {
      const orders = [mockOrder];
      orderRepository.findAndCount.mockResolvedValue([orders, orders.length]);

      const result = await service.findAllAdmin(query);

      expect(result.data).toEqual(orders);
    });

    it('should filter by userId', async () => {
      orderRepository.findAndCount.mockResolvedValue([[mockOrder], 1]);

      await service.findAllAdmin({ ...query, userId: mockUser.id });

      expect(orderRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ userId: mockUser.id }),
      }));
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto: UpdateOrderStatusDto = {
      status: OrderStatus.CONFIRMED,
    };

    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: OrderStatus.CONFIRMED };
      orderRepository.findOne.mockResolvedValue(mockOrder);
      orderRepository.save.mockResolvedValue(updatedOrder as any);

      const result = await service.updateStatus(mockOrder.id, updateStatusDto);

      expect(orderRepository.findOne).toHaveBeenCalledWith({ where: { id: mockOrder.id } });
      expect(orderRepository.merge).toHaveBeenCalled();
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus('nonexistent', updateStatusDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel pending order', async () => {
      const pendingOrder = { ...mockOrder, status: OrderStatus.PENDING };
      orderRepository.findOne.mockResolvedValue(pendingOrder);
      orderRepository.save.mockResolvedValue({ ...pendingOrder, status: OrderStatus.CANCELLED } as any);
      orderItemRepository.find.mockResolvedValue([mockOrderItem]);
      productRepository.save.mockResolvedValue({ ...mockProduct, inventoryQuantity: 12 } as any);

      const result = await service.cancel(mockOrder.id, mockUser.id);

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(productRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order not cancellable', async () => {
      const deliveredOrder = { ...mockOrder, status: OrderStatus.DELIVERED };
      orderRepository.findOne.mockResolvedValue(deliveredOrder);

      await expect(service.cancel(mockOrder.id, mockUser.id)).rejects.toThrow(BadRequestException);
    });
  });
});