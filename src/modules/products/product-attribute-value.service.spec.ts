import { ProductAttributeValueService } from './product-attribute-value.service';

describe('ProductAttributeValueService', () => {
  const valueRepository: any = { findOne: jest.fn() };
  const productsService: any = {};
  const categoriesService: any = {};
  const service = new ProductAttributeValueService(
    valueRepository,
    productsService,
    categoriesService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('findOne returns the value when found', async () => {
    const value = { id: 'v1', productId: 'p1' };
    valueRepository.findOne.mockResolvedValue(value);
    await expect(service.findOne('p1', 'v1')).resolves.toEqual(value);
  });

  it('findOne throws when missing', async () => {
    valueRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('p1', 'x')).rejects.toBeTruthy();
  });
});