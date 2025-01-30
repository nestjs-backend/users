// user-microservice/src/main.ts
import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  Transport,
  NatsStatus,
} from '@nestjs/microservices';
import { AppModule } from './app.module';

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
  app.status.subscribe((status: NatsStatus) => {
    console.log(`NATS server status: ${status}`);
  });

  // Enable shutdown hooks
  app.enableShutdownHooks();

  try {
    await app.listen();
    console.log('Microservice is listening');
  } catch (error) {
    console.error('Failed to start microservice:', error);
  }
}
void bootstrap();
