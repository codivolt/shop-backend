import { AddressesService } from './addresses.service';

describe('AddressesService', () => {
  const addressesRepository: any = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const service = new AddressesService(addressesRepository);

  beforeEach(() => jest.clearAllMocks());

  it('findById returns the address when found', async () => {
    const address = { id: 'a1', userId: 'u1' };
    addressesRepository.findOne.mockResolvedValue(address);
    await expect(service.findById('a1')).resolves.toEqual(address);
  });

  it('findById returns null when missing', async () => {
    addressesRepository.findOne.mockResolvedValue(null);
    await expect(service.findById('x')).resolves.toBeNull();
  });
});