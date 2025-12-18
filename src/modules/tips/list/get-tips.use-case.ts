import { getTipsRepository } from '@/src/service-locator';
import type { Tip } from '@/src/modules/tips/tip.model';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function getTipsUseCase(input: {
  companyId: string;
  branchId?: string;
  staffProfileId?: string;
  distributionStatus?: Tip['distributionStatus'];
  paymentStatus?: Tip['paymentStatus'];
  startDate?: Date;
  endDate?: Date;
  sessionId: string;
}): Promise<Tip[]> {
  // Validate company access
  await validateCompanyAccess(input.sessionId, input.companyId);

  const tipsRepository = getTipsRepository();

  return tipsRepository.getTipsByCompany(input.companyId, {
    branchId: input.branchId,
    staffProfileId: input.staffProfileId,
    distributionStatus: input.distributionStatus,
    paymentStatus: input.paymentStatus,
    startDate: input.startDate,
    endDate: input.endDate,
  });
}

