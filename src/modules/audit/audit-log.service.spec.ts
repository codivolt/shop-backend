import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  const repo: any = { create: jest.fn(), save: jest.fn() };
  const service = new AuditLogService(repo);

  beforeEach(() => jest.clearAllMocks());

  it('record persists an audit entry', async () => {
    repo.create.mockReturnValue({ id: 'log1' });
    repo.save.mockResolvedValue({ id: 'log1' });
    await service.record({ method: 'POST', path: '/x' });
    expect(repo.create).toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });

  it('record never throws on persistence failure', async () => {
    repo.create.mockImplementation(() => {
      throw new Error('db down');
    });
    await expect(service.record({ method: 'GET', path: '/y' })).resolves.toBeUndefined();
  });
});