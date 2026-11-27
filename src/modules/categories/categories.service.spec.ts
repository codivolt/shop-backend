import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  const categoriesRepository: any = { findOne: jest.fn() };
  const categoryAttributeService: any = {};
  const service = new CategoriesService(
    categoriesRepository,
    categoryAttributeService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('findOne returns the category when found', async () => {
    const category = { id: 'c1', name: 'Cat' };
    categoriesRepository.findOne.mockResolvedValue(category);
    await expect(service.findOne('c1')).resolves.toEqual(category);
  });

  it('findOne throws when not found', async () => {
    categoriesRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeTruthy();
  });
});