export class JwtService {
  sign = jest.fn().mockReturnValue('mock-jwt-token');
  signAsync = jest.fn().mockResolvedValue('mock-jwt-token');
  verify = jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' });
  verifyAsync = jest.fn().mockResolvedValue({ sub: 'user-id', email: 'test@example.com' });
  decode = jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' });
}

export const JwtModule = {
  register: (options?: any) => ({ module: JwtModule, providers: [] }),
  registerAsync: (options?: any) => ({ module: JwtModule, providers: [] }),
};

export const jwt = {
  JwtService,
  JwtModule,
};

export default jwt;