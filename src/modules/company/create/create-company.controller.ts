import { z } from 'zod';
import { createCompanyUseCase } from './create-company.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Company } from '@/src/modules/company/company.model';
import type { CompanyMember } from '@/src/modules/company/company-member.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  name: z.string().min(1).max(100),
  legalName: z.string().max(200).optional(),
  country: z.string().length(2),
  currency: z.string().length(3),
  userId: z.string(),
});

function presenter(result: { company: Company; companyMember: CompanyMember }) {
  return {
    company: {
      id: result.company.id,
      name: result.company.name,
      slug: result.company.slug,
      country: result.company.country,
      currency: result.company.currency,
      subscriptionPlan: result.company.subscriptionPlan,
      subscriptionStatus: result.company.subscriptionStatus,
    },
    companyMember: {
      id: result.companyMember.id,
      role: result.companyMember.role,
    },
  };
}

export async function createCompanyController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'createCompany Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const result = await createCompanyUseCase(data);

        return presenter(result);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

