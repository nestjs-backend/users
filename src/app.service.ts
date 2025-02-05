import { Injectable, HttpStatus } from '@nestjs/common';
import { NatsContext, RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import * as os from 'os';
import { Model } from 'mongoose';
import { hash } from 'bcryptjs';
import { trace, context, propagation } from '@opentelemetry/api';
import { User } from './schema/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AppService {
  private appName: string;
  private readonly containerId = os.hostname() || 'unknown container';
  private readonly containerIp = os
    .networkInterfaces()
    .eth0?.find((addr) => addr.family === 'IPv4')?.address;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {
    this.appName = this.configService.getOrThrow<string>('appName', {
      infer: true,
    });
  }

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
      return { message: 'OK', subject };
    });
  }

  generateError(): string {
    const containerId = os.hostname() || 'unknown container';

    // get global APP_NAME
    const appName = global.APP_NAME || 'unknown app';

    // Get container IP address
    const networks = os.networkInterfaces();
    const eth0 = networks.eth0?.find((addr) => addr.family === 'IPv4');

    // Develop env error
    const debug = {
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
      debug,
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

  async userGetByEmail(message: any, natsContext: NatsContext): Promise<any> {
    console.log('userGetByEmail', message);
    // wait 10 sec
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const subject = natsContext.getSubject();
    console.log('subject:', subject);

    const carrier = message.traceContext || {};

    // Extract the trace context from the message
    const ctx = propagation.extract(context.active(), carrier); // Extract the trace context from the message

    // Create a new span under the extracted context
    const tracer = trace.getTracer('microservice');

    return context.with(ctx, async () => {
      const span = tracer.startSpan('user/getByEmail');

      try {
        const data = message.data;

        // Start a new span for MongoDB query
        return tracer.startActiveSpan(
          'MongoDB: userModel.findOne',
          async (dbSpan) => {
            try {
              const user = await this.userModel.findOne({
                email: data.email,
              });

              if (!user) {
                dbSpan.recordException('User not found');
                // Develop env error
                const debug = {
                  service: this.appName,
                  code: 'ERR-000',
                  message: `${subject} User not found`,
                  timestamp: new Date().toISOString(),
                  containerId: this.containerId,
                  containerIp: this.containerIp,
                };

                throw new RpcException({
                  status: HttpStatus.NOT_FOUND,
                  message: 'User not found!',
                  debug,
                });
              }

              return user;
            } catch (error) {
              dbSpan.recordException(error);
              throw error;
            } finally {
              dbSpan.end();
            }
          },
        );
      } catch (error) {
        console.log('Error fetching user:', error);
        span.recordException(error);
        throw error;
      } finally {
        span.end(); // Ensure the span is properly closed
      }
    });
  }
}
