import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandsService } from './brands.service';
import { Brand } from './brand.entity';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { BrandQueryDto } from './dto/brand-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import { createTestBrand } from '../../../test/utils/test-factories';

describe('BrandsService', () => {
  let service: BrandsService;
  let brandRepository: jest.Mocked<Partial<Repository<Brand>>>;

  const mockBrand = createTestBrand();

  beforeEach(async () => {
    brandRepository = createMockRepository<Brand>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: getRepositoryToken(Brand), useValue: brandRepository },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
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

    it('should create a new brand successfully', async () => {
      const newBrand = createTestBrand({ ...createDto });
      brandRepository.save.mockResolvedValue(newBrand as any);

      const result = await service.create(createDto);

      expect(brandRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject(createDto);
    });

    it('should throw ConflictException if slug already exists', async () => {
      brandRepository.findOne.mockResolvedValue(mockBrand);

      await expect(
        service.create({ ...createDto, slug: mockBrand.slug }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    const query: BrandQueryDto = { page: 1, limit: 10 };

    it('should return paginated brands', async () => {
      const brands = [mockBrand, createTestBrand({ name: 'Brand 2' })];
      brandRepository.findAndCount.mockResolvedValue([brands, brands.length]);

      const result = await service.findAll(query);

      expect(result.data).toEqual(brands);
      expect(result.total).toBe(brands.length);
    });

    it('should filter by isActive', async () => {
      brandRepository.findAndCount.mockResolvedValue([[mockBrand], 1]);

      const result = await service.findAll({ ...query, isActive: true });

      expect(brandRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should search by name', async () => {
      brandRepository.findAndCount.mockResolvedValue([[mockBrand], 1]);

      const result = await service.findAll({ ...query, search: 'Brand' });

      expect(brandRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ name: expect.anything() }),
            expect.objectContaining({ slug: expect.anything() }),
          ]),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return brand by id', async () => {
      brandRepository.findOne.mockResolvedValue(mockBrand);

      const result = await service.findOne(mockBrand.id);

      expect(result).toEqual(mockBrand);
    });

    it('should return brand by slug', async () => {
      brandRepository.findOne.mockResolvedValue(mockBrand);

      const result = await service.findOneBySlug(mockBrand.slug);

      expect(brandRepository.findOne).toHaveBeenCalledWith({
        where: { slug: mockBrand.slug },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      brandRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateBrandDto = {
      name: 'Updated Brand',
      description: 'Updated description',
    };

    it('should update brand successfully', async () => {
      const updatedBrand = { ...mockBrand, ...updateDto };
      brandRepository.findOne.mockResolvedValue(mockBrand);
      brandRepository.save.mockResolvedValue(updatedBrand as any);

      const result = await service.update(mockBrand.id, updateDto);

      expect(brandRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBrand.id },
      });
      expect(brandRepository.merge).toHaveBeenCalled();
      expect(result.name).toBe('Updated Brand');
    });

    it('should throw NotFoundException if brand not found', async () => {
      brandRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new slug already exists', async () => {
      const existingBrand = createTestBrand({ slug: 'existing-slug' });
      brandRepository.findOne.mockResolvedValueOnce(mockBrand);
      brandRepository.findOne.mockResolvedValueOnce(existingBrand);

      await expect(
        service.update(mockBrand.id, { slug: 'existing-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove brand successfully', async () => {
      brandRepository.findOne.mockResolvedValue(mockBrand);
      brandRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockBrand.id);

      expect(brandRepository.delete).toHaveBeenCalledWith(mockBrand.id);
    });

    it('should throw NotFoundException if brand not found', async () => {
      brandRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if brand has products', async () => {
      const brandWithProducts = { ...mockBrand, products: [{ id: 'prod-1' }] };
      brandRepository.findOne.mockResolvedValue(brandWithProducts);

      await expect(service.remove(mockBrand.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
