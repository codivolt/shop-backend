import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentAccountController } from './payment-account.controller';
import { PaymentAccountService } from './payment-account.service';
import { PaymentAccount } from './payment-account.entity';
import { CreatePaymentAccountDto, UpdatePaymentAccountDto } from './dto/payment-account.dto';
import { createTestPaymentAccount, createTestUser } from '../../../test/utils/test-factories';

describe('PaymentAccountController', () => {
  let controller: PaymentAccountController;
  let paymentAccountService: jest.Mocked<Partial<PaymentAccountService>>;

  const mockUser = createTestUser();
  const mockPaymentAccount = createTestPaymentAccount({ userId: mockUser.id });

  beforeEach(async () => {
    paymentAccountService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      setDefault: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentAccountController],
      providers: [
        { provide: PaymentAccountService, useValue: paymentAccountService },
      ],
    }).compile();

    controller = module.get<PaymentAccountController>(PaymentAccountController);
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

    it('should create payment account and return it', async () => {
      const newAccount = createTestPaymentAccount({ ...createDto, userId: mockUser.id });
      paymentAccountService.create.mockResolvedValue(newAccount);

      const result = await controller.create(createDto, mockUser);

      expect(paymentAccountService.create).toHaveBeenCalledWith(mockUser.id, createDto);
      expect(result).toEqual(newAccount);
    });
  });

  describe('findAll', () => {
    it('should return user payment accounts', async () => {
      const accounts = [mockPaymentAccount];
      paymentAccountService.findAll.mockResolvedValue(accounts);

      const result = await controller.findAll(mockUser);

      expect(paymentAccountService.findAll).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(accounts);
    });
  });

  describe('findOne', () => {
    it('should return payment account by id', async () => {
      paymentAccountService.findOne.mockResolvedValue(mockPaymentAccount);

      const result = await controller.findOne(mockPaymentAccount.id, mockUser);

      expect(paymentAccountService.findOne).toHaveBeenCalledWith(mockUser.id, mockPaymentAccount.id);
      expect(result).toEqual(mockPaymentAccount);
    });

    it('should throw NotFoundException if not found', async () => {
      paymentAccountService.findOne.mockRejectedValue(new NotFoundException('حساب پرداخت یافت نشد'));

      await expect(controller.findOne('nonexistent', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdatePaymentAccountDto = {
      accountName: 'Updated Card',
      isDefault: true,
    };

    it('should update payment account and return it', async () => {
      const updatedAccount = { ...mockPaymentAccount, ...updateDto };
      paymentAccountService.update.mockResolvedValue(updatedAccount);

      const result = await controller.update(mockPaymentAccount.id, updateDto, mockUser);

      expect(paymentAccountService.update).toHaveBeenCalledWith(mockUser.id, mockPaymentAccount.id, updateDto);
      expect(result).toEqual(updatedAccount);
    });

    it('should throw NotFoundException if not found', async () => {
      paymentAccountService.update.mockRejectedValue(new NotFoundException('حساب پرداخت یافت نشد'));

      await expect(controller.update('nonexistent', updateDto, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDefault', () => {
    it('should set payment account as default', async () => {
      const updatedAccount = { ...mockPaymentAccount, isDefault: true };
      paymentAccountService.setDefault.mockResolvedValue(updatedAccount);

      const result = await controller.setDefault(mockPaymentAccount.id, mockUser);

      expect(paymentAccountService.setDefault).toHaveBeenCalledWith(mockUser.id, mockPaymentAccount.id);
      expect(result).toEqual(updatedAccount);
    });
  });

  describe('remove', () => {
    it('should delete payment account and return success message', async () => {
      paymentAccountService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockPaymentAccount.id, mockUser);

      expect(paymentAccountService.remove).toHaveBeenCalledWith(mockUser.id, mockPaymentAccount.id);
      expect(result).toEqual({ message: 'حساب پرداخت با موفقیت حذف شد' });
    });

    it('should throw NotFoundException if not found', async () => {
      paymentAccountService.remove.mockRejectedValue(new NotFoundException('حساب پرداخت یافت نشد'));

      await expect(controller.remove('nonexistent', mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});