import { DeliveryService } from './delivery.service';

describe('DeliveryService', () => {
  const deliveryRepository: any = { find: jest.fn(), findOne: jest.fn() };
  const service = new DeliveryService(deliveryRepository);

  beforeEach(() => jest.clearAllMocks());

  it('findAll returns repository rows', async () => {
    const rows = [{ id: 'd1' }];
    deliveryRepository.find.mockResolvedValue(rows);
    await expect(service.findAll()).resolves.toEqual(rows);
  });

  it('findAllActive filters active rows', async () => {
    const rows = [{ id: 'd1', isActive: true }];
    deliveryRepository.find.mockResolvedValue(rows);
    await expect(service.findAllActive()).resolves.toEqual(rows);
    expect(deliveryRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});