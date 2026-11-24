import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { DeliveryMethod } from './delivery-method.entity';
import {
  CreateDeliveryMethodDto,
  UpdateDeliveryMethodDto,
} from './dto/delivery-method.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createTestDeliveryMethod } from '../../../test/utils/test-factories';

describe('DeliveryController', () => {
  let controller: DeliveryController;
  let deliveryService: jest.Mocked<Partial<DeliveryService>>;

  const mockDeliveryMethod = createTestDeliveryMethod();
  const mockPaginatedResponse: PaginatedResponse<DeliveryMethod> = {
    data: [
      mockDeliveryMethod,
      createTestDeliveryMethod({ name: 'Standard', price: 15000 }),
    ],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  beforeEach(async () => {
    deliveryService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      calculateShipping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryController],
      providers: [{ provide: DeliveryService, useValue: deliveryService }],
    }).compile();

    controller = module.get<DeliveryController>(DeliveryController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateDeliveryMethodDto = {
      name: 'Express Shipping',
      description: 'Fast delivery within 24 hours',
      price: 30000,
      freeShippingThreshold: 1000000,
      estimatedDaysMin: 1,
      estimatedDaysMax: 2,
      isActive: true,
      sortOrder: 0,
    };

    it('should create delivery method and return it', async () => {
      const newMethod = createTestDeliveryMethod({ ...createDto });
      deliveryService.create.mockResolvedValue(newMethod);

      const result = await controller.create(createDto);

      expect(deliveryService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(newMethod);
    });
  });

  describe('findAll', () => {
    it('should return paginated delivery methods', async () => {
      deliveryService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(deliveryService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return delivery method by id', async () => {
      deliveryService.findOne.mockResolvedValue(mockDeliveryMethod);

      const result = await controller.findOne(mockDeliveryMethod.id);

      expect(deliveryService.findOne).toHaveBeenCalledWith(
        mockDeliveryMethod.id,
      );
      expect(result).toEqual(mockDeliveryMethod);
    });

    it('should throw NotFoundException if not found', async () => {
      deliveryService.findOne.mockRejectedValue(
        new NotFoundException('روش ارسال یافت نشد'),
      );

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateDeliveryMethodDto = {
      name: 'Updated Shipping',
      price: 25000,
    };

    it('should update delivery method and return it', async () => {
      const updatedMethod = { ...mockDeliveryMethod, ...updateDto };
      deliveryService.update.mockResolvedValue(updatedMethod);

      const result = await controller.update(mockDeliveryMethod.id, updateDto);

      expect(deliveryService.update).toHaveBeenCalledWith(
        mockDeliveryMethod.id,
        updateDto,
      );
      expect(result).toEqual(updatedMethod);
    });

    it('should throw NotFoundException if not found', async () => {
      deliveryService.update.mockRejectedValue(
        new NotFoundException('روش ارسال یافت نشد'),
      );

      await expect(controller.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete delivery method and return success message', async () => {
      deliveryService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockDeliveryMethod.id);

      expect(deliveryService.remove).toHaveBeenCalledWith(
        mockDeliveryMethod.id,
      );
      expect(result).toEqual({ message: 'روش ارسال با موفقیت حذف شد' });
    });

    it('should throw NotFoundException if not found', async () => {
      deliveryService.remove.mockRejectedValue(
        new NotFoundException('روش ارسال یافت نشد'),
      );

      await expect(controller.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if method has orders', async () => {
      deliveryService.remove.mockRejectedValue(
        new BadRequestException('این روش ارسال دارای سفارش است'),
      );

      await expect(controller.remove(mockDeliveryMethod.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('calculateShipping', () => {
    it('should calculate shipping cost', async () => {
      deliveryService.calculateShipping.mockResolvedValue({
        shippingCost: 15000,
        isFree: false,
      });

      const result = await controller.calculateShipping(
        mockDeliveryMethod.id,
        300000,
      );

      expect(deliveryService.calculateShipping).toHaveBeenCalledWith(
        mockDeliveryMethod.id,
        300000,
      );
      expect(result).toEqual({ shippingCost: 15000, isFree: false });
    });

    it('should return free shipping if order amount exceeds threshold', async () => {
      deliveryService.calculateShipping.mockResolvedValue({
        shippingCost: 0,
        isFree: true,
      });

      const result = await controller.calculateShipping(
        mockDeliveryMethod.id,
        600000,
      );

      expect(result).toEqual({ shippingCost: 0, isFree: true });
    });
  });
});
