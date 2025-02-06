import { Logger } from '@nestjs/common';
import {
  getNodeAutoInstrumentations,
  getResourceDetectors,
} from '@opentelemetry/auto-instrumentations-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
// import { setupNodeMetrics } from '@sesamecare-oss/opentelemetry-node-metrics';

import { validateEnv } from '../config/env.validation';

const validatedEnv = validateEnv(process.env); // Validate environment variables first

const logger = new Logger('OpenTelemetry');

const resource = new Resource({
  [ATTR_SERVICE_NAME]: validatedEnv.APP_NAME,
  [ATTR_SERVICE_VERSION]: validatedEnv.APP_VERSION,
});

const traceExporter = new OTLPTraceExporter({
  url: 'http://192.168.88.120:4318/v1/traces',
});

const spanProcessor = new BatchSpanProcessor(traceExporter);

export const otelSDK = new NodeSDK({
  resource,
  spanProcessor: spanProcessor,
  contextManager: new AsyncLocalStorageContextManager(),
  resourceDetectors: getResourceDetectors(),
  instrumentations: [
    getNodeAutoInstrumentations(),
    new WinstonInstrumentation(),
  ],
  textMapPropagator: new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      new W3CBaggagePropagator(),
      new B3Propagator(),
      new B3Propagator({
        injectEncoding: B3InjectEncoding.MULTI_HEADER,
      }),
    ],
  }),
});

process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => logger.verbose('SDK shut down successfully'),
      (err) => logger.error('Error shutting down SDK', err),
    )
    .finally(() => process.exit(0));
});
