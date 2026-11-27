import { StorageService } from './storage.service';

describe('StorageService', () => {
  const config: any = { get: jest.fn((key: string, def?: any) => def) };
  const service = new StorageService(config);

  it('exposes the storage operations', () => {
    expect(typeof service.upload).toBe('function');
    expect(typeof service.get).toBe('function');
    expect(typeof service.delete).toBe('function');
    expect(typeof service.stat).toBe('function');
  });

  it('throws when the service is not ready', async () => {
    await expect(service.get('missing')).rejects.toBeTruthy();
  });
});