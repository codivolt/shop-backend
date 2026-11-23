import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { ProductsService } from './products.service';
import { CategoryAttribute } from '../categories/category-attribute.entity';
import { CategoriesService } from '../categories/categories.service';
import {
  CreateProductAttributeValueDto,
  UpdateProductAttributeValueDto,
  ProductAttributeValueResponse,
} from './dto/product-attribute-value.dto';

@Injectable()
export class ProductAttributeValueService {
  constructor(
    @InjectRepository(ProductAttributeValue)
    private readonly valueRepository: Repository<ProductAttributeValue>,
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(
    productId: string,
    dto: CreateProductAttributeValueDto,
  ): Promise<ProductAttributeValueResponse> {
    const product = await this.productsService.findOne(productId);
    const attribute = await this.getAttribute(dto.attributeId);

    if (attribute.categoryId !== product.categoryId) {
      throw new BadRequestException('این ویژگی متعلق به دسته‌بندی محصول نیست');
    }

    const existing = await this.valueRepository.findOne({
      where: { productId, attributeId: dto.attributeId },
    });
    if (existing) {
      throw new ConflictException('این ویژگی قبلاً برای محصول ثبت شده است');
    }

    const value = this.valueRepository.create({
      ...dto,
      productId,
    });

    return this.toResponse(await this.valueRepository.save(value));
  }

  async findAll(productId: string): Promise<ProductAttributeValueResponse[]> {
    await this.productsService.findOne(productId);

    const values = await this.valueRepository.find({
      where: { productId },
      relations: { attribute: true },
      order: { createdAt: 'ASC' },
    });

    return values.map((value) => this.toResponse(value));
  }

  async findOne(productId: string, id: string): Promise<ProductAttributeValue> {
    const value = await this.valueRepository.findOne({
      where: { id, productId },
      relations: { attribute: true },
    });

    if (!value) {
      throw new NotFoundException('مقدار ویژگی یافت نشد');
    }

    return value;
  }

  async update(
    productId: string,
    id: string,
    dto: UpdateProductAttributeValueDto,
  ): Promise<ProductAttributeValueResponse> {
    const value = await this.findOne(productId, id);
    this.valueRepository.merge(value, dto);

    return this.toResponse(await this.valueRepository.save(value));
  }

  async remove(productId: string, id: string): Promise<void> {
    const result = await this.valueRepository.delete({ id, productId });
    if (result.affected === 0) {
      throw new NotFoundException('مقدار ویژگی یافت نشد');
    }
  }

  private async getAttribute(attributeId: string): Promise<CategoryAttribute> {
    const attribute = await this.categoriesService.findAttribute(attributeId);
    if (!attribute) {
      throw new NotFoundException('ویژگی یافت نشد');
    }
    return attribute;
  }

  private toResponse(
    value: ProductAttributeValue,
  ): ProductAttributeValueResponse {
    return {
      id: value.id,
      productId: value.productId,
      attributeId: value.attributeId,
      value: value.value,
      ...(value.attribute
        ? {
            attribute: {
              id: value.attribute.id,
              name: value.attribute.name,
              type: value.attribute.type,
            },
          }
        : {}),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    };
  }
}
