import * as Sentry from '@sentry/nextjs';

export class InstrumentationService {
  private static instance: InstrumentationService;

  private constructor() {}

  static getInstance(): InstrumentationService {
    if (!InstrumentationService.instance) {
      InstrumentationService.instance = new InstrumentationService();
    }
    return InstrumentationService.instance;
  }

  startSpan<T>(
    options: { name: string; op?: string; attributes?: Record<string, any> },
    callback: () => T
  ): T {
    return Sentry.startSpan(options, callback);
  }

  instrumentServerAction<T>(
    name: string,
    options: Record<string, any>,
    callback: () => T
  ): Promise<T> {
    return Sentry.withServerActionInstrumentation(name, options, callback);
  }
}
