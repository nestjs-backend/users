import { Controller } from '@nestjs/common';
import {
  MessagePattern,
  EventPattern,
  Ctx,
  NatsContext,
} from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('user.healthcheck')
  healthCheck(@Ctx() context: NatsContext) {
    return this.appService.healthCheck(context);
  }

  @MessagePattern('user.error')
  errorTrigger() {
    return this.appService.generateError();
  }
}
