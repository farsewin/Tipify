import { z } from 'zod';
import { getBranchesUseCase } from './get-branches.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Branch } from '@/src/modules/branch/branch.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  sessionId: z.string().optional(),
  activeOnly: z.boolean().optional(),
});

function presenter(branches: Branch[]) {
  return branches.map((branch) => ({
    id: branch.id,
    companyId: branch.companyId,
    name: branch.name,
    location: branch.location,
    slug: branch.slug,
    timezone: branch.timezone,
    active: branch.active,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  }));
}

export async function getBranchesController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'getBranches Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        const branches = await getBranchesUseCase({
          companyId: data.companyId,
          sessionId: data.sessionId,
          activeOnly: data.activeOnly,
        });

        return presenter(branches);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

