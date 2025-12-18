import { getCompaniesRepository } from '@/src/service-locator';
import type { Company } from '@/src/modules/company/company.model';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function getCompanyUseCase(input: {
  companyId: string;
  sessionId: string;
}): Promise<Company> {
  // Validate company access
  await validateCompanyAccess(input.sessionId, input.companyId);

  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompany(input.companyId);

  if (!company) {
    throw new NotFoundError('Company not found');
  }

  return company;
}

