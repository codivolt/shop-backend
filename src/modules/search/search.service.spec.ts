import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchDto } from './search.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import { createTestProduct, createTestCategory, createTestBrand } from '../../../test/utils/test-factories';

describe('SearchService', () => {
  let service: SearchService;
  let productRepository: jest.Mocked<Partial<Repository<Product>>>;
  let categoryRepository: jest.Mocked<Partial<Repository<Category>>>;
  let brandRepository: jest.Mocked<Partial<Repository<Brand>>>;

  const mockCategory = createTestCategory();
  const mockBrand = createTestBrand();
  const mockProduct = createTestProduct({ categoryId: mockCategory.id, brandId: mockBrand.id });

  beforeEach(async () => {
    productRepository = createMockRepository<Product>();
    categoryRepository = createMockRepository<Category>();
    brandRepository = createMockRepository<Brand>();

    (productRepository.createQueryBuilder as jest.Mock).mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    });

    (categoryRepository.createQueryBuilder as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    (brandRepository.createQueryBuilder as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: getRepositoryToken(Product), useValue: productRepository },
        { provide: getRepositoryToken(Category), useValue: categoryRepository },
        { provide: getRepositoryToken(Brand), useValue: brandRepository },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();
  });

  describe('search', () => {
    const searchDto: SearchDto = {
      q: 'test product',
      type: 'all',
      limit: 10,
    };

    it('should search products by default', async () => {
      const products = [mockProduct];
      productRepository.createQueryBuilder().getMany.mockResolvedValue(products);

      const result = await service.search(searchDto);

      expect(productRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.products).toEqual(products);
    });

    it('should search categories when type is categories', async () => {
      const categories = [mockCategory];
      searchDto.type = 'categories';
      categoryRepository.createQueryBuilder().getMany.mockResolvedValue(categories);

      const result = await service.search(searchDto);

      expect(categoryRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.categories).toEqual(categories);
    });

    it('should search brands when type is brands', async () => {
      const brands = [mockBrand];
      searchDto.type = 'brands';
      brandRepository.createQueryBuilder().getMany.mockResolvedValue(brands);

      const result = await service.search(searchDto);

      expect(brandRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.brands).toEqual(brands);
    });

    it('should search all types when type is all', async () => {
      const products = [mockProduct];
      const categories = [mockCategory];
      const brands = [mockBrand];
      productRepository.createQueryBuilder().getMany.mockResolvedValue(products);
      categoryRepository.createQueryBuilder().getMany.mockResolvedValue(categories);
      brandRepository.createQueryBuilder().getMany.mockResolvedValue(brands);

      const result = await service.search(searchDto);

      expect(productRepository.createQueryBuilder).toHaveBeenCalled();
      expect(categoryRepository.createQueryBuilder).toHaveBeenCalled();
      expect(brandRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result.products).toEqual(products);
      expect(result.categories).toEqual(categories);
      expect(result.brands).toEqual(brands);
    });

    it('should apply limit to results', async () => {
      searchDto.limit = 5;
      productRepository.createQueryBuilder().getMany.mockResolvedValue([mockProduct]);

      await service.search(searchDto);

      expect(productRepository.createQueryBuilder().take).toHaveBeenCalledWith(5);
    });

    it('should apply filters to product search', async () => {
      searchDto.categoryId = 'cat-1';
      searchDto.brandId = 'brand-1';
      searchDto.minPrice = 50000;
      searchDto.maxPrice = 200000;
      searchDto.inStock = true;
      productRepository.createQueryBuilder().getMany.mockResolvedValue([mockProduct]);

      await service.search(searchDto);

      const qb = productRepository.createQueryBuilder();
      expect(qb.andWhere).toHaveBeenCalledWith('product.categoryId = :categoryId', { categoryId: 'cat-1' });
      expect(qb.andWhere).toHaveBeenCalledWith('product.brandId = :brandId', { brandId: 'brand-1' });
      expect(qb.andWhere).toHaveBeenCalledWith('product.price >= :minPrice', { minPrice: 50000 });
      expect(qb.andWhere).toHaveBeenCalledWith('product.price <= :maxPrice', { maxPrice: 200000 });
      expect(qb.andWhere).toHaveBeenCalledWith('product.inventoryQuantity > 0');
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions', async () => {
      const products = [mockProduct, createTestProduct({ name: 'Test Product 2' })];
      productRepository.createQueryBuilder().getMany.mockResolvedValue(products);

      const result = await service.getSuggestions('test', 5);

      expect(productRepository.createQueryBuilder).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('slug');
      expect(result[0]).toHaveProperty('type', 'product');
    });

    it('should limit suggestions', async () => {
      productRepository.createQueryBuilder().getMany.mockResolvedValue([mockProduct]);

      const result = await service.getSuggestions('test', 1);

      expect(result).toHaveLength(1);
    });
  });
});