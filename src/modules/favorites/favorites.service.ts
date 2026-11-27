import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { Product } from '../products/product.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    private readonly productsService: ProductsService,
  ) {}

  async list(userId: string): Promise<Product[]> {
    const favorites = await this.favoritesRepository.find({
      where: { userId },
      relations: { product: { category: true, brand: true } },
      order: { createdAt: 'DESC' },
    });

    return favorites
      .map((favorite) => favorite.product)
      .filter((product): product is Product => Boolean(product));
  }

  async add(userId: string, productId: string): Promise<Product> {
    const product = await this.productsService.findOne(productId);

    if (!product.isActive) {
      throw new BadRequestException('این محصول غیرفعال است');
    }

    const existing = await this.favoritesRepository.findOne({
      where: { userId, productId },
    });

    if (!existing) {
      await this.favoritesRepository.save(
        this.favoritesRepository.create({ userId, productId }),
      );
    }

    return product;
  }

  async remove(userId: string, productId: string): Promise<void> {
    const result = await this.favoritesRepository.delete({
      userId,
      productId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('محصول در علاقه‌مندی‌ها یافت نشد');
    }
  }
}
