import { Injectable, HttpStatus } from '@nestjs/common';
import { NatsContext, RpcException } from '@nestjs/microservices';
import * as os from 'os';

@Injectable()
export class AppService {
  healthCheck(context: NatsContext): { message: string; subject: string } {
    const subject = context.getSubject();
    return { message: 'OK', subject };
  }

  generateError(): string {
    const containerId = os.hostname() || 'unknown container';

    // get global APP_NAME
    const appName = global.APP_NAME || 'unknown app';

    // Get container IP address
    const networks = os.networkInterfaces();
    const eth0 = networks.eth0?.find((addr) => addr.family === 'IPv4');

    // Develop env error
    const error = {
      code: 'ERR-001',
      developerMessage: 'Debug developer friendly message',
      timestamp: new Date().toISOString(),
      service: appName,
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
}
