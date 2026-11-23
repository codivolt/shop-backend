import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressesService } from './addresses.service';
import { Address } from './address.entity';
import { User } from '../users/users.entity';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { createMockRepository } from '../../../test/utils/mock-helpers';
import { createTestAddress, createTestUser } from '../../../test/utils/test-factories';

describe('AddressesService', () => {
  let service: AddressesService;
  let addressRepository: jest.Mocked<Partial<Repository<Address>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  const mockUser = createTestUser();
  const mockAddress = createTestAddress({ userId: mockUser.id });

  beforeEach(async () => {
    addressRepository = createMockRepository<Address>();
    userRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: getRepositoryToken(Address), useValue: addressRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
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

    it('should create a new address successfully', async () => {
      const newAddress = createTestAddress({ ...createDto, userId: mockUser.id });
      addressRepository.save.mockResolvedValue(newAddress as any);

      const result = await service.create(mockUser.id, createDto);

      expect(addressRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUser.id,
        ...createDto,
      }));
      expect(result).toMatchObject(createDto);
    });

    it('should set as default if first address', async () => {
      addressRepository.find.mockResolvedValue([]);
      addressRepository.save.mockResolvedValue({ ...mockAddress, isDefault: true } as any);

      const result = await service.create(mockUser.id, { ...createDto, isDefault: false });

      expect(result.isDefault).toBe(true);
    });

    it('should unset previous default if new address is default', async () => {
      const existingDefault = createTestAddress({ userId: mockUser.id, isDefault: true });
      addressRepository.find.mockResolvedValue([existingDefault]);
      addressRepository.save.mockResolvedValue({ ...mockAddress, isDefault: true } as any);

      const result = await service.create(mockUser.id, { ...createDto, isDefault: true });

      expect(addressRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isDefault: true }));
    });
  });

  describe('findAll', () => {
    it('should return user addresses', async () => {
      const addresses = [mockAddress, createTestAddress({ userId: mockUser.id, isDefault: false })];
      addressRepository.find.mockResolvedValue(addresses);

      const result = await service.findAll(mockUser.id);

      expect(addressRepository.find).toHaveBeenCalledWith({ where: { userId: mockUser.id }, order: { isDefault: 'DESC', createdAt: 'DESC' } });
      expect(result).toEqual(addresses);
    });
  });

  describe('findOne', () => {
    it('should return address by id', async () => {
      addressRepository.findOne.mockResolvedValue(mockAddress);

      const result = await service.findOne(mockUser.id, mockAddress.id);

      expect(addressRepository.findOne).toHaveBeenCalledWith({ where: { id: mockAddress.id, userId: mockUser.id } });
      expect(result).toEqual(mockAddress);
    });

    it('should throw NotFoundException if not found', async () => {
      addressRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUser.id, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateAddressDto = {
      firstName: 'Updated',
      lastName: 'Name',
      isDefault: true,
    };

    it('should update address successfully', async () => {
      const updatedAddress = { ...mockAddress, ...updateDto };
      addressRepository.findOne.mockResolvedValue(mockAddress);
      addressRepository.save.mockResolvedValue(updatedAddress as any);

      const result = await service.update(mockUser.id, mockAddress.id, updateDto);

      expect(addressRepository.findOne).toHaveBeenCalledWith({ where: { id: mockAddress.id, userId: mockUser.id } });
      expect(addressRepository.merge).toHaveBeenCalled();
      expect(result.firstName).toBe('Updated');
    });

    it('should throw NotFoundException if address not found', async () => {
      addressRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUser.id, 'nonexistent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should unset other defaults if this address becomes default', async () => {
      const otherDefault = createTestAddress({ userId: mockUser.id, isDefault: true, id: 'other-id' });
      addressRepository.findOne.mockResolvedValue(mockAddress);
      addressRepository.find.mockResolvedValue([otherDefault]);
      addressRepository.save.mockResolvedValue({ ...mockAddress, isDefault: true } as any);

      const result = await service.update(mockUser.id, mockAddress.id, { isDefault: true });

      expect(addressRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isDefault: false }));
    });
  });

  describe('setDefault', () => {
    it('should set address as default', async () => {
      addressRepository.findOne.mockResolvedValue(mockAddress);
      addressRepository.save.mockResolvedValue({ ...mockAddress, isDefault: true } as any);

      const result = await service.setDefault(mockUser.id, mockAddress.id);

      expect(result.isDefault).toBe(true);
    });

    it('should throw NotFoundException if address not found', async () => {
      addressRepository.findOne.mockResolvedValue(null);

      await expect(service.setDefault(mockUser.id, 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove address successfully', async () => {
      addressRepository.findOne.mockResolvedValue(mockAddress);
      addressRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(mockUser.id, mockAddress.id);

      expect(addressRepository.delete).toHaveBeenCalledWith({ id: mockAddress.id, userId: mockUser.id });
    });

    it('should throw NotFoundException if address not found', async () => {
      addressRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUser.id, 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should set another address as default if deleted was default', async () => {
      const otherAddress = createTestAddress({ userId: mockUser.id, isDefault: false, id: 'other-id' });
      const defaultAddress = createTestAddress({ userId: mockUser.id, isDefault: true });
      addressRepository.findOne.mockResolvedValue(defaultAddress);
      addressRepository.find.mockResolvedValue([otherAddress]);
      addressRepository.delete.mockResolvedValue({ affected: 1, raw: {} });
      addressRepository.save.mockResolvedValue({ ...otherAddress, isDefault: true } as any);

      await service.remove(mockUser.id, defaultAddress.id);

      expect(addressRepository.save).toHaveBeenCalledWith(expect.objectContaining({ isDefault: true }));
    });
  });
});