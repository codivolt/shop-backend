import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryService } from './delivery.service';
import { DeliveryMethod } from './delivery-method.entity';
import { CreateDeliveryMethodDto, UpdateDeliveryMethodDto } from './dto/delivery-method.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import { createTestDeliveryMethod } from '../../../test/utils/test-factories';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let deliveryMethodRepository: jest.Mocked<Partial<Repository<DeliveryMethod>>>;

  const mockDeliveryMethod = createTestDeliveryMethod();

  beforeEach(async () => {
    deliveryMethodRepository = createMockRepository<DeliveryMethod>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryService,
        { provide: getRepositoryToken(DeliveryMethod), useValue: deliveryMethodRepository },
      ],
    }).compile();

    service = module.get<DeliveryService>(DeliveryService);
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

    it('should create a new delivery method successfully', async () => {
      const newMethod = createTestDeliveryMethod({ ...createDto });
      deliveryMethodRepository.save.mockResolvedValue(newMethod as any);

      const result = await service.create(createDto);

      expect(deliveryMethodRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated delivery methods', async () => {
      const methods = [mockDeliveryMethod, createTestDeliveryMethod({ name: 'Standard', price: 15000 })];
      deliveryMethodRepository.findAndCount.mockResolvedValue([methods, methods.length]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(methods);
      expect(result.total).toBe(methods.length);
    });

    it('should filter by isActive', async () => {
      deliveryMethodRepository.findAndCount.mockResolvedValue([[mockDeliveryMethod], 1]);

      const result = await service.findAll({ page: 1, limit: 10, isActive: true });

      expect(deliveryMethodRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      }));
    });
  });

  describe('findOne', () => {
    it('should return delivery method by id', async () => {
      deliveryMethodRepository.findOne.mockResolvedValue(mockDeliveryMethod);

      const result = await service.findOne(mockDeliveryMethod.id);

      expect(result).toEqual(mockDeliveryMethod);
    });

    it('should throw NotFoundException if not found', async () => {
      deliveryMethodRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateDeliveryMethodDto = {
      name: 'Updated Shipping',
      price: 25000,
    };

    it('should update delivery method successfully', async () => {
      const updatedMethod = { ...mockDeliveryMethod, ...updateDto };
      deliveryMethodRepository.findOne.mockResolvedValue(mockDeliveryMethod);
      deliveryMethodRepository.save.mockResolvedValue(updatedMethod as any);

      const result = await service.update(mockDeliveryMethod.id, updateDto);

      expect(deliveryMethodRepository.findOne).toHaveBeenCalledWith({ where: { id: mockDeliveryMethod.id } });
      expect(deliveryMethodRepository.merge).toHaveBeenCalled();
      expect(result.name).toBe('Updated Shipping');
      expect(result.price).toBe(25000);
    });

    it('should throw NotFoundException if not found', async () => {
      deliveryMethodRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove delivery method successfully', async () => {
      deliveryMethodRepository.findOne.mockResolvedValue(mockDeliveryMethod);
      deliveryMethodRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockDeliveryMethod.id);

      expect(deliveryMethodRepository.delete).toHaveBeenCalledWith(mockDeliveryMethod.id);
    });

    it('should throw NotFoundException if not found', async () => {
      deliveryMethodRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if method has orders', async () => {
      const methodWithOrders = { ...mockDeliveryMethod, orders: [{ id: 'order-1' }] };
      deliveryMethodRepository.findOne.mockResolvedValue(methodWithOrders);

      await expect(service.remove(mockDeliveryMethod.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('calculateShipping', () => {
    it('should return free shipping if order amount exceeds threshold', async () => {
      const method = createTestDeliveryMethod({ price: 15000, freeShippingThreshold: 500000 });
      deliveryMethodRepository.findOne.mockResolvedValue(method);

      const result = await service.calculateShipping(method.id, 600000);

      expect(result).toEqual({ shippingCost: 0, isFree: true });
    });

    it('should return shipping cost if order amount below threshold', async () => {
      const method = createTestDeliveryMethod({ price: 15000, freeShippingThreshold: 500000 });
      deliveryMethodRepository.findOne.mockResolvedValue(method);

      const result = await service.calculateShipping(method.id, 300000);

      expect(result).toEqual({ shippingCost: 15000, isFree: false });
    });

    it('should throw NotFoundException if method not found', async () => {
      deliveryMethodRepository.findOne.mockResolvedValue(null);

      await expect(service.calculateShipping('nonexistent', 100000)).rejects.toThrow(NotFoundException);
    });
  });
});