import { CartService } from './cart.service';

describe('CartService', () => {
  const cartItemRepository: any = { find: jest.fn() };
  const productsService: any = {};
  const service = new CartService(cartItemRepository, productsService);

  beforeEach(() => jest.clearAllMocks());

  it('getCart returns repository items', async () => {
    const items = [{ id: 'c1', quantity: 2 }];
    cartItemRepository.find.mockResolvedValue(items);
    await expect(service.getCart('u1')).resolves.toEqual(
      expect.any(Array),
    );
    expect(cartItemRepository.find).toHaveBeenCalled();
  });
});