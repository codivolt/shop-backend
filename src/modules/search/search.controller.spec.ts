import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchDto } from './search.dto';
import {
  createTestProduct,
  createTestCategory,
  createTestBrand,
} from '../../../test/utils/test-factories';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: jest.Mocked<Partial<SearchService>>;

  const mockCategory = createTestCategory();
  const mockBrand = createTestBrand();
  const mockProduct = createTestProduct({
    categoryId: mockCategory.id,
    brandId: mockBrand.id,
  });

  beforeEach(async () => {
    searchService = {
      search: jest.fn(),
      getSuggestions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: searchService }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    jest.clearAllMocks();
  });

  describe('search', () => {
    const searchDto: SearchDto = {
      q: 'test product',
      type: 'all',
      limit: 10,
    };

    it('should return search results', async () => {
      const result = {
        products: [mockProduct],
        categories: [mockCategory],
        brands: [mockBrand],
      };
      searchService.search.mockResolvedValue(result);

      const response = await controller.search(searchDto);

      expect(searchService.search).toHaveBeenCalledWith(searchDto);
      expect(response).toEqual(result);
    });

    it('should search products only when type is products', async () => {
      const productsDto = { ...searchDto, type: 'products' as const };
      const result = { products: [mockProduct], categories: [], brands: [] };
      searchService.search.mockResolvedValue(result);

      const response = await controller.search(productsDto);

      expect(response).toEqual(result);
    });

    it('should search categories only when type is categories', async () => {
      const categoriesDto = { ...searchDto, type: 'categories' as const };
      const result = { products: [], categories: [mockCategory], brands: [] };
      searchService.search.mockResolvedValue(result);

      const response = await controller.search(categoriesDto);

      expect(response).toEqual(result);
    });

    it('should search brands only when type is brands', async () => {
      const brandsDto = { ...searchDto, type: 'brands' as const };
      const result = { products: [], categories: [], brands: [mockBrand] };
      searchService.search.mockResolvedValue(result);

      const response = await controller.search(brandsDto);

      expect(response).toEqual(result);
    });

    it('should apply filters', async () => {
      const filteredDto: SearchDto = {
        q: 'test',
        type: 'products',
        categoryId: 'cat-1',
        brandId: 'brand-1',
        minPrice: 50000,
        maxPrice: 200000,
        inStock: true,
        limit: 20,
      };
      searchService.search.mockResolvedValue({
        products: [],
        categories: [],
        brands: [],
      });

      await controller.search(filteredDto);

      expect(searchService.search).toHaveBeenCalledWith(filteredDto);
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions', async () => {
      const suggestions = [
        { name: 'Product 1', slug: 'product-1', type: 'product' },
        { name: 'Product 2', slug: 'product-2', type: 'product' },
      ];
      searchService.getSuggestions.mockResolvedValue(suggestions);

      const result = await controller.getSuggestions('test', 5);

      expect(searchService.getSuggestions).toHaveBeenCalledWith('test', 5);
      expect(result).toEqual(suggestions);
    });

    it('should use default limit if not provided', async () => {
      searchService.getSuggestions.mockResolvedValue([]);

      await controller.getSuggestions('test');

      expect(searchService.getSuggestions).toHaveBeenCalledWith('test', 10);
    });
  });
});
