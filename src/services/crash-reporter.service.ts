import * as Sentry from '@sentry/nextjs';

export class CrashReporterService {
  private static instance: CrashReporterService;

  private constructor() {}

  static getInstance(): CrashReporterService {
    if (!CrashReporterService.instance) {
      CrashReporterService.instance = new CrashReporterService();
    }
    return CrashReporterService.instance;
  }

  report(error: any): string {
    return Sentry.captureException(error);
  }
}
