import { DiscountService } from './discount.service';

describe('DiscountService', () => {
  const discountRepository: any = { findOne: jest.fn() };
  const service = new DiscountService(discountRepository);

  beforeEach(() => jest.clearAllMocks());

  it('findById returns the discount when found', async () => {
    const discount = { id: 'd1', code: 'SALE' };
    discountRepository.findOne.mockResolvedValue(discount);
    await expect(service.findById('d1')).resolves.toEqual(discount);
  });

  it('findByCode returns null when missing', async () => {
    discountRepository.findOne.mockResolvedValue(null);
    await expect(service.findByCode('NOPE')).resolves.toBeNull();
  });
});