import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = (request?.method ?? '').toUpperCase();

    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    const user = request?.user;
    const ip =
      request?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ??
      request?.socket?.remoteAddress ??
      request?.ip ??
      null;
    const path = request?.originalUrl ?? request?.url ?? '';

    return next.handle().pipe(
      tap({
        next: () => {
          void this.audit.record({
            userId: user?.id ?? null,
            userName: user
              ? [user.firstName, user.lastName].filter(Boolean).join(' ') || null
              : null,
            userPhone: user?.phone ?? null,
            userRole: user?.role ?? null,
            method,
            path,
            ip,
          });
        },
      }),
    );
  }
}