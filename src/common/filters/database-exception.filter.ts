import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface DriverError {
  code?: string;
  errno?: number;
  sqlMessage?: string;
}

const DUPLICATE_ENTRY = 'ER_DUP_ENTRY';
const FOREIGN_KEY_VIOLATIONS = new Set([
  'ER_NO_REFERENCED_ROW_2',
  'ER_ROW_IS_REFERENCED_2',
  'ER_NO_REFERENCED_ROW',
  'ER_ROW_IS_REFERENCED',
]);

/**
 * Translates raw MySQL constraint errors into meaningful HTTP responses so
 * services don't have to guard against every unique/foreign key by hand.
 */
@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const driverError = (
      exception as QueryFailedError & { driverError?: DriverError }
    ).driverError;

    this.logger.error(exception.message, exception.stack);

    if (driverError?.code === DUPLICATE_ENTRY) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'این مقدار قبلاً ثبت شده است',
        error: 'Conflict',
      });
      return;
    }

    if (driverError?.code && FOREIGN_KEY_VIOLATIONS.has(driverError.code)) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'رکورد مرتبط وجود ندارد یا در جای دیگری استفاده شده است',
        error: 'Bad Request',
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'خطای غیرمنتظره در پایگاه داده',
      error: 'Internal Server Error',
    });
  }
}
