// correlation-id.microservice.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class MicroserviceCorrelationInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const natsContext = context.switchToRpc().getContext();
    const headers = natsContext.getHeaders() || {};
    // Get the correlation ID from the Map
    const correlationId = headers.headers?.get('x-correlation-id')?.[0];

    return this.cls.run(() => {
      this.cls.set('correlationId', correlationId);
      return next.handle();
    });
  }
}
