import winston, { transports, format } from 'winston';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import * as logsAPI from '@opentelemetry/api-logs';
import { Resource } from '@opentelemetry/resources';
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';
import Transport from 'winston-transport';

export const LoggerFactory = (serviceName: string, NODE_ENV: string) => {
  console.log(`LoggerFactory appName: ${serviceName} in ${NODE_ENV} mode`);

  const logExporterOptions = 'http://192.168.88.120:4318/v1/logs';

  // Initialize the Logger provider
  const loggerProvider = new LoggerProvider({
    resource: new Resource({
      'service.name': serviceName,
      'service.version': '1.0.0',
      'deployment.environment': NODE_ENV || 'development',
    }),
  });

  // Configure OTLP exporter
  const otlpLogExporter = new OTLPLogExporter({
    url: logExporterOptions,
    headers: {
      'Content-Type': 'application/json',
      // Add any required headers for your OpenTelemetry backend
      // 'Authorization': `Bearer ${process.env.OTLP_API_KEY}`,
    },
    timeoutMillis: 5000, // 5 second timeout
    concurrencyLimit: 10, // Limit concurrent requests
  });

  loggerProvider.addLogRecordProcessor(
    new SimpleLogRecordProcessor(otlpLogExporter),
  );

  loggerProvider.addLogRecordProcessor({
    onEmit: (record) => {
      console.log('Log Record Sent:', record);
    },
    shutdown: () => Promise.resolve(),
    forceFlush: () => Promise.resolve(),
  });

  // Set the global logger provider
  logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

  let consoleFormat;

  if (NODE_ENV === 'production') {
    consoleFormat = format.combine(
      format.ms(),
      format.timestamp(),
      format.errors({
        stack: true,
      }),
      format.metadata(),
      format.json(),
    );
  } else {
    consoleFormat = format.combine(
      format.timestamp(),
      format.ms(),
      nestWinstonModuleUtilities.format.nestLike(serviceName, {
        colors: true,
        prettyPrint: true,
      }),
    );
  }

  return WinstonModule.createLogger({
    level: NODE_ENV === 'production' ? 'info' : 'debug',
    defaultMeta: {
      service: 'winston-logger',
      environment: NODE_ENV || 'development',
    },
    transports: [
      new transports.Console({ format: consoleFormat }),
      new OpenTelemetryTransportV3({
        // @ts-ignore: Unreachable code error
        loggerProvider: loggerProvider,
        logResourceLabels: true,
      }),
    ],
    exitOnError: false, // do not exit on handled exceptions
  });
};
