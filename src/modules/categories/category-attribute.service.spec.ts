import { CategoryAttributeService } from './category-attribute.service';

describe('CategoryAttributeService', () => {
  const attributeRepository: any = { findOne: jest.fn() };
  const categoriesRepository: any = {};
  const service = new CategoryAttributeService(
    attributeRepository,
    categoriesRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('findById returns the attribute when found', async () => {
    const attr = { id: 'at1', name: 'Color' };
    attributeRepository.findOne.mockResolvedValue(attr);
    await expect(service.findById('at1')).resolves.toEqual(attr);
  });

  it('findById returns null when missing', async () => {
    attributeRepository.findOne.mockResolvedValue(null);
    await expect(service.findById('x')).resolves.toBeNull();
  });
});