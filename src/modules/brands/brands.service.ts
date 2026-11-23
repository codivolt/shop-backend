import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { Brand } from './brand.entity';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { BrandQueryDto } from './dto/brand-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';
import { slugify } from '../../common/utils/slug.util';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    await this.assertNameAvailable(createBrandDto.name);

    const slug = slugify(
      createBrandDto.slug?.trim() ? createBrandDto.slug : createBrandDto.name,
    );
    await this.assertSlugAvailable(slug);

    const brand = this.brandsRepository.create({
      ...createBrandDto,
      slug,
    });

    return this.brandsRepository.save(brand);
  }

  async findAll(query: BrandQueryDto): Promise<PaginatedResponse<Brand>> {
    const pagination = resolvePagination(query);
    const search = query.search?.trim();

    const baseWhere: FindOptionsWhere<Brand> = {};
    if (query.isActive !== undefined) {
      baseWhere.isActive = query.isActive;
    }

    const where: FindOptionsWhere<Brand>[] | FindOptionsWhere<Brand> = search
      ? [
          { ...baseWhere, name: Like(`%${search}%`) },
          { ...baseWhere, slug: Like(`%${search}%`) },
        ]
      : baseWhere;

    const [data, total] = await this.brandsRepository.findAndCount({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      order: { createdAt: 'DESC' },
    });

    return buildPaginatedResponse(data, total, pagination);
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException('برند یافت نشد');
    }
    return brand;
  }

  async findBySlug(slug: string): Promise<Brand> {
    const brand = await this.brandsRepository.findOne({ where: { slug } });
    if (!brand) {
      throw new NotFoundException('برند یافت نشد');
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);

    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      await this.assertNameAvailable(updateBrandDto.name, id);
    }

    if (updateBrandDto.slug !== undefined) {
      const slug = slugify(
        updateBrandDto.slug.trim() ? updateBrandDto.slug : brand.name,
      );
      await this.assertSlugAvailable(slug, id);
      brand.slug = slug;
    }

    const { slug: _slug, ...rest } = updateBrandDto;
    this.brandsRepository.merge(brand, rest);

    return this.brandsRepository.save(brand);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    const result = await this.brandsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('برند یافت نشد');
    }
  }

  private async assertNameAvailable(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.brandsRepository.findOne({ where: { name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('برند با این نام قبلاً ثبت شده است');
    }
  }

  private async assertSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.brandsRepository.findOne({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException('نامک برند قبلاً استفاده شده است');
    }
  }

  async search(term: string, limit: number): Promise<Brand[]> {
    return this.brandsRepository
      .createQueryBuilder('b')
      .select(['b.id', 'b.name', 'b.slug'])
      .where('b.name LIKE :term OR b.slug LIKE :term', { term: `${term}%` })
      .orderBy('b.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
