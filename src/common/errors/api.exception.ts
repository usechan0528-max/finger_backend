import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-code.enum';

export class ApiException extends HttpException {
  constructor(params: {
    status: HttpStatus;
    code: ErrorCode | string;
    message: string;
    details?: unknown;
  }) {
    super(
      {
        success: false,
        error: {
          code: params.code,
          message: params.message,
          details: params.details ?? null,
        },
      },
      params.status,
    );
  }
}
