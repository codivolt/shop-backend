import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const dataSource: any = {};
  const ordersRepository: any = {};
  const orderItemsRepository: any = {};
  const receiptHistoryRepository: any = {};
  const notificationsService: any = {};
  const deliveryService: any = {};
  const service = new OrdersService(
    dataSource,
    ordersRepository,
    orderItemsRepository,
    receiptHistoryRepository,
    notificationsService,
    deliveryService,
  );

  it('exposes the main order methods', () => {
    expect(typeof service.create).toBe('function');
    expect(typeof service.findAllAdmin).toBe('function');
    expect(typeof service.findAllByUser).toBe('function');
    expect(typeof service.findByOrderCode).toBe('function');
  });
});