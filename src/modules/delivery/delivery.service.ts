import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryMethod } from './delivery-method.entity';
import {
  CreateDeliveryMethodDto,
  UpdateDeliveryMethodDto,
  DeliveryMethodResponse,
} from './dto/delivery-method.dto';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(DeliveryMethod)
    private readonly deliveryRepository: Repository<DeliveryMethod>,
  ) {}

  async findAll(): Promise<DeliveryMethod[]> {
    return this.deliveryRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAllActive(): Promise<DeliveryMethod[]> {
    return this.deliveryRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DeliveryMethod> {
    const delivery = await this.deliveryRepository.findOneBy({ id });
    if (!delivery) {
      throw new NotFoundException('روش ارسال یافت نشد');
    }
    return delivery;
  }

  async create(dto: CreateDeliveryMethodDto): Promise<DeliveryMethodResponse> {
    const existing = await this.deliveryRepository.findOneBy({
      name: dto.name,
    });
    if (existing) {
      throw new BadRequestException('روش ارسال با این نام قبلاً موجود است');
    }

    const delivery = this.deliveryRepository.create({
      name: dto.name,
      price: dto.price,
      description: dto.description ?? null,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.deliveryRepository.save(delivery);
    return this.toResponse(saved);
  }

  async update(
    id: string,
    dto: UpdateDeliveryMethodDto,
  ): Promise<DeliveryMethodResponse> {
    const delivery = await this.findOne(id);

    if (dto.name && dto.name !== delivery.name) {
      const existing = await this.deliveryRepository.findOneBy({
        name: dto.name,
      });
      if (existing) {
        throw new BadRequestException('روش ارسال با این نام قبلاً موجود است');
      }
    }

    Object.assign(delivery, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });

    const saved = await this.deliveryRepository.save(delivery);
    return this.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const delivery = await this.findOne(id);
    await this.deliveryRepository.remove(delivery);
  }

  private toResponse(delivery: DeliveryMethod): DeliveryMethodResponse {
    return {
      id: delivery.id,
      name: delivery.name,
      price: delivery.price,
      description: delivery.description,
      isActive: delivery.isActive,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    };
  }
}
