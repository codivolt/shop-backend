import { ConfigService } from '@nestjs/config';

export const jwtConfig = (configService: ConfigService) => {
  const secret = configService.get<string>('JWT_SECRET');
  const expiresIn = configService.get<string>('JWT_EXPIRES_IN');

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  if (!expiresIn) {
    throw new Error('JWT_EXPIRES_IN environment variable is required');
  }

  return {
    secret,
    signOptions: { expiresIn: expiresIn as any },
  };
};

export const jwtConstants = {
  get secret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    return secret;
  },
  signOptions: {
    get expiresIn() {
      const expiresIn = process.env.JWT_EXPIRES_IN;
      if (!expiresIn) {
        throw new Error('JWT_EXPIRES_IN environment variable is required');
      }
      return expiresIn;
    },
  },
};
