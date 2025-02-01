import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';
import { MicroserviceCorrelationInterceptor } from 'src/interceptor/correlation-id.microservice.interceptor';
import { ClsService } from 'nestjs-cls';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AllConfigType>);
  app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: [
        `nats://${configService.getOrThrow<string>('app.natsHost', { infer: true })}:${configService.getOrThrow<string>('app.natsPort', { infer: true })}`,
      ],
      queue: 'user_queue',
    },
  });

  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Apply interceptor to all NATS messages
  app.useGlobalInterceptors(
    new MicroserviceCorrelationInterceptor(app.get(ClsService)),
  );

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
