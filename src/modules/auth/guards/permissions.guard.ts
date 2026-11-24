import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface RequestWithUser {
  user?: {
    role: string;
    permissions?: { permission: { key: string } }[];
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<RequestWithUser>().user;
    if (!user) {
      throw new ForbiddenException('دسترسی مجاز نیست');
    }

    if (user.role === 'super_admin') {
      return true;
    }

    const userKeys = (user.permissions || []).map((p) => p.permission.key);

    const hasPermission = requiredPermissions.every((p) => userKeys.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException('دسترسی به این بخش وجود ندارد');
    }

    return true;
  }
}
