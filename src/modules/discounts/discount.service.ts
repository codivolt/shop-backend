import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { DiscountCode, DiscountStatus, DiscountType } from './discount-code.entity';
import { CreateDiscountCodeDto, UpdateDiscountCodeDto, ValidateDiscountCodeDto, DiscountCodeQueryDto } from './dto/discount-code.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(DiscountCode)
    private discountRepository: Repository<DiscountCode>,
  ) {}

  async create(dto: CreateDiscountCodeDto): Promise<DiscountCode> {
    const existing = await this.discountRepository.findOne({ where: { code: dto.code.toUpperCase() } });
    if (existing) {
      throw new BadRequestException('این کد تخفیف قبلاً وجود دارد');
    }

    const discount = this.discountRepository.create({
      ...dto,
      code: dto.code.toUpperCase(),
      status: dto.isActive !== false ? DiscountStatus.ACTIVE : DiscountStatus.INACTIVE,
    });

    return this.discountRepository.save(discount);
  }

  async findAll(query: DiscountCodeQueryDto): Promise<PaginatedResponse<DiscountCode>> {
    const pagination = resolvePagination(query);
    const search = query.search?.trim();

    const where: FindOptionsWhere<DiscountCode>[] | FindOptionsWhere<DiscountCode> = search
      ? [
          { code: Like(`%${search.toUpperCase()}%`) },
          { description: Like(`%${search}%`) },
        ]
      : {};

    if (query.status) {
      if (Array.isArray(where)) {
        where.forEach(w => { w.status = query.status; });
      } else {
        where.status = query.status;
      }
    }

    const [data, total] = await this.discountRepository.findAndCount({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      order: { createdAt: 'DESC' },
    });

    return buildPaginatedResponse(data, total, pagination);
  }

  async findById(id: string): Promise<DiscountCode> {
    const discount = await this.discountRepository.findOne({ where: { id } });
    if (!discount) {
      throw new NotFoundException('کد تخفیف یافت نشد');
    }
    return discount;
  }

  async findByCode(code: string): Promise<DiscountCode | null> {
    return this.discountRepository.findOne({ where: { code: code.toUpperCase() } });
  }

  async update(id: string, dto: UpdateDiscountCodeDto): Promise<DiscountCode> {
    const discount = await this.findById(id);

    Object.assign(discount, dto);
    return this.discountRepository.save(discount);
  }

  async delete(id: string): Promise<void> {
    const discount = await this.findById(id);
    await this.discountRepository.remove(discount);
  }

  async validate(dto: ValidateDiscountCodeDto): Promise<{ valid: boolean; discount?: DiscountCode; discountAmount: number; message?: string }> {
    const discount = await this.findByCode(dto.code);

    if (!discount) {
      return { valid: false, discountAmount: 0, message: 'کد تخفیف معتبر نیست' };
    }

    // Check status
    if (discount.status !== DiscountStatus.ACTIVE || !discount.isActive) {
      return { valid: false, discountAmount: 0, message: 'کد تخفیف غیرفعال است' };
    }

    // Check expiration
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      discount.status = DiscountStatus.EXPIRED;
      await this.discountRepository.save(discount);
      return { valid: false, discountAmount: 0, message: 'کد تخفیف منقضی شده است' };
    }

    // Check usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      discount.status = DiscountStatus.USED_UP;
      await this.discountRepository.save(discount);
      return { valid: false, discountAmount: 0, message: 'محدودیت استفاده از کد تخفیف تمام شده است' };
    }

    // Check minimum order amount
    if (discount.minOrderAmount && dto.orderAmount < discount.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `حداقل مبلغ سفارش برای استفاده از این کد ${discount.minOrderAmount.toLocaleString()} تومان است`,
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === DiscountType.PERCENT) {
      discountAmount = Math.floor((dto.orderAmount * discount.value) / 100);
      if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
        discountAmount = discount.maxDiscountAmount;
      }
    } else {
      discountAmount = discount.value;
    }

    // Discount cannot exceed order amount
    if (discountAmount > dto.orderAmount) {
      discountAmount = dto.orderAmount;
    }

    return { valid: true, discount, discountAmount };
  }

  async incrementUsage(id: string): Promise<void> {
    await this.discountRepository.increment({ id }, 'usedCount', 1);
    
    // Check if usage limit reached
    const discount = await this.findById(id);
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      discount.status = DiscountStatus.USED_UP;
      await this.discountRepository.save(discount);
    }
  }

  async checkUserUsage(code: string, userId: string): Promise<number> {
    // This would require a separate table to track user usage
    // For now, return 0 (would need DiscountUsage entity)
    return 0;
  }
}