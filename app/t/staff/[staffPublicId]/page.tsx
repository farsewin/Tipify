import { getStaffProfilesRepository } from '@/src/service-locator';
import { getCompaniesRepository } from '@/src/service-locator';
import { notFound } from 'next/navigation';
import StaffTippingPage from './staff-tipping-client';

type PageProps = {
  params: Promise<{
    staffPublicId: string;
  }>;
};

async function getStaffData(staffPublicId: string) {
  const staffProfilesRepository = getStaffProfilesRepository();
  const staff =
    await staffProfilesRepository.getStaffProfileByPublicId(staffPublicId);

  if (!staff || !staff.active) {
    notFound();
  }

  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompany(staff.companyId);

  if (!company) {
    notFound();
  }

  // Subscription canceled → show unavailable message
  if (company.subscriptionStatus === 'CANCELED') {
    return { company, staff: null };
  }

  return { company, staff };
}

export default async function StaffTippingPageServer({ params }: PageProps) {
  const { staffPublicId } = await params;

  // Defensive guard (recommended)
  if (!staffPublicId) {
    notFound();
  }

  const { company, staff } = await getStaffData(staffPublicId);

  if (!staff) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Service Unavailable</h1>
        <p className="text-muted-foreground">
          This company&apos;s subscription has been canceled.
        </p>
      </div>
    );
  }

  return <StaffTippingPage company={company} staff={staff} />;
}
