import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const productsRepository: any = {};
  const productImagesRepository: any = {};
  const productAttributesRepository: any = {};
  const categoriesService: any = {};
  const brandsService: any = {};
  const service = new ProductsService(
    productsRepository,
    productImagesRepository,
    productAttributesRepository,
    categoriesService,
    brandsService,
  );

  it('exposes the main CRUD methods', () => {
    expect(typeof service.create).toBe('function');
    expect(typeof service.findAll).toBe('function');
    expect(typeof service.findOne).toBe('function');
    expect(typeof service.findBySlug).toBe('function');
  });
});