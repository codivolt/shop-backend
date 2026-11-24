export const AuthGuard = (strategy?: string) => {
  return class AuthGuardMock {
    canActivate = jest.fn().mockReturnValue(true);
    handleRequest = jest.fn();
  };
};

export const AuthGuardBase = class {
  canActivate = jest.fn().mockReturnValue(true);
};

export const passport = {
  AuthGuard,
  AuthGuardBase,
};

export default passport;
