import { ConfigService } from '@nestjs/config';

export const jwtConfig = (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_SECRET', 'change-me-in-production'),
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as any,
  },
});

export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'change-me-in-production',
  signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
};
