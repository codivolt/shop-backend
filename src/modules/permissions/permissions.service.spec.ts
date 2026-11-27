import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  const permissionsRepository: any = {};
  const rolePermissionsRepository: any = {};
  const service = new PermissionsService(
    permissionsRepository,
    rolePermissionsRepository,
  );

  it('exposes the permission methods', () => {
    expect(typeof service.create).toBe('function');
  });
});