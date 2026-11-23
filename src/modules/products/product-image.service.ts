import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from './product-image.entity';
import { ProductsService } from './products.service';
import {
  CreateProductImageDto,
  UpdateProductImageDto,
  ProductImageResponse,
} from './dto/product-image.dto';

@Injectable()
export class ProductImageService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    private readonly productsService: ProductsService,
  ) {}

  async create(
    productId: string,
    dto: CreateProductImageDto,
  ): Promise<ProductImageResponse> {
    await this.assertProductExists(productId);

    if (dto.isPrimary) {
      await this.clearPrimaryFlag(productId);
    }

    const image = this.imageRepository.create({
      ...dto,
      productId,
    });

    const saved = await this.imageRepository.save(image);
    await this.syncPrimaryImage(productId, saved);

    return this.toResponse(saved);
  }

  async findAll(productId: string): Promise<ProductImageResponse[]> {
    await this.assertProductExists(productId);

    const images = await this.imageRepository.find({
      where: { productId },
      order: { isPrimary: 'DESC', sortOrder: 'ASC' },
    });

    return images.map((image) => this.toResponse(image));
  }

  async findOne(productId: string, id: string): Promise<ProductImage> {
    const image = await this.imageRepository.findOne({
      where: { id, productId },
    });

    if (!image) {
      throw new NotFoundException('تصویر یافت نشد');
    }

    return image;
  }

  async update(
    productId: string,
    id: string,
    dto: UpdateProductImageDto,
  ): Promise<ProductImageResponse> {
    const image = await this.findOne(productId, id);

    if (dto.isPrimary) {
      await this.clearPrimaryFlag(productId, id);
    }

    this.imageRepository.merge(image, dto);
    const saved = await this.imageRepository.save(image);
    await this.syncPrimaryImage(productId, saved);

    return this.toResponse(saved);
  }

  async remove(productId: string, id: string): Promise<void> {
    const result = await this.imageRepository.delete({ id, productId });
    if (result.affected === 0) {
      throw new NotFoundException('تصویر یافت نشد');
    }
  }

  private async assertProductExists(productId: string): Promise<void> {
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException('محصول یافت نشد');
    }
  }

  private async clearPrimaryFlag(
    productId: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.imageRepository
      .createQueryBuilder()
      .update(ProductImage)
      .set({ isPrimary: false })
      .where('productId = :productId', { productId })
      .andWhere('isPrimary = :isPrimary', { isPrimary: true });

    if (excludeId) {
      qb.andWhere('id != :excludeId', { excludeId });
    }

    await qb.execute();
  }

  private async syncPrimaryImage(
    productId: string,
    image: ProductImage,
  ): Promise<void> {
    if (!image.isPrimary) {
      return;
    }
    await this.productsService.updateImage(productId, image.imageUrl);
  }

  private toResponse(image: ProductImage): ProductImageResponse {
    return {
      id: image.id,
      productId: image.productId,
      imageUrl: image.imageUrl,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }
}
