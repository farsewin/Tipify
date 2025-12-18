import { z } from 'zod';
import { getMyStaffProfileUseCase } from './get-my-staff-profile.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { StaffProfile } from '@/src/modules/staff/staff-profile.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  sessionId: z.string().optional(),
});

function presenter(staffProfile: StaffProfile | null) {
  if (!staffProfile) return null;

  return {
    id: staffProfile.id,
    companyId: staffProfile.companyId,
    branchId: staffProfile.branchId,
    displayName: staffProfile.displayName,
    position: staffProfile.position,
    avatarUrl: staffProfile.avatarUrl,
    publicId: staffProfile.publicId,
    active: staffProfile.active,
  };
}

export async function getMyStaffProfileController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'getMyStaffProfile Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        const staffProfile = await getMyStaffProfileUseCase({
          sessionId: data.sessionId,
        });

        return presenter(staffProfile);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}







