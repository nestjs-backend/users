// user-microservice/src/main.ts
import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  Transport,
  NatsStatus,
} from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: ['nats://nats:4222'],
        queue: 'user_queue',
        stream: {
          name: 'user_stream',
          subjects: ['user.*'],
        },
      },
    },
  );
  const configService = app.get(ConfigService<AllConfigType>);
  app.status.subscribe((status: NatsStatus) => {
    console.log(`NATS server status: ${status}`);
  });

  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Print NODE_ENV
  console.log(
    'NODE_ENV:',
    configService.getOrThrow('app.nodeEnv', { infer: true }),
  );

  // Print APP_NAME
  console.log(
    'APP_NAME:',
    configService.getOrThrow('app.appName', { infer: true }),
  );

  try {
    await app.listen();
    console.log('Microservice is listening');
  } catch (error) {
    console.error('Failed to start microservice:', error);
  }
}
void bootstrap();
