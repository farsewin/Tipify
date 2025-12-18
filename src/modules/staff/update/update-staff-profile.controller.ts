import { z } from 'zod';
import { updateStaffProfileUseCase } from './update-staff-profile.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { StaffProfile } from '@/src/modules/staff/staff-profile.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  staffProfileId: z.string(),
  companyId: z.string(),
  updates: z.object({
    displayName: z.string().min(1).max(100).optional(),
    position: z.string().max(100).optional(),
    avatarUrl: z.string().url().optional().nullable(),
    active: z.boolean().optional(),
    branchId: z.string().optional(),
  }),
  sessionId: z.string(),
});

function presenter(staffProfile: StaffProfile) {
  return {
    id: staffProfile.id,
    companyId: staffProfile.companyId,
    branchId: staffProfile.branchId,
    userId: staffProfile.userId,
    displayName: staffProfile.displayName,
    position: staffProfile.position,
    avatarUrl: staffProfile.avatarUrl,
    publicId: staffProfile.publicId,
    active: staffProfile.active,
    updatedAt: staffProfile.updatedAt,
  };
}

export async function updateStaffProfileController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'updateStaffProfile Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const staffProfile = await updateStaffProfileUseCase(data);

        return presenter(staffProfile);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

