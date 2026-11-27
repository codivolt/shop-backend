import { ProductImageService } from './product-image.service';

describe('ProductImageService', () => {
  const imageRepository: any = { findOne: jest.fn() };
  const productsService: any = {};
  const service = new ProductImageService(imageRepository, productsService);

  beforeEach(() => jest.clearAllMocks());

  it('findOne returns the image when found', async () => {
    const image = { id: 'img1', productId: 'p1' };
    imageRepository.findOne.mockResolvedValue(image);
    await expect(service.findOne('p1', 'img1')).resolves.toEqual(image);
  });

  it('findOne throws when missing', async () => {
    imageRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('p1', 'x')).rejects.toBeTruthy();
  });
});