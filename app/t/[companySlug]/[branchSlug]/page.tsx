import { getCompaniesRepository } from '@/src/service-locator';
import { getBranchesRepository } from '@/src/service-locator';
import { getStaffProfilesRepository } from '@/src/service-locator';
import { notFound } from 'next/navigation';
import BranchTippingPage from './branch-tipping-client';

async function getBranchData(companySlug: string, branchSlug: string) {
  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  // Check subscription status
  if (company.subscriptionStatus === 'CANCELED') {
    return { company, branch: null, staff: [] };
  }

  const branchesRepository = getBranchesRepository();
  const branch = await branchesRepository.getBranchBySlugAndCompany(
    branchSlug,
    company.id
  );

  if (!branch || !branch.active) {
    notFound();
  }

  const staffProfilesRepository = getStaffProfilesRepository();
  const staff =
    await staffProfilesRepository.getActiveStaffProfilesByBranch(branch.id);

  return { company, branch, staff };
}

export default async function BranchTippingPageServer({
  params,
}: {
  params: Promise<{ companySlug: string; branchSlug: string }>;
}) {
  // ✅ IMPORTANT: unwrap params
  const { companySlug, branchSlug } = await params;

  const { company, branch, staff } = await getBranchData(
    companySlug,
    branchSlug
  );

  if (!branch) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Service Unavailable</h1>
        <p className="text-muted-foreground">
          This company&apos;s subscription has been canceled.
        </p>
      </div>
    );
  }

  return <BranchTippingPage company={company} branch={branch} staff={staff} />;
}
