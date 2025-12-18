import { z } from 'zod';
import { updateBranchUseCase } from './update-branch.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Branch } from '@/src/modules/branch/branch.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  branchId: z.string(),
  companyId: z.string(),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    location: z.string().max(255).optional().nullable(),
    timezone: z.string().optional(),
    active: z.boolean().optional(),
  }),
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
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}

export async function updateBranchController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  try {
    const parsed = inputSchema.parse(input);
    const branch = await updateBranchUseCase(parsed);
    return presenter(branch);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new InputParseError(err.errors.map((e) => e.message).join(', '));
    }

    crashReporterService.captureException(err);
    instrumentationService.incrementCounter('update_branch_error');
    throw err;
  }
}

