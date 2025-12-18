import { z } from 'zod';
import { getStaffProfilesUseCase } from './get-staff-profiles.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { StaffProfile } from '@/src/modules/staff/staff-profile.model';
import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z.object({
  companyId: z.string(),
  branchId: z.string().optional(),
  activeOnly: z.boolean().optional(),
  sessionId: z.string().optional(),
});

function presenter(staffProfiles: StaffProfile[]) {
  return staffProfiles.map((staff) => ({
    id: staff.id,
    companyId: staff.companyId,
    branchId: staff.branchId,
    userId: staff.userId,
    displayName: staff.displayName,
    position: staff.position,
    avatarUrl: staff.avatarUrl,
    publicId: staff.publicId,
    active: staff.active,
    createdAt: staff.createdAt,
    updatedAt: staff.updatedAt,
  }));
}

export async function getStaffProfilesController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<ReturnType<typeof presenter>> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    { name: 'getStaffProfiles Controller', op: 'controller' },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        if (!data.sessionId) {
          throw new InputParseError('Session ID is required');
        }

        const staffProfiles = await getStaffProfilesUseCase({
          companyId: data.companyId,
          branchId: data.branchId,
          activeOnly: data.activeOnly,
          sessionId: data.sessionId,
        });

        return presenter(staffProfiles);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}

