import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class NatsContextMiddleware {
  constructor(private readonly cls: ClsService) {}

  async use(context: any, next: () => Promise<void>) {
    const natsContext = context.getData().natsContext;

    if (natsContext) {
      // Restore CLS context from NATS message
      await this.cls.run(async () => {
        this.cls.set('id', natsContext.clsId);
        this.cls.set('user', natsContext.context);
        await next();
      });
    } else {
      await next();
    }
  }
}
