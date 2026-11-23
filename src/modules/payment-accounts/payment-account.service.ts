import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentAccount } from './payment-account.entity';
import {
  CreatePaymentAccountDto,
  UpdatePaymentAccountDto,
  PaymentAccountResponse,
} from './dto/payment-account.dto';

@Injectable()
export class PaymentAccountService {
  constructor(
    @InjectRepository(PaymentAccount)
    private readonly paymentAccountRepository: Repository<PaymentAccount>,
  ) {}

  async findAll(): Promise<PaymentAccount[]> {
    return this.paymentAccountRepository.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findAllActive(): Promise<PaymentAccountResponse[]> {
    const accounts = await this.paymentAccountRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
    return accounts.map((a) => PaymentAccountResponse.fromEntity(a));
  }

  async findOne(id: string): Promise<PaymentAccount> {
    const account = await this.paymentAccountRepository.findOne({
      where: { id },
    });
    if (!account) {
      throw new NotFoundException('حساب پرداخت یافت نشد');
    }
    return account;
  }

  async create(dto: CreatePaymentAccountDto): Promise<PaymentAccountResponse> {
    const account = this.paymentAccountRepository.create(dto);
    const saved = await this.paymentAccountRepository.save(account);
    return PaymentAccountResponse.fromEntity(saved);
  }

  async update(
    id: string,
    dto: UpdatePaymentAccountDto,
  ): Promise<PaymentAccountResponse> {
    const account = await this.findOne(id);
    this.paymentAccountRepository.merge(account, dto);
    const saved = await this.paymentAccountRepository.save(account);
    return PaymentAccountResponse.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const account = await this.findOne(id);
    await this.paymentAccountRepository.remove(account);
  }
}
