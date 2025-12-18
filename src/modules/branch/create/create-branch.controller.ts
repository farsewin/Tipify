import { z } from 'zod';
import { createBranchUseCase } from './create-branch.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Branch } from '@/src/modules/branch/branch.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  name: z.string().min(1).max(100),
  location: z.string().max(255).optional(),
  timezone: z.string().optional(),
  sessionId: z.string(),
});

function presenter(branch: Branch) {
  return {
    id: branch.id,
    companyId: branch.companyId,
    name: branch.name,
    location: branch.location,
    slug: branch.slug,
    timezone: branch.timezone,
    active: branch.active,
  };
}

export async function createBranchController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'createBranch Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const branch = await createBranchUseCase(data);

        return presenter(branch);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

