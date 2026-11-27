import { UsersService } from './users.service';

describe('UsersService', () => {
  const usersRepository: any = { findOne: jest.fn() };
  const referralTierRepository: any = {};
  const service = new UsersService(usersRepository, referralTierRepository);

  beforeEach(() => jest.clearAllMocks());

  it('findById returns the user when found', async () => {
    const user = { id: 'u1', phone: '09120000000' };
    usersRepository.findOne.mockResolvedValue(user);
    await expect(service.findById('u1')).resolves.toEqual(user);
  });

  it('findById returns null when not found', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    await expect(service.findById('missing')).resolves.toBeNull();
  });
});