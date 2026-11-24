import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../../../config/jwt.config';
import { UsersService } from '../../users/users.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { User, UserRole } from '../../users/users.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('احراز هویت لازم است');
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('توکن منقضی شده است. لطفاً مجدداً وارد شوید.');
    }

    const userKeys = (user.permissions || []).map((p) => p.permission.key);

    if (user.role !== UserRole.SUPER_ADMIN) {
      const rolePermissions =
        await this.permissionsService.getRolePermissions();
      const roleKeys = (rolePermissions[user.role] || []).filter(
        (key) => !userKeys.includes(key),
      );

      if (roleKeys.length > 0) {
        if (!user.permissions) {
          user.permissions = [];
        }
        for (const key of roleKeys) {
          (user.permissions as any[]).push({ permission: { key } });
        }
      }
    }

    return user;
  }
}
