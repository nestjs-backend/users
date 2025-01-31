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
import * as fs from 'fs/promises';

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
  async errorTrigger() {
    console.log('errorTrigger');
    const containerId = os.hostname();
    console.log('containerId:', containerId);
    const configContent = await fs.readFile('/proc/1/environ', 'utf8');
    console.log('configContent:', configContent);

    // Get IP address
    const networks = os.networkInterfaces();
    const eth0 = networks.eth0?.find((addr) => addr.family === 'IPv4');
    if (eth0) {
      console.log('eth0:', eth0.address);
    }

    // Developer friendly error
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
