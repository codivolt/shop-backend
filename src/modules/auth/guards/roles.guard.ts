import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/users.entity';

interface RequestWithUser {
  user?: { role: UserRole };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<RequestWithUser>().user;
    if (!user) {
      throw new ForbiddenException('دسترسی مجاز نیست');
    }

    // سوپر ادمین همیشه دسترسی کامل دارد، بدون نیاز به ثبت در جدول مجوزها
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenException('دسترسی مجاز نیست');
    }

    return true;
  }
}
