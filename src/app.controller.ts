import { Controller, UseInterceptors } from '@nestjs/common';
import {
  MessagePattern,
  EventPattern,
  Ctx,
  NatsContext,
  Payload,
} from '@nestjs/microservices';
import { AppService } from './app.service';
import { MicroserviceCorrelationInterceptor } from 'src/interceptor/correlation-id.microservice.interceptor';
import { CreateUserDto } from './dto/create-user.dto';

@Controller()
@UseInterceptors(MicroserviceCorrelationInterceptor)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('user.healthcheck')
  healthCheck(@Payload() message: any, @Ctx() context: NatsContext) {
    return this.appService.healthCheck(message, context);
  }

  @MessagePattern('user.error')
  errorTrigger() {
    return this.appService.generateError();
  }

  @MessagePattern('user.create')
  userCreate(data: CreateUserDto) {
    return this.appService.userCreate(data);
  }

  @MessagePattern('user.getByEmail')
  userGetByEmail(@Payload() message: any, @Ctx() context: NatsContext) {
    return this.appService.userGetByEmail(message, context);
  }
}
