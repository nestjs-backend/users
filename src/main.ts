import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
// import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { MicroserviceCorrelationInterceptor } from 'src/interceptor/correlation-id.microservice.interceptor';
import { ClsService } from 'nestjs-cls';
import { validateEnv } from './config/env.validation';
import { LoggerFactory } from './logger/logger.factory';
import { otelSDK } from './tracer/metrics';

async function bootstrap() {
  const validatedEnv = validateEnv(process.env); // Validate environment variables first

  otelSDK.start();

  const app = await NestFactory.create(AppModule, {
    logger: LoggerFactory(validatedEnv.APP_NAME, validatedEnv.NODE_ENV),
  });
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

  // await app.init();
  await app.startAllMicroservices(); // Start the microservice

  Logger.log('NATS microservice started..');
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}
void bootstrap();
