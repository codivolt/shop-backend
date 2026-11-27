import { PaymentAccountService } from './payment-account.service';

describe('PaymentAccountService', () => {
  const paymentAccountRepository: any = { find: jest.fn(), findOne: jest.fn() };
  const service = new PaymentAccountService(paymentAccountRepository);

  beforeEach(() => jest.clearAllMocks());

  it('findAll returns repository rows', async () => {
    const rows = [{ id: 'p1' }];
    paymentAccountRepository.find.mockResolvedValue(rows);
    await expect(service.findAll()).resolves.toEqual(rows);
  });

  it('findOne returns the account when found', async () => {
    const account = { id: 'p1' };
    paymentAccountRepository.findOne.mockResolvedValue(account);
    await expect(service.findOne('p1')).resolves.toEqual(account);
  });
});