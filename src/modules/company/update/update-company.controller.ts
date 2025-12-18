import { z } from 'zod';
import { updateCompanyUseCase } from './update-company.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Company } from '@/src/modules/company/company.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    legalName: z.string().max(200).optional(),
    country: z.string().length(2).optional(),
    currency: z.string().length(3).optional(),
  }),
  sessionId: z.string(),
});

function presenter(company: Company) {
  return {
    id: company.id,
    name: company.name,
    legalName: company.legalName,
    country: company.country,
    currency: company.currency,
    updatedAt: company.updatedAt,
  };
}

export async function updateCompanyController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'updateCompany Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const company = await updateCompanyUseCase(data);

        return presenter(company);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}







