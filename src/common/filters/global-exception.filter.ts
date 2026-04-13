import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../exceptions/error-codes';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'internal server error';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const res = exception.getResponse();

      if (this.isApiErrorResponse(res)) {
        code = String(res.error.code);
        message = res.error.message;
        details = res.error.details;
      } else if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;

        if (typeof body.message === 'string') {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          message = 'validation failed';
          details = body.message;
        }

        if (body.error && typeof body.error === 'string') {
          details = details ?? body.error;
        }

        code = this.mapHttpStatusToErrorCode(status);
      } else {
        code = this.mapHttpStatusToErrorCode(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    this.logger.error(
      `[${request.method}] ${request.url} -> ${status} ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
      },
    });
  }

  private isApiErrorResponse(
    value: unknown,
  ): value is {
    success: false;
    error: {
      code: string;
      message: string;
      details: unknown;
    };
  } {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const payload = value as {
      success?: unknown;
      error?: {
        code?: unknown;
        message?: unknown;
        details?: unknown;
      };
    };

    return (
      payload.success === false &&
      !!payload.error &&
      typeof payload.error.code === 'string' &&
      typeof payload.error.message === 'string'
    );
  }

  private mapHttpStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMITED;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCode.VALIDATION_ERROR;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
