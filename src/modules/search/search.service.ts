import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { BrandsService } from '../brands/brands.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { SearchResult, SearchResultType } from './search.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly CACHE_TTL = 60 * 1000;
  private readonly SUGGESTION_CACHE_TTL = 5 * 60 * 1000;

  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly brandsService: BrandsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private readonly productType = 'product' as SearchResultType;
  private readonly categoryType = 'category' as SearchResultType;
  private readonly brandType = 'brand' as SearchResultType;
  private readonly userType = 'user' as SearchResultType;
  private readonly orderType = 'order' as SearchResultType;

  async search(q: string, limit = 5): Promise<SearchResult[]> {
    const term = q.trim();
    if (!term) return [];

    const cacheKey = `search:${term}:${limit}`;
    const cached = await this.cacheManager.get<SearchResult[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for search: ${term}`);
      return cached;
    }

    this.logger.debug(`Cache miss for search: ${term}`);

    const [products, categories, brands, users, orders] = await Promise.all([
      this.productsService.search(term, limit),
      this.categoriesService.search(term, limit),
      this.brandsService.search(term, limit),
      this.usersService.search(term, limit),
      this.ordersService.searchById(term, limit),
    ]);

    const results: SearchResult[] = [
      ...products.map((p) => ({
        type: this.productType,
        id: p.id,
        title: p.name,
        href: `/products/${p.id}`,
        subtitle: p.category?.name,
      })),
      ...categories.map((c) => ({
        type: this.categoryType,
        id: c.id,
        title: c.name,
        href: `/categories/${c.id}`,
      })),
      ...brands.map((b) => ({
        type: this.brandType,
        id: b.id,
        title: b.name,
        href: `/brands/${b.id}`,
      })),
      ...users.map((u) => ({
        type: this.userType,
        id: u.id,
        title: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        href: `/users/${u.id}`,
        subtitle: u.email,
      })),
      ...orders.map((o) => ({
        type: this.orderType,
        id: o.id,
        title: `سفارش ${o.orderCode || o.id.slice(0, 8)}`,
        href: `/orders`,
        subtitle: o.status,
      })),
    ];

    await this.cacheManager.set(cacheKey, results, this.CACHE_TTL);
    return results;
  }

  async suggestions(q: string, limit = 8): Promise<SearchResult[]> {
    const term = q.trim();
    if (!term || term.length < 1) return [];

    const cacheKey = `suggestions:${term}:${limit}`;
    const cached = await this.cacheManager.get<SearchResult[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for suggestions: ${term}`);
      return cached;
    }

    this.logger.debug(`Cache miss for suggestions: ${term}`);

    const [products, categories, brands] = await Promise.all([
      this.productsService.search(term, limit),
      this.categoriesService.search(term, limit),
      this.brandsService.search(term, limit),
    ]);

    const [categoryCounts, brandCounts] = await Promise.all([
      this.getCategoryProductCounts(categories.map((c) => c.id)),
      this.getBrandProductCounts(brands.map((b) => b.id)),
    ]);

    const results: SearchResult[] = [
      ...products.map((p) => ({
        type: this.productType,
        id: p.id,
        title: p.name,
        href: `/products/${p.id}`,
        subtitle: p.category?.name,
      })),
      ...categories.map((c) => ({
        type: this.categoryType,
        id: c.id,
        title: c.name,
        href: `/categories/${c.id}`,
        count: categoryCounts.get(c.id) ?? 0,
      })),
      ...brands.map((b) => ({
        type: this.brandType,
        id: b.id,
        title: b.name,
        href: `/brands/${b.id}`,
        count: brandCounts.get(b.id) ?? 0,
      })),
    ];

    const limited = results.slice(0, limit);
    await this.cacheManager.set(cacheKey, limited, this.SUGGESTION_CACHE_TTL);
    return limited;
  }

  private async getCategoryProductCounts(
    categoryIds: string[],
  ): Promise<Map<string, number>> {
    if (categoryIds.length === 0) return new Map();

    const counts =
      await this.productsService.getCategoryProductCounts(categoryIds);
    return counts;
  }

  private async getBrandProductCounts(
    brandIds: string[],
  ): Promise<Map<string, number>> {
    if (brandIds.length === 0) return new Map();

    const counts = await this.productsService.getBrandProductCounts(brandIds);
    return counts;
  }

  async warmupCache(): Promise<void> {
    const commonQueries = [
      'گوشی',
      'موبایل',
      'لپ‌تاپ',
      'تبلت',
      'ساعت',
      'هدفون',
      'کیف',
      'کفش',
      'پوشاک',
      'کتاب',
      'اسباب‌بازی',
      'ورزش',
      'خانه',
      'مبلمان',
      'دکوراسیون',
      'ابزار',
      'سلامت',
      'آرایشی',
    ];

    this.logger.log('Warming up search suggestion cache...');

    await Promise.all(
      commonQueries.map((query) =>
        this.suggestions(query, 8).catch((err) => {
          this.logger.warn(
            `Failed to warmup cache for "${query}": ${err.message}`,
          );
        }),
      ),
    );

    this.logger.log('Search suggestion cache warmup completed');
  }

  async invalidateSuggestionCache(): Promise<void> {
    // Note: cache-manager doesn't have a built-in way to list keys
    // This is a limitation - in production you'd use Redis SCAN directly
    this.logger.log(
      'Suggestion cache invalidation requested (manual cleanup needed)',
    );
  }
}
