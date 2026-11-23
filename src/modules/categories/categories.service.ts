import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { Category } from './category.entity';
import { CategoryAttribute } from './category-attribute.entity';
import { CategoryAttributeService } from './category-attribute.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';
import { slugify } from '../../common/utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly categoryAttributeService: CategoryAttributeService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    await this.assertParentExists(createCategoryDto.parentId);

    const slug = this.resolveSlug(
      createCategoryDto.name,
      createCategoryDto.slug,
    );
    await this.assertSlugAvailable(slug);

    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      slug,
    });

    return this.categoriesRepository.save(category);
  }

  async findAll(query: CategoryQueryDto): Promise<PaginatedResponse<Category>> {
    const pagination = resolvePagination(query);
    const search = query.search?.trim();

    const baseWhere: FindOptionsWhere<Category> = {};
    if (query.parentId) {
      baseWhere.parentId = query.parentId;
    }
    if (query.isActive !== undefined) {
      baseWhere.isActive = query.isActive;
    }

    const where: FindOptionsWhere<Category>[] | FindOptionsWhere<Category> =
      search
        ? [
            { ...baseWhere, name: Like(`%${search}%`) },
            { ...baseWhere, slug: Like(`%${search}%`) },
          ]
        : baseWhere;

    const [data, total] = await this.categoriesRepository.findAndCount({
      where,
      relations: { children: true },
      skip: pagination.skip,
      take: pagination.limit,
      order: { createdAt: 'DESC' },
    });

    return buildPaginatedResponse(data, total, pagination);
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { children: true, parent: true },
    });

    if (!category) {
      throw new NotFoundException('دسته‌بندی یافت نشد');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
      relations: { children: true, parent: true },
    });

    if (!category) {
      throw new NotFoundException('دسته‌بندی یافت نشد');
    }

    return category;
  }

  async findAttribute(id: string): Promise<CategoryAttribute | null> {
    return this.categoryAttributeService.findById(id);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('دسته‌بندی نمی‌تواند والد خود باشد');
      }
      await this.assertParentExists(updateCategoryDto.parentId);
      await this.assertNoCycle(id, updateCategoryDto.parentId);
    }

    if (updateCategoryDto.slug !== undefined) {
      const slug = this.resolveSlug(
        updateCategoryDto.name ?? category.name,
        updateCategoryDto.slug,
      );
      await this.assertSlugAvailable(slug, id);
      category.slug = slug;
    }

    const { slug: _slug, ...rest } = updateCategoryDto;
    this.categoriesRepository.merge(category, rest);

    return this.categoriesRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    if (category.children && category.children.length > 0) {
      throw new ConflictException(
        'نمی‌توان دسته‌بندی دارای زیرمجموعه را حذف کرد',
      );
    }

    const result = await this.categoriesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('دسته‌بندی یافت نشد');
    }
  }

  private resolveSlug(name: string, slug?: string): string {
    return slugify(slug?.trim() ? slug : name);
  }

  private async assertSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.categoriesRepository.findOne({
      where: { slug },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('نامک دسته‌بندی قبلاً استفاده شده است');
    }
  }

  private async assertParentExists(parentId?: string | null): Promise<void> {
    if (!parentId) {
      return;
    }
    const parent = await this.categoriesRepository.findOne({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException('دسته‌بندی والد یافت نشد');
    }
  }

  private async assertNoCycle(
    categoryId: string,
    parentId: string | null | undefined,
  ): Promise<void> {
    let currentId: string | null = parentId ?? null;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === categoryId) {
        throw new ConflictException(
          'دسته‌بندی والد نمی‌تواند زیرمجموعه‌ی همین دسته باشد',
        );
      }
      if (visited.has(currentId)) {
        break;
      }
      visited.add(currentId);
      const parent = await this.categoriesRepository.findOne({
        where: { id: currentId },
      });
      currentId = parent?.parentId ?? null;
    }
  }

  async search(term: string, limit: number): Promise<Category[]> {
    return this.categoriesRepository
      .createQueryBuilder('c')
      .select(['c.id', 'c.name', 'c.slug'])
      .where('c.name LIKE :term OR c.slug LIKE :term', { term: `${term}%` })
      .orderBy('c.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
