import { registerAs } from '@nestjs/config';
import { AppConfig } from './app-config.type';
import validateConfig from './validate-config';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsString()
  APP_NAME: string;

  @IsString()
  APP_QUEUE: string;

  @IsString()
  NATS_HOST: string;

  @IsInt()
  @Min(1024)
  @Max(65535)
  NATS_PORT: number;

  @IsString()
  MONGODB_URI: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    appName: process.env.APP_NAME || 'app',
    appQueue: process.env.APP_QUEUE || 'app_queue',
    natsHost: process.env.NATS_HOST || 'localhost',
    natsPort: parseInt(process.env.NATS_PORT || '4222', 10),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/app',
  };
});
