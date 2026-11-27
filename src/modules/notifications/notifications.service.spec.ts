import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const repo: any = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const service = new NotificationsService(repo);

  beforeEach(() => jest.clearAllMocks());

  it('findAll returns repository rows', async () => {
    const rows = [{ id: 'n1' }];
    repo.find.mockResolvedValue(rows);
    await expect(service.findAll()).resolves.toEqual(rows);
  });

  it('create persists a notification', async () => {
    repo.create.mockReturnValue({ id: 'n1' });
    repo.save.mockResolvedValue({ id: 'n1' });
    await expect(service.create({ title: 'hi' } as any)).resolves.toEqual({ id: 'n1' });
    expect(repo.save).toHaveBeenCalled();
  });
});