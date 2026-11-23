import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { Product } from '../products/product.entity';
import { ProductsService } from '../products/products.service';
import {
  AddToCartDto,
  CartItemResponse,
  UpdateCartItemDto,
} from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  async getCart(userId: string): Promise<CartItemResponse[]> {
    const items = await this.cartItemRepository.find({
      where: { userId },
      relations: { product: { category: true, brand: true } },
      order: { createdAt: 'DESC' },
    });

    return items
      .filter((item) => item.product)
      .map((item) => this.toResponse(item));
  }

  async addToCart(
    userId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartItemResponse> {
    const quantity = addToCartDto.quantity ?? 1;
    const product = await this.getAvailableProduct(addToCartDto.productId);

    const existing = await this.cartItemRepository.findOne({
      where: { userId, productId: addToCartDto.productId },
      relations: { product: true },
    });

    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    this.assertStock(product, nextQuantity);

    if (existing) {
      existing.quantity = nextQuantity;
      const saved = await this.cartItemRepository.save(existing);
      return this.toResponse({ ...saved, product });
    }

    const cartItem = this.cartItemRepository.create({
      userId,
      productId: addToCartDto.productId,
      quantity,
    });
    const saved = await this.cartItemRepository.save(cartItem);
    return this.toResponse({ ...saved, product });
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItemResponse> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, userId },
      relations: { product: true },
    });

    if (!cartItem) {
      throw new NotFoundException('محصول در سبد خرید یافت نشد');
    }

    this.assertStock(cartItem.product, updateCartItemDto.quantity);

    cartItem.quantity = updateCartItemDto.quantity;
    const saved = await this.cartItemRepository.save(cartItem);
    return this.toResponse({ ...saved, product: cartItem.product });
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    const result = await this.cartItemRepository.delete({
      id: cartItemId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('محصول در سبد خرید یافت نشد');
    }
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartItemRepository.delete({ userId });
  }

  private async getAvailableProduct(productId: string): Promise<Product> {
    const product = await this.productsService.findOne(productId);

    if (!product.isActive) {
      throw new BadRequestException('این محصول غیرفعال است');
    }

    if (product.stock <= 0) {
      throw new BadRequestException('این محصول موجود نیست');
    }

    return product;
  }

  private assertStock(product: Product, quantity: number): void {
    if (quantity > product.stock) {
      throw new BadRequestException(
        `بیشترین تعداد قابل خرید ${product.stock} عدد است`,
      );
    }
  }

  private toResponse(item: CartItem): CartItemResponse {
    if (!item.product) {
      throw new NotFoundException('محصول یافت نشد');
    }

    return {
      id: item.id,
      productId: item.productId,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: Number(item.product.price),
        imageUrl: item.product.imageUrl,
        stock: item.product.stock,
      },
      quantity: item.quantity,
      totalPrice: Number(item.product.price) * item.quantity,
    };
  }
}
