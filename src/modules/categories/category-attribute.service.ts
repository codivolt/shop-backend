import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeType, CategoryAttribute } from './category-attribute.entity';
import { Category } from './category.entity';
import {
  CreateCategoryAttributeDto,
  UpdateCategoryAttributeDto,
  CategoryAttributeResponse,
} from './dto/category-attribute.dto';

@Injectable()
export class CategoryAttributeService {
  constructor(
    @InjectRepository(CategoryAttribute)
    private readonly attributeRepository: Repository<CategoryAttribute>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(
    categoryId: string,
    dto: CreateCategoryAttributeDto,
  ): Promise<CategoryAttributeResponse> {
    await this.assertCategoryExists(categoryId);
    this.assertValidOptions(dto.type, dto.options);

    const attribute = this.attributeRepository.create({
      ...dto,
      options: dto.options ?? null,
      categoryId,
    });

    return this.toResponse(await this.attributeRepository.save(attribute));
  }

  async findAll(categoryId: string): Promise<CategoryAttributeResponse[]> {
    await this.assertCategoryExists(categoryId);

    const attributes = await this.attributeRepository.find({
      where: { categoryId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    return attributes.map((attribute) => this.toResponse(attribute));
  }

  async findOne(categoryId: string, id: string): Promise<CategoryAttribute> {
    const attribute = await this.attributeRepository.findOne({
      where: { id, categoryId },
    });

    if (!attribute) {
      throw new NotFoundException('ویژگی یافت نشد');
    }

    return attribute;
  }

  async findById(id: string): Promise<CategoryAttribute | null> {
    return this.attributeRepository.findOne({ where: { id } });
  }

  async update(
    categoryId: string,
    id: string,
    dto: UpdateCategoryAttributeDto,
  ): Promise<CategoryAttributeResponse> {
    const attribute = await this.findOne(categoryId, id);
    const type = dto.type ?? attribute.type;

    if (dto.options !== undefined || dto.type !== undefined) {
      this.assertValidOptions(type, dto.options ?? attribute.options);
    }

    this.attributeRepository.merge(attribute, dto);
    return this.toResponse(await this.attributeRepository.save(attribute));
  }

  async remove(categoryId: string, id: string): Promise<void> {
    const result = await this.attributeRepository.delete({ id, categoryId });
    if (result.affected === 0) {
      throw new NotFoundException('ویژگی یافت نشد');
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException('دسته‌بندی یافت نشد');
    }
  }

  private assertValidOptions(
    type: AttributeType,
    options?: string | null,
  ): void {
    if (type !== AttributeType.SELECT) {
      return;
    }

    if (!options || !options.trim()) {
      throw new BadRequestException(
        'برای ویژگی از نوع لیست انتخاب، گزینه‌ها الزامی است',
      );
    }

    try {
      const parsed = JSON.parse(options);
      if (
        !Array.isArray(parsed) ||
        parsed.length === 0 ||
        !parsed.every((item) => typeof item === 'string' && item.trim())
      ) {
        throw new Error('invalid options');
      }
    } catch {
      throw new BadRequestException(
        'گزینه‌ها باید آرایه JSON از رشته‌ها باشند، مثال: ["قرمز","آبی"]',
      );
    }
  }

  private toResponse(attribute: CategoryAttribute): CategoryAttributeResponse {
    return {
      id: attribute.id,
      categoryId: attribute.categoryId,
      name: attribute.name,
      type: attribute.type,
      options: attribute.options,
      isRequired: attribute.isRequired,
      sortOrder: attribute.sortOrder,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
    };
  }
}
