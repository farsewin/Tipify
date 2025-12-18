import { z } from 'zod';
import { createStaffProfileUseCase } from './create-staff-profile.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { StaffProfile } from '@/src/modules/staff/staff-profile.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  branchId: z.string(),
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  position: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
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
    createdAt: staffProfile.createdAt,
    updatedAt: staffProfile.updatedAt,
  };
}

export async function createStaffProfileController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'createStaffProfile Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        const staffProfile = await createStaffProfileUseCase(data);

        return presenter(staffProfile);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

