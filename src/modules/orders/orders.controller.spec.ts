import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderQueryDto } from './dto/order.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createTestOrder, createTestUser, createTestProduct, createTestDeliveryMethod } from '../../../test/utils/test-factories';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<Partial<OrdersService>>;

  const mockUser = createTestUser();
  const mockProduct = createTestProduct();
  const mockDeliveryMethod = createTestDeliveryMethod();
  const mockOrder = createTestOrder({ userId: mockUser.id, deliveryMethodId: mockDeliveryMethod.id });
  const mockPaginatedResponse: PaginatedResponse<Order> = {
    data: [mockOrder],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  beforeEach(async () => {
    ordersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findAllAdmin: jest.fn(),
      updateStatus: jest.fn(),
      cancel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateOrderDto = {
      items: [{ productId: mockProduct.id, quantity: 1 }],
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
    };

    it('should create order from cart', async () => {
      ordersService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(createDto, mockUser);

      expect(ordersService.create).toHaveBeenCalledWith(mockUser.id, createDto);
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if user not found', async () => {
      ordersService.create.mockRejectedValue(new NotFoundException('کاربر یافت نشد'));

      await expect(controller.create(createDto, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const query: OrderQueryDto = { page: 1, limit: 10 };

    it('should return user orders', async () => {
      ordersService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query, mockUser);

      expect(ordersService.findAll).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return order by id', async () => {
      ordersService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne(mockOrder.id, mockUser);

      expect(ordersService.findOne).toHaveBeenCalledWith(mockOrder.id, mockUser.id);
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if not found', async () => {
      ordersService.findOne.mockRejectedValue(new NotFoundException('سفارش یافت نشد'));

      await expect(controller.findOne('nonexistent', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllAdmin', () => {
    const query: OrderQueryDto = { page: 1, limit: 10 };

    it('should return all orders for admin', async () => {
      ordersService.findAllAdmin.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAllAdmin(query);

      expect(ordersService.findAllAdmin).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto: UpdateOrderStatusDto = {
      status: OrderStatus.CONFIRMED,
    };

    it('should update order status', async () => {
      const updatedOrder = { ...mockOrder, status: OrderStatus.CONFIRMED };
      ordersService.updateStatus.mockResolvedValue(updatedOrder);

      const result = await controller.updateStatus(mockOrder.id, updateStatusDto);

      expect(ordersService.updateStatus).toHaveBeenCalledWith(mockOrder.id, updateStatusDto);
      expect(result).toEqual(updatedOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      ordersService.updateStatus.mockRejectedValue(new NotFoundException('سفارش یافت نشد'));

      await expect(controller.updateStatus('nonexistent', updateStatusDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel order', async () => {
      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
      ordersService.cancel.mockResolvedValue(cancelledOrder);

      const result = await controller.cancel(mockOrder.id, mockUser);

      expect(ordersService.cancel).toHaveBeenCalledWith(mockOrder.id, mockUser.id);
      expect(result).toEqual(cancelledOrder);
    });

    it('should throw BadRequestException if order not cancellable', async () => {
      ordersService.cancel.mockRejectedValue(new BadRequestException('سفارش قابل لغو نیست'));

      await expect(controller.cancel('nonexistent', mockUser)).rejects.toThrow(BadRequestException);
    });
  });
});