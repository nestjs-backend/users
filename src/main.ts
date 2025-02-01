// user-microservice/src/main.ts
import { NestFactory } from '@nestjs/core';
import { NatsOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService<AllConfigType>);

  app.connectMicroservice<NatsOptions>({
    transport: Transport.NATS,
    options: {
      servers: [
        `nats://${configService.getOrThrow<string>('app.natsHost', { infer: true })}:${configService.getOrThrow<string>('app.natsPort', { infer: true })}`,
      ],
      queue: 'user_queue',
      // user: 'your_user',
      // pass: 'your_password',
      // token: 'your_token',
      // name: 'your_client_name', // Useful for debugging and monitoring
      reconnect: true,
      // maxReconnectAttempts: 5,
      // waitOnFirstConnect: true, // Important for production
      connectionTimeout: 5000, // Milliseconds
      // debug: true, // For more verbose logging (use cautiously in production)
    },
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
  // Make APP_NAME available as global
  global.APP_NAME = configService.getOrThrow('app.appName', { infer: true });

  await app.startAllMicroservices(); // Start the microservice

  console.log('NATS microservice started..');
}
void bootstrap();
