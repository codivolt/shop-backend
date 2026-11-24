import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';
import { slugify } from '../../common/utils/slug.util';
import { CategoriesService } from '../categories/categories.service';
import { BrandsService } from '../brands/brands.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImagesRepository: Repository<ProductImage>,
    @InjectRepository(ProductAttributeValue)
    private readonly productAttributesRepository: Repository<ProductAttributeValue>,
    private readonly categoriesService: CategoriesService,
    private readonly brandsService: BrandsService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    await this.assertRelationsExist(
      createProductDto.categoryId,
      createProductDto.brandId,
    );

    const slug = slugify(
      createProductDto.slug?.trim()
        ? createProductDto.slug
        : createProductDto.name,
    );
    await this.assertSlugAvailable(slug);
    await this.assertSkuAvailable(createProductDto.sku);

    const product = this.productsRepository.create({
      ...createProductDto,
      slug,
      sku: createProductDto.sku ?? null,
      brandId: createProductDto.brandId ?? null,
    });

    return this.productsRepository.save(product);
  }

  async findAll(query: ProductQueryDto): Promise<PaginatedResponse<Product>> {
    const pagination = resolvePagination(query);
    const qb = this.buildListQuery(query, pagination.skip, pagination.limit);
    const [data, total] = await qb.getManyAndCount();

    return buildPaginatedResponse(data, total, pagination);
  }

  async findByCategory(
    categoryId: string,
    query: ProductQueryDto,
  ): Promise<PaginatedResponse<Product>> {
    return this.findAll({ ...query, categoryId });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: {
        category: true,
        brand: true,
        images: true,
        attributeValues: true,
      },
    });

    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { slug },
      relations: {
        category: true,
        brand: true,
        images: true,
        attributeValues: true,
      },
    });

    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (
      updateProductDto.categoryId !== undefined ||
      updateProductDto.brandId !== undefined
    ) {
      await this.assertRelationsExist(
        updateProductDto.categoryId ?? product.categoryId,
        updateProductDto.brandId ?? product.brandId ?? undefined,
      );
    }

    if (updateProductDto.slug !== undefined) {
      const slug = slugify(
        updateProductDto.slug.trim()
          ? updateProductDto.slug
          : (updateProductDto.name ?? product.name),
      );
      await this.assertSlugAvailable(slug, id);
      product.slug = slug;
    }

    if (updateProductDto.sku !== undefined) {
      await this.assertSkuAvailable(updateProductDto.sku, id);
    }

    const { slug: _slug, ...rest } = updateProductDto;
    this.productsRepository.merge(product, rest);

    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('محصول یافت نشد');
    }
  }

  async updateImage(productId: string, imageUrl: string): Promise<void> {
    await this.productsRepository.update(productId, { imageUrl });
  }

  // Product Images
  async addImage(
    productId: string,
    imageUrl: string,
    isPrimary = false,
    sortOrder = 0,
  ): Promise<ProductImage> {
    await this.findOne(productId);

    if (isPrimary) {
      await this.productImagesRepository.update(
        { productId, isPrimary: true },
        { isPrimary: false },
      );
    }

    const image = this.productImagesRepository.create({
      productId,
      imageUrl,
      isPrimary,
      sortOrder,
    });

    return this.productImagesRepository.save(image);
  }

  async removeImage(imageId: string): Promise<void> {
    const result = await this.productImagesRepository.delete(imageId);
    if (result.affected === 0) {
      throw new NotFoundException('تصویر یافت نشد');
    }
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    await this.productImagesRepository.update(
      { productId, isPrimary: true },
      { isPrimary: false },
    );
    await this.productImagesRepository.update(imageId, { isPrimary: true });
  }

  // Product Attributes
  async addAttribute(
    productId: string,
    attributeId: string,
    value: string,
  ): Promise<ProductAttributeValue> {
    await this.findOne(productId);

    const existing = await this.productAttributesRepository.findOne({
      where: { productId, attributeId },
    });

    if (existing) {
      existing.value = value;
      return this.productAttributesRepository.save(existing);
    }

    const attribute = this.productAttributesRepository.create({
      productId,
      attributeId,
      value,
    });

    return this.productAttributesRepository.save(attribute);
  }

  async removeAttribute(productId: string, attributeId: string): Promise<void> {
    const result = await this.productAttributesRepository.delete({
      productId,
      attributeId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('ویژگی یافت نشد');
    }
  }

  // Search helper methods
  async getCategoryProductCounts(
    categoryIds: string[],
  ): Promise<Map<string, number>> {
    if (categoryIds.length === 0) return new Map();

    const results = await this.productsRepository
      .createQueryBuilder('p')
      .select('p.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('p.categoryId IN (:...categoryIds)', { categoryIds })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .groupBy('p.categoryId')
      .getRawMany();

    const counts = new Map<string, number>();
    for (const row of results) {
      counts.set(row.categoryId, Number(row.count));
    }
    return counts;
  }

  async getBrandProductCounts(
    brandIds: string[],
  ): Promise<Map<string, number>> {
    if (brandIds.length === 0) return new Map();

    const results = await this.productsRepository
      .createQueryBuilder('p')
      .select('p.brandId', 'brandId')
      .addSelect('COUNT(*)', 'count')
      .where('p.brandId IN (:...brandIds)', { brandIds })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .groupBy('p.brandId')
      .getRawMany();

    const counts = new Map<string, number>();
    for (const row of results) {
      counts.set(row.brandId, Number(row.count));
    }
    return counts;
  }

  private buildListQuery(
    query: ProductQueryDto,
    skip: number,
    limit: number,
  ): SelectQueryBuilder<Product> {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.attributeValues', 'attributes');

    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.brandId) {
      qb.andWhere('product.brandId = :brandId', { brandId: query.brandId });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('product.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('product.name LIKE :search', { search: `%${search}%` })
            .orWhere('product.sku LIKE :search', { search: `%${search}%` });
        }),
      );
    }

    return qb.orderBy('product.createdAt', 'DESC').skip(skip).take(limit);
  }

  private async assertRelationsExist(
    categoryId: string,
    brandId?: string,
  ): Promise<void> {
    await this.categoriesService.findOne(categoryId);

    if (brandId) {
      await this.brandsService.findOne(brandId);
    }
  }

  private async assertSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.productsRepository.findOne({
      where: { slug },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('نامک محصول قبلاً استفاده شده است');
    }
  }

  private async assertSkuAvailable(
    sku?: string | null,
    excludeId?: string,
  ): Promise<void> {
    if (!sku) {
      return;
    }

    const existing = await this.productsRepository.findOne({
      where: { sku },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('کد محصول (SKU) قبلاً استفاده شده است');
    }
  }

  async search(term: string, limit: number): Promise<Product[]> {
    const rows = await this.productsRepository
      .createQueryBuilder('p')
      .select(['p.id', 'p.name', 'p.slug', 'p.categoryId', 'p.brandId'])
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brand', 'brand')
      .where('p.name LIKE :term OR p.sku LIKE :term', { term: `${term}%` })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .orderBy('p.createdAt', 'DESC')
      .take(limit)
      .getRawMany();

    return rows.map(
      (row) =>
        ({
          id: row.p_id,
          name: row.p_name,
          slug: row.p_slug,
          categoryId: row.p_categoryId,
          brandId: row.p_brandId,
          category: row.category_id
            ? { id: row.category_id, name: row.category_name }
            : undefined,
          brand: row.brand_id
            ? { id: row.brand_id, name: row.brand_name }
            : undefined,
        }) as unknown as Product,
    );
  }

  async getFeatured(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isFeatured: true, isActive: true },
      relations: {
        category: true,
        brand: true,
        images: true,
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }
}
