import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import {
  PaginatedResponse,
  PaginationDto,
} from '../../common/dto/pagination.dto';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>,
  ) {}

  async create(
    userId: string,
    createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    const existingCount = await this.addressesRepository.count({
      where: { userId },
    });

    if (createAddressDto.isDefault || existingCount === 0) {
      await this.addressesRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const address = this.addressesRepository.create({
      ...createAddressDto,
      userId,
      isDefault: createAddressDto.isDefault ?? existingCount === 0,
    });

    return this.addressesRepository.save(address);
  }

  async findAllByUser(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<Address>> {
    const pagination = resolvePagination(paginationDto);

    const [data, total] = await this.addressesRepository.findAndCount({
      where: { userId },
      skip: pagination.skip,
      take: pagination.limit,
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    return buildPaginatedResponse(data, total, pagination);
  }

  async findById(id: string): Promise<Address | null> {
    return this.addressesRepository.findOne({ where: { id } });
  }

  async findByIdAndUser(id: string, userId: string): Promise<Address | null> {
    return this.addressesRepository.findOne({ where: { id, userId } });
  }

  async update(
    id: string,
    userId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.findByIdAndUser(id, userId);
    if (!address) {
      throw new NotFoundException('آدرس یافت نشد');
    }

    if (updateAddressDto.isDefault) {
      await this.addressesRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    this.addressesRepository.merge(address, updateAddressDto);
    return this.addressesRepository.save(address);
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findByIdAndUser(id, userId);
    if (!address) {
      throw new NotFoundException('آدرس یافت نشد');
    }

    const result = await this.addressesRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException('آدرس یافت نشد');
    }
  }

  async setDefault(id: string, userId: string): Promise<Address> {
    const address = await this.findByIdAndUser(id, userId);
    if (!address) {
      throw new NotFoundException('آدرس یافت نشد');
    }

    await this.addressesRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
    address.isDefault = true;
    return this.addressesRepository.save(address);
  }
}
