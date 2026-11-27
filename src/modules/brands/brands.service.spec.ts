import { BrandsService } from './brands.service';

describe('BrandsService', () => {
  const brandsRepository: any = { findOne: jest.fn() };
  const service = new BrandsService(brandsRepository);

  beforeEach(() => jest.clearAllMocks());

  it('findOne returns the brand when found', async () => {
    const brand = { id: 'b1', name: 'Brand' };
    brandsRepository.findOne.mockResolvedValue(brand);
    await expect(service.findOne('b1')).resolves.toEqual(brand);
  });

  it('findOne throws when not found', async () => {
    brandsRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeTruthy();
  });
});