import { AuthService } from './auth.service';

describe('AuthService', () => {
  const usersService: any = {};
  const jwtService: any = {};
  const verificationCodesRepository: any = {};
  const refreshTokensRepository: any = {};
  const smsService: any = {};
  const permissionsService: any = {};
  const service = new AuthService(
    usersService,
    jwtService,
    verificationCodesRepository,
    refreshTokensRepository,
    smsService,
    permissionsService,
  );

  it('exposes the auth methods', () => {
    expect(typeof service.register).toBe('function');
    expect(typeof service.login).toBe('function');
    expect(typeof service.verifyCode).toBe('function');
  });
});