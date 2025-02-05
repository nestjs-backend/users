import { plainToInstance } from 'class-transformer';
import { IsString, IsNumber, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  NODE_ENV: string;

  @IsString()
  APP_NAME: string;

  @IsString()
  NATS_HOST: string;

  @IsNumber()
  NATS_PORT: number;

  @IsString()
  MONGODB_URI: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true, // Important: Allows env vars to be converted to correct types
  });

  const errors = validateSync(validatedConfig);
  if (errors.length > 0) {
    throw new Error(`Invalid environment variables: ${errors.toString()}`);
  }
  return validatedConfig;
}
