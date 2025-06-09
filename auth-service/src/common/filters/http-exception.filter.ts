import { Catch, ExceptionFilter, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { ErrorResponse } from '../interfaces/error-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const status = exception.getStatus();
    const message = exception.message || 'Internal server error';

    const response: ErrorResponse = {
      statusCode: status,
      message,
      error: exception.name,
    };

    this.logger.error(`Error ${status}: ${message}`);

    return response;
  }
}