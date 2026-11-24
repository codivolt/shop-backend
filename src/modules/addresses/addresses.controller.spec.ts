import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { Address } from './address.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import {
  createTestAddress,
  createTestUser,
} from '../../../test/utils/test-factories';

describe('AddressesController', () => {
  let controller: AddressesController;
  let addressesService: jest.Mocked<Partial<AddressesService>>;

  const mockUser = createTestUser();
  const mockAddress = createTestAddress({ userId: mockUser.id });

  beforeEach(async () => {
    addressesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      setDefault: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [{ provide: AddressesService, useValue: addressesService }],
    }).compile();

    controller = module.get<AddressesController>(AddressesController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateAddressDto = {
      firstName: 'New',
      lastName: 'Address',
      phone: '09121112233',
      province: 'Tehran',
      city: 'Tehran',
      address: 'New Address, Street 1',
      postalCode: '1234567890',
      isDefault: false,
    };

    it('should create address and return it', async () => {
      const newAddress = createTestAddress({
        ...createDto,
        userId: mockUser.id,
      });
      addressesService.create.mockResolvedValue(newAddress);

      const result = await controller.create(createDto, mockUser);

      expect(addressesService.create).toHaveBeenCalledWith(
        mockUser.id,
        createDto,
      );
      expect(result).toEqual(newAddress);
    });
  });

  describe('findAll', () => {
    it('should return user addresses', async () => {
      const addresses = [mockAddress];
      addressesService.findAll.mockResolvedValue(addresses);

      const result = await controller.findAll(mockUser);

      expect(addressesService.findAll).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(addresses);
    });
  });

  describe('findOne', () => {
    it('should return address by id', async () => {
      addressesService.findOne.mockResolvedValue(mockAddress);

      const result = await controller.findOne(mockAddress.id, mockUser);

      expect(addressesService.findOne).toHaveBeenCalledWith(
        mockUser.id,
        mockAddress.id,
      );
      expect(result).toEqual(mockAddress);
    });

    it('should throw NotFoundException if not found', async () => {
      addressesService.findOne.mockRejectedValue(
        new NotFoundException('آدرس یافت نشد'),
      );

      await expect(controller.findOne('nonexistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateAddressDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update address and return it', async () => {
      const updatedAddress = { ...mockAddress, ...updateDto };
      addressesService.update.mockResolvedValue(updatedAddress);

      const result = await controller.update(
        mockAddress.id,
        updateDto,
        mockUser,
      );

      expect(addressesService.update).toHaveBeenCalledWith(
        mockUser.id,
        mockAddress.id,
        updateDto,
      );
      expect(result).toEqual(updatedAddress);
    });

    it('should throw NotFoundException if address not found', async () => {
      addressesService.update.mockRejectedValue(
        new NotFoundException('آدرس یافت نشد'),
      );

      await expect(
        controller.update('nonexistent', updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDefault', () => {
    it('should set address as default', async () => {
      const updatedAddress = { ...mockAddress, isDefault: true };
      addressesService.setDefault.mockResolvedValue(updatedAddress);

      const result = await controller.setDefault(mockAddress.id, mockUser);

      expect(addressesService.setDefault).toHaveBeenCalledWith(
        mockUser.id,
        mockAddress.id,
      );
      expect(result).toEqual(updatedAddress);
    });
  });

  describe('remove', () => {
    it('should delete address and return success message', async () => {
      addressesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockAddress.id, mockUser);

      expect(addressesService.remove).toHaveBeenCalledWith(
        mockUser.id,
        mockAddress.id,
      );
      expect(result).toEqual({ message: 'آدرس با موفقیت حذف شد' });
    });

    it('should throw NotFoundException if address not found', async () => {
      addressesService.remove.mockRejectedValue(
        new NotFoundException('آدرس یافت نشد'),
      );

      await expect(controller.remove('nonexistent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
