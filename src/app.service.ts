import { Injectable, HttpStatus, NotFoundException } from '@nestjs/common';
import { NatsContext, RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import * as os from 'os';
import { Model } from 'mongoose';
import { hash, compare } from 'bcryptjs';
import { trace, context, propagation } from '@opentelemetry/api';
import { User } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
@Injectable()
export class AppService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  healthCheck(message: any, natsContext: NatsContext) {
    const subject = natsContext.getSubject();

    const carrier = message.traceContext || {};

    // Extract the trace context from the message
    const ctx = propagation.extract(context.active(), carrier);

    // Create a new span under the extracted context
    const tracer = trace.getTracer('microservice');
    return context.with(ctx, () => {
      const span = tracer.startSpan('user/healthCheck');

      // Simulate processing
      console.log('Processing message:', message.data);

      span.end();
      return { status: 'success' };
    });
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
      service: appName,
      code: 'ERR-001',
      message: 'Debug developer friendly message',
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

  async userCreate(data: CreateUserDto): Promise<User> {
    console.log('userCreate');
    const user = new this.userModel({
      ...data,
      password: await hash(data.password, 10),
    });
    return user.save();
  }

  async userGetByEmail(email: string): Promise<User> {
    console.log('userGetByEmail');
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    console.log('userGetByEmail', user);
    return user;
  }
}
