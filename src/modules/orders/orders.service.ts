import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository, SelectQueryBuilder } from 'typeorm';
import * as crypto from 'crypto';
import { Order, OrderStatus, PaymentStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { ReceiptHistory, ReceiptHistoryStatus } from './receipt-history.entity';
import { Address } from '../addresses/address.entity';
import { Product } from '../products/product.entity';
import {
  CreateOrderDto,
  OrderQueryDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  CourierDeliverDto,
  AssignCourierDto,
} from './dto/order.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

import { DeliveryService } from '../delivery/delivery.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(ReceiptHistory)
    private readonly receiptHistoryRepository: Repository<ReceiptHistory>,
    private readonly notificationsService: NotificationsService,
    private readonly deliveryService: DeliveryService,
  ) {}

  private generateOrderCode(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(6).toString('hex').toUpperCase();
    return `ORD-${year}${month}${day}-${random}`;
  }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const created = await this.dataSource.transaction(async (manager) => {
      const address = await manager.findOne(Address, {
        where: { id: createOrderDto.addressId, userId },
      });

      if (!address) {
        throw new NotFoundException('آدرس یافت نشد');
      }

      const orderCode = this.generateOrderCode();
      const customerAddress = [
        address.addressLine,
        address.city,
        address.province,
        address.postalCode,
      ]
        .filter(Boolean)
        .join('، ');
      const order = manager.create(Order, {
        userId,
        addressId: createOrderDto.addressId,
        totalAmount: 0,
        orderCode,
        customerName: address.recipientName ?? null,
        customerPhone: address.phone ?? null,
        customerAddress: customerAddress || null,
      });
      const savedOrder = await manager.save(order);

      const items: OrderItem[] = [];
      let totalAmount = 0;

      for (const itemDto of createOrderDto.items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException('محصول سفارش یافت نشد');
        }
        if (!product.isActive) {
          throw new BadRequestException(`محصول «${product.name}» غیرفعال است`);
        }
        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(
            `موجودی محصول «${product.name}» کافی نیست`,
          );
        }

        const unitPrice = Number(product.price);
        const productName = product.name;
        product.stock -= itemDto.quantity;
        await manager.save(product);

        const totalPrice = unitPrice * itemDto.quantity;
        totalAmount += totalPrice;

        items.push(
          manager.create(OrderItem, {
            orderId: savedOrder.id,
            productId: itemDto.productId,
            productNameSnapshot: productName,
            unitPrice,
            quantity: itemDto.quantity,
            totalPrice,
          }),
        );
      }

      await manager.save(items);

      let deliveryPrice = 0;
      let deliveryMethodId: string | null = null;

      if (createOrderDto.deliveryMethodId) {
        const deliveryMethod = await this.deliveryService.findOne(
          createOrderDto.deliveryMethodId,
        );
        if (!deliveryMethod.isActive) {
          throw new BadRequestException('روش ارسال انتخاب شده غیرفعال است');
        }
        deliveryMethodId = deliveryMethod.id;
        deliveryPrice = Number(deliveryMethod.price);
      }

      savedOrder.totalAmount = totalAmount + deliveryPrice;
      savedOrder.deliveryMethodId = deliveryMethodId;
      savedOrder.deliveryPrice = deliveryPrice;
      if (createOrderDto.paymentMethod) {
        savedOrder.paymentMethod = createOrderDto.paymentMethod;
      }
      await manager.save(savedOrder);

      const created = await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: { items: true },
      });

      if (!created) {
        throw new NotFoundException('سفارش ایجاد نشد');
      }

      return created;
    });

    await this.notificationsService.create({
      type: 'new_order',
      message: `سفارش جدید ثبت شد (${created.id.slice(0, 8).toUpperCase()})`,
      orderId: created.id,
      read: false,
    });

    return created;
  }

  findById(id: string): Promise<Order | null> {
    return this.ordersRepository.findOne({
      where: { id },
      relations: { items: true, receiptHistory: true, user: true },
      order: { receiptHistory: { createdAt: 'DESC' } },
    });
  }

  findByIdAndUser(id: string, userId: string): Promise<Order | null> {
    return this.ordersRepository.findOne({
      where: { id, userId },
      relations: { items: true, receiptHistory: true, user: true },
      order: { receiptHistory: { createdAt: 'DESC' } },
    });
  }

  async findAllByUser(
    userId: string,
    query: OrderQueryDto,
  ): Promise<PaginatedResponse<Order>> {
    return this.paginate({ ...query, userId });
  }

  async findAllAdmin(query: OrderQueryDto): Promise<PaginatedResponse<Order>> {
    return this.paginate(query);
  }

  async updateStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    order.status = updateOrderStatusDto.status;
    return this.ordersRepository.save(order);
  }

  async updatePaymentStatus(
    id: string,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    order.paymentStatus = updatePaymentStatusDto.paymentStatus;

    if (updatePaymentStatusDto.paymentStatus === PaymentStatus.UNPAID) {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      order.rejectionReason = updatePaymentStatusDto.rejectionReason ?? null;
      order.receiptDeadline = deadline;
      await this.rejectPendingReceipt(
        order,
        updatePaymentStatusDto.rejectionReason ?? null,
      );
    } else {
      order.rejectionReason = null;
      order.receiptDeadline = null;
      await this.approvePendingReceipt(order.id);
    }

    return this.ordersRepository.save(order);
  }

  private findLatestReceiptHistory(
    orderId: string,
  ): Promise<ReceiptHistory | null> {
    return this.receiptHistoryRepository.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Reject the newest pending receipt, or record the rejection when none is pending. */
  private async rejectPendingReceipt(
    order: Order,
    rejectionReason: string | null,
  ): Promise<void> {
    const latest = await this.findLatestReceiptHistory(order.id);

    if (latest && latest.status === ReceiptHistoryStatus.PENDING) {
      latest.status = ReceiptHistoryStatus.REJECTED;
      latest.rejectionReason = rejectionReason;
      latest.reviewedAt = new Date();
      await this.receiptHistoryRepository.save(latest);
      return;
    }

    const history = this.receiptHistoryRepository.create({
      orderId: order.id,
      receiptImageUrl: order.receiptImageUrl,
      status: ReceiptHistoryStatus.REJECTED,
      rejectionReason,
      reviewedAt: new Date(),
    });
    await this.receiptHistoryRepository.save(history);
  }

  private async approvePendingReceipt(orderId: string): Promise<void> {
    const latest = await this.findLatestReceiptHistory(orderId);
    if (!latest || latest.status !== ReceiptHistoryStatus.PENDING) return;

    latest.status = ReceiptHistoryStatus.APPROVED;
    latest.reviewedAt = new Date();
    await this.receiptHistoryRepository.save(latest);
  }

  async updateReceipt(id: string, receiptImageUrl: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    order.receiptImageUrl = receiptImageUrl;
    order.paymentStatus = PaymentStatus.UNPAID;
    order.rejectionReason = null;
    order.receiptDeadline = null;

    const history = this.receiptHistoryRepository.create({
      orderId: order.id,
      receiptImageUrl,
      status: ReceiptHistoryStatus.PENDING,
    });
    await this.receiptHistoryRepository.save(history);

    return this.ordersRepository.save(order);
  }

  async remove(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, { where: { id } });
      if (!order) {
        throw new NotFoundException('سفارش یافت نشد');
      }

      await manager.delete(OrderItem, { orderId: id });
      await manager.delete(Order, { id });
    });
  }

  private async paginate(
    query: OrderQueryDto,
  ): Promise<PaginatedResponse<Order>> {
    const pagination = resolvePagination(query);
    const qb = this.buildListQuery(query, pagination.skip, pagination.limit);
    const [data, total] = await qb.getManyAndCount();

    return buildPaginatedResponse(data, total, pagination);
  }

  private buildListQuery(
    query: OrderQueryDto,
    skip: number,
    limit: number,
  ): SelectQueryBuilder<Order> {
    const qb = this.ordersRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'item')
      .leftJoinAndSelect('o.user', 'user');

    if (query.userId) {
      qb.andWhere('o.userId = :userId', { userId: query.userId });
    }
    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status });
    }
    if (query.paymentStatus) {
      qb.andWhere('o.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }

    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        '(o.id LIKE :search OR o.orderCode LIKE :search OR o.customerName LIKE :search OR o.customerPhone LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search OR user.phone LIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.orderBy('o.createdAt', 'DESC').skip(skip).take(limit);
  }

  async findByOrderCode(orderCode: string): Promise<Order | null> {
    return this.ordersRepository.findOne({
      where: { orderCode },
      relations: { items: true },
    });
  }

  async searchById(term: string, limit: number): Promise<Order[]> {
    return this.ordersRepository
      .createQueryBuilder('o')
      .select(['o.id', 'o.orderCode', 'o.status', 'o.createdAt'])
      .where('o.id LIKE :term OR o.orderCode LIKE :term', { term: `${term}%` })
      .orderBy('o.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async assignCourier(id: string, dto: AssignCourierDto): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }
    order.courierId = dto.courierId;
    return this.ordersRepository.save(order);
  }

  async markAsDeliveredByCourier(
    courierDeliverDto: CourierDeliverDto,
    courierId: string,
  ): Promise<Order> {
    const order = await this.findByOrderCode(courierDeliverDto.orderCode);
    if (!order) {
      throw new NotFoundException('سفارش با این کد یافت نشد');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('این سفارش قبلاً تحویل داده شده است');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('این سفارش لغو شده است');
    }

    if (!order.courierId || order.courierId !== courierId) {
      throw new ForbiddenException('این سفارش به شما تخصیص داده نشده است');
    }

    if (
      order.status !== OrderStatus.SHIPPED ||
      order.paymentStatus !== PaymentStatus.PAID
    ) {
      throw new BadRequestException('سفارش قابل تحویل نیست');
    }

    order.status = OrderStatus.DELIVERED;
    return this.ordersRepository.save(order);
  }

  async ownsReceipt(userId: string, filename: string): Promise<boolean> {
    const order = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .andWhere(
        '(order.receiptImageUrl LIKE :file OR EXISTS (SELECT 1 FROM receipt_history rh WHERE rh.orderId = order.id AND rh.receiptImageUrl LIKE :file))',
        {
          file: '%' + filename,
        },
      )
      .getOne();
    return Boolean(order);
  }

  async expireOverdueReceiptOrders(): Promise<Order[]> {
    const now = new Date();
    const overdueOrders = await this.ordersRepository.find({
      where: {
        paymentStatus: PaymentStatus.UNPAID,
        receiptDeadline: LessThan(now),
        status: OrderStatus.PENDING,
      },
    });

    const results: Order[] = [];
    for (const order of overdueOrders) {
      order.status = OrderStatus.FAILED;
      results.push(await this.ordersRepository.save(order));
    }

    return results;
  }

  async getReceiptHistory(orderId: string): Promise<ReceiptHistory[]> {
    return this.receiptHistoryRepository.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }
}
