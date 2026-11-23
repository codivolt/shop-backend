import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentAccountsService } from './payment-account.service';
import { PaymentAccount } from './payment-account.entity';
import { User } from '../users/users.entity';
import { CreatePaymentAccountDto, UpdatePaymentAccountDto } from './dto/payment-account.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import { createTestPaymentAccount, createTestUser } from '../../../test/utils/test-factories';

describe('PaymentAccountsService', () => {
  let service: PaymentAccountsService;
  let paymentAccountRepository: jest.Mocked<Partial<Repository<PaymentAccount>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  const mockUser = createTestUser();
  const mockPaymentAccount = createTestPaymentAccount({ userId: mockUser.id });

  beforeEach(async () => {
    paymentAccountRepository = createMockRepository<PaymentAccount>();
    userRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentAccountsService,
        { provide: getRepositoryToken(PaymentAccount), useValue: paymentAccountRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get<PaymentAccountsService>(PaymentAccountsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreatePaymentAccountDto = {
      type: 'card',
      provider: 'mellat',
      accountNumber: '6037-9912-3456-7890',
      accountName: 'My Card',
      isDefault: false,
    };

    it('should create a new payment account successfully', async () => {
      const newAccount = createTestPaymentAccount({ ...createDto, userId: mockUser.id });
      paymentAccountRepository.save.mockResolvedValue(newAccount as any);

      const result = await service.create(mockUser.id, createDto);

      expect(paymentAccountRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUser.id,
        ...createDto,
      }));
      expect(result).toMatchObject(createDto);
    });

    it('should set as default if first account', async () => {
      paymentAccountRepository.find.mockResolvedValue([]);
      paymentAccountRepository.save.mockResolvedValue({ ...mockPaymentAccount, isDefault: true } as any);

      const result = await service.create(mockUser.id, { ...createDto, isDefault: false });

      expect(result.isDefault).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return user payment accounts', async () => {
      const accounts = [mockPaymentAccount, createTestPaymentAccount({ userId: mockUser.id, isDefault: false })];
      paymentAccountRepository.find.mockResolvedValue(accounts);

      const result = await service.findAll(mockUser.id);

      expect(paymentAccountRepository.find).toHaveBeenCalledWith({ where: { userId: mockUser.id }, order: { isDefault: 'DESC', createdAt: 'DESC' } });
      expect(result).toEqual(accounts);
    });
  });

  describe('findOne', () => {
    it('should return payment account by id', async () => {
      paymentAccountRepository.findOne.mockResolvedValue(mockPaymentAccount);

      const result = await service.findOne(mockUser.id, mockPaymentAccount.id);

      expect(paymentAccountRepository.findOne).toHaveBeenCalledWith({ where: { id: mockPaymentAccount.id, userId: mockUser.id } });
      expect(result).toEqual(mockPaymentAccount);
    });

    it('should throw NotFoundException if not found', async () => {
      paymentAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser.id, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdatePaymentAccountDto = {
      accountName: 'Updated Card',
      isDefault: true,
    };

    it('should update payment account successfully', async () => {
      const updatedAccount = { ...mockPaymentAccount, ...updateDto };
      paymentAccountRepository.findOne.mockResolvedValue(mockPaymentAccount);
      paymentAccountRepository.save.mockResolvedValue(updatedAccount as any);

      const result = await service.update(mockUser.id, mockPaymentAccount.id, updateDto);

      expect(paymentAccountRepository.findOne).toHaveBeenCalledWith({ where: { id: mockPaymentAccount.id, userId: mockUser.id } });
      expect(paymentAccountRepository.merge).toHaveBeenCalled();
      expect(result.accountName).toBe('Updated Card');
    });

    it('should throw NotFoundException if not found', async () => {
      paymentAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUser.id, 'nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should unset other defaults if this becomes default', async () => {
      const otherDefault = createTestPaymentAccount({ userId: mockUser.id, isDefault: true, id: 'other-id' });
      paymentAccountRepository.findOne.mockResolvedValue(mockPaymentAccount);
      paymentAccountRepository.find.mockResolvedValue([otherDefault]);
      paymentAccountRepository.save.mockResolvedValue({ ...mockPaymentAccount, isDefault: true } as any);

      const result = await service.update(mockUser.id, mockPaymentAccount.id, { isDefault: true });

      expect(paymentAccountRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isDefault: false }));
    });
  });

  describe('setDefault', () => {
    it('should set payment account as default', async () => {
      paymentAccountRepository.findOne.mockResolvedValue(mockPaymentAccount);
      paymentAccountRepository.save.mockResolvedValue({ ...mockPaymentAccount, isDefault: true } as any);

      const result = await service.setDefault(mockUser.id, mockPaymentAccount.id);

      expect(result.isDefault).toBe(true);
    });

    it('should throw NotFoundException if not found', async () => {
      paymentAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.setDefault(mockUser.id, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove payment account successfully', async () => {
      paymentAccountRepository.findOne.mockResolvedValue(mockPaymentAccount);
      paymentAccountRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockUser.id, mockPaymentAccount.id);

      expect(paymentAccountRepository.delete).toHaveBeenCalledWith({ id: mockPaymentAccount.id, userId: mockUser.id });
    });

    it('should throw NotFoundException if not found', async () => {
      paymentAccountRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser.id, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should set another account as default if deleted was default', async () => {
      const otherAccount = createTestPaymentAccount({ userId: mockUser.id, isDefault: false, id: 'other-id' });
      const defaultAccount = createTestPaymentAccount({ userId: mockUser.id, isDefault: true });
      paymentAccountRepository.findOne.mockResolvedValue(defaultAccount);
      paymentAccountRepository.find.mockResolvedValue([otherAccount]);
      paymentAccountRepository.delete.mockResolvedValue({ affected: 1, raw: {} });
      paymentAccountRepository.save.mockResolvedValue({ ...otherAccount, isDefault: true } as any);

      await service.remove(mockUser.id, defaultAccount.id);

      expect(paymentAccountRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isDefault: true }));
    });
  });
});