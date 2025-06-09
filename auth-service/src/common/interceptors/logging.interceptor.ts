import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (process.env.NODE_ENV !== 'development') {
      return next.handle();
    }

    const now = Date.now();
    const pattern = context.getArgs()[0];

    this.logger.log(`Handling Kafka message: ${pattern}`);

    return next.handle().pipe(
      tap(() => this.logger.log(`Finished handling ${pattern} in ${Date.now() - now}ms`)),
    );
  }
}