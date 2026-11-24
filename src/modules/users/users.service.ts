import {
  BadRequestException,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { User, UserRole } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { ChangePasswordDto, UpdateProfileDto } from './dto/update-profile.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    currentUserRole: UserRole,
  ): Promise<User> {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('ایمیل قبلاً ثبت شده است');
    }

    if (
      createUserDto.role === UserRole.SUPER_ADMIN &&
      currentUserRole !== UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException(
        'فقط مدیر فوق العاده می‌تواند نقش مدیر فوق العاده تخصیص دهد',
      );
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      role: createUserDto.role ?? UserRole.CUSTOMER,
      passwordSetAt: new Date(),
    });

    return this.stripPassword(await this.usersRepository.save(user));
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByPhoneWithPassword(phone: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.phone = :phone', { phone })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: { permissions: { permission: true } },
    });
  }

  async findAll(query: UserQueryDto): Promise<PaginatedResponse<User>> {
    const pagination = resolvePagination(query);
    const search = query.search?.trim();

    const baseWhere: FindOptionsWhere<User> = {};
    if (query.role) {
      baseWhere.role = query.role;
    }
    if (query.isActive !== undefined) {
      baseWhere.isActive = query.isActive;
    }

    const where: FindOptionsWhere<User>[] | FindOptionsWhere<User> = search
      ? [
          { ...baseWhere, email: Like(`%${search}%`) },
          { ...baseWhere, firstName: Like(`%${search}%`) },
          { ...baseWhere, lastName: Like(`%${search}%`) },
          { ...baseWhere, phone: Like(`%${search}%`) },
        ]
      : baseWhere;

    const [data, total] = await this.usersRepository.findAndCount({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      order: { createdAt: 'DESC' },
    });

    return buildPaginatedResponse(data, total, pagination);
  }

  async search(term: string, limit: number): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.firstName',
        'u.lastName',
        'u.email',
        'u.role',
        'u.phone',
      ])
      .where(
        'u.email LIKE :term OR u.firstName LIKE :term OR u.lastName LIKE :term OR u.phone LIKE :term',
        { term: `${term}%` },
      )
      .orderBy('u.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async update(
    id: string,
    data: Partial<User>,
    currentUserRole: UserRole,
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    if (
      data.role === UserRole.SUPER_ADMIN &&
      currentUserRole !== UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException(
        'فقط مدیر فوق العاده می‌تواند نقش مدیر فوق العاده تخصیص دهد',
      );
    }

    this.usersRepository.merge(user, data);
    return this.stripPassword(await this.usersRepository.save(user));
  }

  async updateProfile(id: string, data: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    if (data.phone && data.phone !== user.phone) {
      const phoneOwner = await this.findByPhone(data.phone);
      if (phoneOwner && phoneOwner.id !== id) {
        throw new ConflictException('این شماره موبایل قبلاً ثبت شده است');
      }

      if (!user.phone || user.email === `${user.phone}@phone.local`) {
        user.email = `${data.phone}@phone.local`;
      }
    }

    if (data.nationalId && data.nationalId !== user.nationalId) {
      this.assertValidNationalId(data.nationalId);

      const nationalIdOwner = await this.usersRepository.findOne({
        where: { nationalId: data.nationalId },
      });
      if (nationalIdOwner && nationalIdOwner.id !== id) {
        throw new ConflictException('این کد ملی قبلاً ثبت شده است');
      }
    }

    this.usersRepository.merge(user, data);
    return this.stripPassword(await this.usersRepository.save(user));
  }

  private assertValidNationalId(value: string): void {
    if (!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value)) {
      throw new BadRequestException('کد ملی معتبر نیست');
    }

    const check = Number(value[9]);
    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
      sum += Number(value[i]) * (10 - i);
    }
    const remainder = sum % 11;
    const expected = remainder < 2 ? remainder : 11 - remainder;

    if (check !== expected) {
      throw new BadRequestException('کد ملی معتبر نیست');
    }
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    if (user.passwordSetAt) {
      if (!dto.currentPassword) {
        throw new BadRequestException('رمز عبور فعلی را وارد کنید');
      }
      const isValid = await user.validatePassword(dto.currentPassword);
      if (!isValid) {
        throw new BadRequestException('رمز عبور فعلی اشتباه است');
      }
    }

    user.password = dto.newPassword;
    user.passwordSetAt = new Date();
    await this.usersRepository.save(user);
  }

  async markPasswordNotSet(id: string): Promise<void> {
    await this.usersRepository.update(id, { passwordSetAt: null });
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('کاربر یافت نشد');
    }
  }

  async applyReferralCode(userId: string, referralCode: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    if (user.referredBy) {
      throw new BadRequestException('کد رفرال قبلاً برای این حساب ثبت شده است');
    }

    if (user.referralCode === referralCode) {
      throw new BadRequestException('نمی‌توانید کد رفرال خود را استفاده کنید');
    }

    const referrer = await this.usersRepository.findOne({
      where: { referralCode },
    });
    if (!referrer) {
      throw new BadRequestException('کد رفرال معتبر نیست');
    }

    if (referrer.id === userId) {
      throw new BadRequestException('نمی‌توانید کد رفرال خود را استفاده کنید');
    }

    user.referredBy = referrer.id;
    await this.usersRepository.save(user);
  }

  private stripPassword(user: User): User {
    delete (user as Partial<User>).password;
    return user;
  }
}
