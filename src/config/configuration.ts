import { validateEnv } from './env.validation';

export const configuration = () => {
  const validatedConfig = validateEnv(process.env);
  return {
    env: validatedConfig.NODE_ENV,
    appName: validatedConfig.APP_NAME,
    natsHost: validatedConfig.NATS_HOST,
    natsPort: validatedConfig.NATS_PORT,
    mongoUri: validatedConfig.MONGODB_URI,
  };
};
