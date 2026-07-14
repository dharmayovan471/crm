import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DatabaseError } from 'pg';
import { MESSAGES } from '../constants/messages.constants';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = MESSAGES.INTERNAL_SERVER_ERROR;
    let errors: any = null;

    // Extract nested driver error from Drizzle ORM wrappers if available
    let dbError = exception as any;
    if (exception && (exception as any).driverError) {
      dbError = (exception as any).driverError;
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      message = typeof res === 'object' && res.message ? res.message : exception.message;
      errors = typeof res === 'object' && res.errors ? res.errors : null;
    } else if (dbError instanceof DatabaseError || (dbError && typeof dbError.code === 'string')) {
      this.logger.error(`Database error occurred: code=${dbError.code}, detail=${dbError.detail}, message=${dbError.message}`);
      
      // PostgreSQL Error Codes mapping
      if (dbError.code === '23505') {
        // unique_violation
        status = HttpStatus.CONFLICT;
        message = MESSAGES.RESOURCE_EXISTS;
        errors = {
          detail: dbError.detail,
          constraint: dbError.constraint,
        };
      } else if (dbError.code === '23503') {
        // foreign_key_violation
        status = HttpStatus.BAD_REQUEST;
        message = MESSAGES.FOREIGN_KEY_VIOLATION;
        errors = {
          detail: dbError.detail,
          constraint: dbError.constraint,
        };
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = dbError.message || MESSAGES.DB_FAILED;
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      message = exception.message;
    } else {
      this.logger.error('Unknown exception caught', exception);
    }

    // Determine machine-readable application error code
    let errorCode = 'INTERNAL_SERVER_ERROR';
    if (status === HttpStatus.UNAUTHORIZED) {
      errorCode = 'UNAUTHORIZED';
    } else if (status === HttpStatus.FORBIDDEN) {
      errorCode = 'FORBIDDEN';
    } else if (status === HttpStatus.NOT_FOUND) {
      errorCode = 'NOT_FOUND';
    } else if (status === HttpStatus.CONFLICT || (dbError && dbError.code === '23505')) {
      errorCode = 'DB_UNIQUE_VIOLATION';
    } else if (dbError && dbError.code === '23503') {
      errorCode = 'DB_FOREIGN_KEY_VIOLATION';
    } else if (status === HttpStatus.BAD_REQUEST) {
      errorCode = 'VALIDATION_ERROR';
    } else if (dbError && dbError.code) {
      errorCode = `DB_ERROR_${dbError.code}`;
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errors && { errors }),
    });
  }
}
