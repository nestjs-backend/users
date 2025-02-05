import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
// import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { MicroserviceCorrelationInterceptor } from 'src/interceptor/correlation-id.microservice.interceptor';
import { ClsService } from 'nestjs-cls';
import { validateEnv } from './config/env.validation';
import tracer from './tracer/tracer';

async function bootstrap() {
  const validatedEnv = validateEnv(process.env); // Validate environment variables first
  // Setup tracing before creating the app
  tracer.start(); // Start the tracer

  const app = await NestFactory.create(AppModule);
  // const configService = app.get(ConfigService<AllConfigType>);
  app.connectMicroservice({
    transport: Transport.NATS,
    options: {
      servers: [`nats://${validatedEnv.NATS_HOST}:${validatedEnv.NATS_PORT}`],
      queue: 'user_queue',
    },
  });

  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Apply interceptor to all NATS messages
  app.useGlobalInterceptors(
    new MicroserviceCorrelationInterceptor(app.get(ClsService)),
  );

  await app.startAllMicroservices(); // Start the microservice
  // await app.init();

  console.log('NATS microservice started..');
}
void bootstrap();
