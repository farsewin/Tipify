import { getBranchesRepository, getCompaniesRepository } from '@/src/service-locator';
import { getQRCodeService } from '@/src/service-locator';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function generateBranchQRUseCase(input: {
  companyId: string;
  branchId: string;
  sessionId: string;
  baseUrl: string;
}): Promise<{ url: string; dataUrl: string; svg: string }> {
  // Validate company access
  await validateCompanyAccess(input.sessionId, input.companyId);

  // Verify company and branch exist
  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompany(input.companyId);
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  const branchesRepository = getBranchesRepository();
  const branch = await branchesRepository.getBranch(input.branchId);
  if (!branch || branch.companyId !== input.companyId) {
    throw new NotFoundError('Branch not found');
  }

  // Generate QR code URL
  const qrCodeService = getQRCodeService();
  const url = qrCodeService.generateBranchTippingUrl(
    company.slug,
    branch.slug,
    input.baseUrl
  );

  // Generate QR code images
  const dataUrl = await qrCodeService.generateDataURL(url, { size: 400 });
  const svg = await qrCodeService.generateSVG(url, { size: 400 });

  return { url, dataUrl, svg };
}

