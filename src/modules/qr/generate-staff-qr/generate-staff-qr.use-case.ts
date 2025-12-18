import { getStaffProfilesRepository, getCompaniesRepository } from '@/src/service-locator';
import { getQRCodeService } from '@/src/service-locator';
import { NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';

export async function generateStaffQRUseCase(input: {
  companyId: string;
  staffProfileId: string;
  sessionId: string;
  baseUrl: string;
}): Promise<{ url: string; dataUrl: string; svg: string }> {
  // Validate company access
  await validateCompanyAccess(input.sessionId, input.companyId);

  // Verify company and staff exist
  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompany(input.companyId);
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  const staffProfilesRepository = getStaffProfilesRepository();
  const staff = await staffProfilesRepository.getStaffProfile(input.staffProfileId);
  if (!staff || staff.companyId !== input.companyId) {
    throw new NotFoundError('Staff profile not found');
  }

  if (!staff.active) {
    throw new NotFoundError('Staff profile is not active');
  }

  // Generate QR code URL
  const qrCodeService = getQRCodeService();
  const url = qrCodeService.generateStaffTippingUrl(staff.publicId, input.baseUrl);

  // Generate QR code images
  const dataUrl = await qrCodeService.generateDataURL(url, { size: 400 });
  const svg = await qrCodeService.generateSVG(url, { size: 400 });

  return { url, dataUrl, svg };
}

