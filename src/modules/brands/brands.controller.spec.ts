import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { Brand } from './brand.entity';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { BrandQueryDto } from './dto/brand-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createTestBrand } from '../../../test/utils/test-factories';

describe('BrandsController', () => {
  let controller: BrandsController;
  let brandsService: jest.Mocked<Partial<BrandsService>>;

  const mockBrand = createTestBrand();
  const mockPaginatedResponse: PaginatedResponse<Brand> = {
    data: [mockBrand, createTestBrand({ name: 'Brand 2' })],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  beforeEach(async () => {
    brandsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneBySlug: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BrandsController],
      providers: [{ provide: BrandsService, useValue: brandsService }],
    }).compile();

    controller = module.get<BrandsController>(BrandsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateBrandDto = {
      name: 'New Brand',
      slug: 'new-brand',
      description: 'New brand description',
      logoUrl: 'https://example.com/logo.png',
      isActive: true,
    };

    it('should create brand and return it', async () => {
      const newBrand = createTestBrand({ ...createDto });
      brandsService.create.mockResolvedValue(newBrand);

      const result = await controller.create(createDto);

      expect(brandsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(newBrand);
    });

    it('should throw ConflictException if slug exists', async () => {
      brandsService.create.mockRejectedValue(
        new ConflictException('اسلاگ تکراری است'),
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    const query: BrandQueryDto = { page: 1, limit: 10 };

    it('should return paginated brands', async () => {
      brandsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query);

      expect(brandsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return brand by id', async () => {
      brandsService.findOne.mockResolvedValue(mockBrand);

      const result = await controller.findOne(mockBrand.id);

      expect(brandsService.findOne).toHaveBeenCalledWith(mockBrand.id);
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException if not found', async () => {
      brandsService.findOne.mockRejectedValue(
        new NotFoundException('برند یافت نشد'),
      );

      await expect(controller.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOneBySlug', () => {
    it('should return brand by slug', async () => {
      brandsService.findOneBySlug.mockResolvedValue(mockBrand);

      const result = await controller.findOneBySlug(mockBrand.slug);

      expect(brandsService.findOneBySlug).toHaveBeenCalledWith(mockBrand.slug);
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException if not found', async () => {
      brandsService.findOneBySlug.mockRejectedValue(
        new NotFoundException('برند یافت نشد'),
      );

      await expect(controller.findOneBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateBrandDto = {
      name: 'Updated Brand',
      description: 'Updated description',
    };

    it('should update brand and return it', async () => {
      const updatedBrand = { ...mockBrand, ...updateDto };
      brandsService.update.mockResolvedValue(updatedBrand);

      const result = await controller.update(mockBrand.id, updateDto);

      expect(brandsService.update).toHaveBeenCalledWith(
        mockBrand.id,
        updateDto,
      );
      expect(result).toEqual(updatedBrand);
    });

    it('should throw NotFoundException if brand not found', async () => {
      brandsService.update.mockRejectedValue(
        new NotFoundException('برند یافت نشد'),
      );

      await expect(controller.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete brand and return success message', async () => {
      brandsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockBrand.id);

      expect(brandsService.remove).toHaveBeenCalledWith(mockBrand.id);
      expect(result).toEqual({ message: 'برند با موفقیت حذف شد' });
    });

    it('should throw NotFoundException if brand not found', async () => {
      brandsService.remove.mockRejectedValue(
        new NotFoundException('برند یافت نشد'),
      );

      await expect(controller.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if brand has products', async () => {
      brandsService.remove.mockRejectedValue(
        new BadRequestException('برند دارای محصول است'),
      );

      await expect(controller.remove(mockBrand.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
