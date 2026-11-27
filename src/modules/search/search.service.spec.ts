import { SearchService } from './search.service';

describe('SearchService', () => {
  const productsService: any = {};
  const categoriesService: any = {};
  const brandsService: any = {};
  const usersService: any = {};
  const ordersService: any = {};
  const cacheManager: any = { get: jest.fn(), set: jest.fn() };
  const service = new SearchService(
    productsService,
    categoriesService,
    brandsService,
    usersService,
    ordersService,
    cacheManager,
  );

  it('search returns empty array for blank query', async () => {
    await expect(service.search('   ')).resolves.toEqual([]);
  });

  it('exposes suggestions and cache helpers', () => {
    expect(typeof service.suggestions).toBe('function');
    expect(typeof service.warmupCache).toBe('function');
  });
});