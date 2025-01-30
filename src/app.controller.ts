import { Controller, Get } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
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

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern('user.healthcheck')
  healthCheck(@Ctx() context: NatsContext) {
    const headers = context.getHeaders();
    const subject = context.getSubject();
    return { message: 'OK', headers, subject };
  }

  @EventPattern('user.healthcheck-event')
  healthCheckEvent() {
    // Handle event-based processing
    console.log('healthCheckEvent OK');
  }
}
