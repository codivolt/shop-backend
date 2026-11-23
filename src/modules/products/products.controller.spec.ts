import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { createTestProduct, createTestCategory, createTestBrand } from '../../../test/utils/test-factories';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<Partial<ProductsService>>;

  const mockCategory = createTestCategory();
  const mockBrand = createTestBrand();
  const mockProduct = createTestProduct({ categoryId: mockCategory.id, brandId: mockBrand.id });
  const mockProductWithRelations = { ...mockProduct, category: mockCategory, brand: mockBrand, images: [], attributes: [] };
  const mockPaginatedResponse: PaginatedResponse<Product> = {
    data: [mockProduct, createTestProduct({ name: 'Product 2' })],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  beforeEach(async () => {
    productsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneBySlug: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      updateInventory: jest.fn(),
      decreaseInventory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
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

    it('should create product and return it', async () => {
      const newProduct = createTestProduct({ ...createDto });
      productsService.create.mockResolvedValue(newProduct);

      const result = await controller.create(createDto);

      expect(productsService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(newProduct);
    });

    it('should throw NotFoundException if category not found', async () => {
      productsService.create.mockRejectedValue(new NotFoundException('دسته‌بندی یافت نشد'));

      await expect(controller.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if slug exists', async () => {
      productsService.create.mockRejectedValue(new ConflictException('اسلاگ تکراری است'));

      await expect(controller.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    const query: ProductQueryDto = { page: 1, limit: 10 };

    it('should return paginated products', async () => {
      productsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(query);

      expect(productsService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should pass all query parameters including filters', async () => {
      const queryWithFilters: ProductQueryDto = {
        page: 2,
        limit: 5,
        categoryId: 'cat-id',
        brandId: 'brand-id',
        isActive: true,
        inStock: true,
        minPrice: 50000,
        maxPrice: 200000,
        search: 'test',
        sortBy: 'price',
        sortOrder: 'ASC',
      };
      productsService.findAll.mockResolvedValue(mockPaginatedResponse);

      await controller.findAll(queryWithFilters);

      expect(productsService.findAll).toHaveBeenCalledWith(queryWithFilters);
    });
  });

  describe('findOne', () => {
    it('should return product by id with relations', async () => {
      productsService.findOne.mockResolvedValue(mockProductWithRelations);

      const result = await controller.findOne(mockProduct.id);

      expect(productsService.findOne).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProductWithRelations);
    });

    it('should throw NotFoundException if not found', async () => {
      productsService.findOne.mockRejectedValue(new NotFoundException('محصول یافت نشد'));

      await expect(controller.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneBySlug', () => {
    it('should return product by slug', async () => {
      productsService.findOneBySlug.mockResolvedValue(mockProductWithRelations);

      const result = await controller.findOneBySlug(mockProduct.slug);

      expect(productsService.findOneBySlug).toHaveBeenCalledWith(mockProduct.slug);
      expect(result).toEqual(mockProductWithRelations);
    });

    it('should throw NotFoundException if not found', async () => {
      productsService.findOneBySlug.mockRejectedValue(new NotFoundException('محصول یافت نشد'));

      await expect(controller.findOneBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductDto = {
      name: 'Updated Product',
      price: 150000,
    };

    it('should update product and return it', async () => {
      const updatedProduct = { ...mockProduct, ...updateDto };
      productsService.update.mockResolvedValue(updatedProduct);

      const result = await controller.update(mockProduct.id, updateDto);

      expect(productsService.update).toHaveBeenCalledWith(mockProduct.id, updateDto);
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      productsService.update.mockRejectedValue(new NotFoundException('محصول یافت نشد'));

      await expect(controller.update('nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete product and return success message', async () => {
      productsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockProduct.id);

      expect(productsService.remove).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual({ message: 'محصول با موفقیت حذف شد' });
    });

    it('should throw NotFoundException if product not found', async () => {
      productsService.remove.mockRejectedValue(new NotFoundException('محصول یافت نشد'));

      await expect(controller.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateInventory', () => {
    it('should update inventory and return product', async () => {
      const updatedProduct = { ...mockProduct, inventoryQuantity: 75 };
      productsService.updateInventory.mockResolvedValue(updatedProduct);

      const result = await controller.updateInventory(mockProduct.id, 75);

      expect(productsService.updateInventory).toHaveBeenCalledWith(mockProduct.id, 75);
      expect(result).toEqual(updatedProduct);
    });
  });
});