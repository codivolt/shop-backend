import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import {
  createTestProduct,
  createTestCategory,
  createTestBrand,
} from '../../../test/utils/test-factories';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: jest.Mocked<Partial<Repository<Product>>>;
  let productImageRepository: jest.Mocked<Partial<Repository<ProductImage>>>;
  let productAttributeRepository: jest.Mocked<
    Partial<Repository<ProductAttributeValue>>
  >;
  let categoryRepository: jest.Mocked<Partial<Repository<Category>>>;
  let brandRepository: jest.Mocked<Partial<Repository<Brand>>>;

  const mockCategory = createTestCategory();
  const mockBrand = createTestBrand();
  const mockProduct = createTestProduct({
    categoryId: mockCategory.id,
    brandId: mockBrand.id,
  });

  beforeEach(async () => {
    productRepository = createMockRepository<Product>();
    productImageRepository = createMockRepository<ProductImage>();
    productAttributeRepository = createMockRepository<ProductAttributeValue>();
    categoryRepository = createMockRepository<Category>();
    brandRepository = createMockRepository<Brand>();

    (productRepository.createQueryBuilder as jest.Mock).mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
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
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepository },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: productImageRepository,
        },
        {
          provide: getRepositoryToken(ProductAttributeValue),
          useValue: productAttributeRepository,
        },
        { provide: getRepositoryToken(Category), useValue: categoryRepository },
        { provide: getRepositoryToken(Brand), useValue: brandRepository },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateProductDto = {
      name: 'New Product',
      slug: 'new-product',
      description: 'Product description',
      shortDescription: 'Short description',
      price: 100000,
      compareAtPrice: 120000,
      costPrice: 80000,
      sku: 'SKU-NEW',
      barcode: '1234567890123',
      trackInventory: true,
      inventoryQuantity: 50,
      lowStockThreshold: 5,
      weight: 300,
      dimensions: { length: 10, width: 5, height: 3 },
      isActive: true,
      isFeatured: false,
      categoryId: mockCategory.id,
      brandId: mockBrand.id,
      attributes: [],
    };

    it('should create a new product successfully', async () => {
      const newProduct = createTestProduct({ ...createDto });
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      brandRepository.findOne.mockResolvedValue(mockBrand);
      productRepository.findOne.mockResolvedValue(null);
      productRepository.save.mockResolvedValue(newProduct as any);

      const result = await service.create(createDto);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.categoryId },
      });
      expect(brandRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.brandId },
      });
      expect(productRepository.save).toHaveBeenCalled();
      expect(result).toMatchObject(
        expect.objectContaining({ name: createDto.name, slug: createDto.slug }),
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if brand not found', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      brandRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);
      brandRepository.findOne.mockResolvedValue(mockBrand);
      productRepository.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    const query: ProductQueryDto = { page: 1, limit: 10 };

    it('should return paginated products', async () => {
      const products = [mockProduct, createTestProduct({ name: 'Product 2' })];
      productRepository.findAndCount.mockResolvedValue([
        products,
        products.length,
      ]);

      const result = await service.findAll(query);

      expect(result.data).toEqual(products);
      expect(result.total).toBe(products.length);
    });

    it('should filter by categoryId', async () => {
      productRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ ...query, categoryId: mockCategory.id });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: mockCategory.id }),
        }),
      );
    });

    it('should filter by brandId', async () => {
      productRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ ...query, brandId: mockBrand.id });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ brandId: mockBrand.id }),
        }),
      );
    });

    it('should filter by isActive', async () => {
      productRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ ...query, isActive: true });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should filter by inStock', async () => {
      productRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ ...query, inStock: true });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        }),
      );
    });

    it('should filter by price range', async () => {
      productRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ ...query, minPrice: 50000, maxPrice: 200000 });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(),
        }),
      );
    });

    it('should search by term', async () => {
      productRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ ...query, search: 'test' });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ name: expect.anything() }),
            expect.objectContaining({ slug: expect.anything() }),
            expect.objectContaining({ description: expect.anything() }),
          ]),
        }),
      );
    });

    it('should sort by price asc', async () => {
      productRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll({ ...query, sortBy: 'price', sortOrder: 'ASC' });

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { price: 'ASC' },
        }),
      );
    });

    it('should sort by createdAt desc by default', async () => {
      productRepository.findAndCount.mockResolvedValue([[mockProduct], 1]);

      await service.findAll(query);

      expect(productRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return product by id with relations', async () => {
      const productWithRelations = {
        ...mockProduct,
        category: mockCategory,
        brand: mockBrand,
        images: [],
        attributes: [],
      };
      productRepository.findOne.mockResolvedValue(productWithRelations);

      const result = await service.findOne(mockProduct.id);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        relations: ['category', 'brand', 'images', 'attributes'],
      });
      expect(result).toEqual(productWithRelations);
    });

    it('should return product by slug', async () => {
      const productWithRelations = {
        ...mockProduct,
        category: mockCategory,
        brand: mockBrand,
      };
      productRepository.findOne.mockResolvedValue(productWithRelations);

      const result = await service.findOneBySlug(mockProduct.slug);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { slug: mockProduct.slug },
        relations: ['category', 'brand', 'images', 'attributes'],
      });
    });

    it('should throw NotFoundException if not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 150000,
    };

    it('should update product successfully', async () => {
      const updatedProduct = { ...mockProduct, ...updateDto };
      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue(updatedProduct as any);

      const result = await service.update(mockProduct.id, updateDto);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
      });
      expect(productRepository.merge).toHaveBeenCalled();
      expect(result.name).toBe('Updated Product');
      expect(result.price).toBe(150000);
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.update('nonexistent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate category if categoryId provided', async () => {
      const newCategory = createTestCategory({ id: 'new-cat-id' });
      productRepository.findOne.mockResolvedValue(mockProduct);
      categoryRepository.findOne.mockResolvedValue(newCategory);
      productRepository.save.mockResolvedValue({
        ...mockProduct,
        categoryId: 'new-cat-id',
      } as any);

      await service.update(mockProduct.id, {
        ...updateDto,
        categoryId: 'new-cat-id',
      });

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'new-cat-id' },
      });
    });

    it('should throw NotFoundException if new category not found', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockProduct.id, {
          ...updateDto,
          categoryId: 'nonexistent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove product successfully', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockProduct.id);

      expect(productRepository.delete).toHaveBeenCalledWith(mockProduct.id);
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateInventory', () => {
    it('should update inventory quantity', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue({
        ...mockProduct,
        inventoryQuantity: 75,
      } as any);

      const result = await service.updateInventory(mockProduct.id, 75);

      expect(result.inventoryQuantity).toBe(75);
    });

    it('should throw NotFoundException if product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.updateInventory('nonexistent', 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('decreaseInventory', () => {
    it('should decrease inventory and save', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue({
        ...mockProduct,
        inventoryQuantity: 90,
      } as any);

      const result = await service.decreaseInventory(mockProduct.id, 10);

      expect(result.inventoryQuantity).toBe(90);
    });

    it('should throw BadRequestException if insufficient inventory', async () => {
      productRepository.findOne.mockResolvedValue({
        ...mockProduct,
        inventoryQuantity: 5,
      });

      await expect(
        service.decreaseInventory(mockProduct.id, 10),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
