import { z } from 'zod';
import { getCompanyUseCase } from './get-company.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Company } from '@/src/modules/company/company.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  sessionId: z.string().optional(),
});

function presenter(company: Company) {
  return {
    id: company.id,
    name: company.name,
    legalName: company.legalName,
    slug: company.slug,
    country: company.country,
    currency: company.currency,
    subscriptionPlan: company.subscriptionPlan,
    subscriptionStatus: company.subscriptionStatus,
    trialEndsAt: company.trialEndsAt,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

export async function getCompanyController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'getCompany Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        const company = await getCompanyUseCase({
          companyId: data.companyId,
          sessionId: data.sessionId,
        });

        return presenter(company);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

