import { Controller, Get, HttpStatus } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
import {
  MessagePattern,
  EventPattern,
  Ctx,
  NatsContext,
  RpcException,
} from '@nestjs/microservices';
import { AppService } from './app.service';

import * as os from 'os';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern('user.healthcheck')
  healthCheck(@Ctx() context: NatsContext) {
    const subject = context.getSubject();
    return { message: 'OK', subject };
  }

  @MessagePattern('user.error')
  errorTrigger() {
    const containerId = os.hostname() || 'unknown';

    // Get container IP address
    const networks = os.networkInterfaces();
    const eth0 = networks.eth0?.find((addr) => addr.family === 'IPv4');

    // Develop env error
    const error = {
      code: 'ERR-001',
      message: 'user Service',
      timestamp: new Date().toISOString(),
      containerId,
      containerIp: eth0?.address,
    };

    throw new RpcException({
      status: 'error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'We encountered an error, please try again later',
      error,
    });
  }

  @EventPattern('user.healthcheck-event')
  healthCheckEvent() {
    // Handle event-based processing
    console.log('healthCheckEvent OK');
  }
}
