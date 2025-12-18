import { generateIdFromEntropySize } from 'lucia';
import { getCompaniesRepository, getCompanyMembersRepository } from '@/src/service-locator';
import type { Company } from '@/src/modules/company/company.model';
import type { CompanyMember } from '@/src/modules/company/company-member.model';
import { InputParseError } from '@/src/modules/shared/errors/common';
import { getTransactionManagerService } from '@/src/service-locator';

export async function createCompanyUseCase(input: {
  name: string;
  legalName?: string;
  country: string;
  currency: string;
  userId: string; // The user creating the company (will become OWNER)
}): Promise<{ company: Company; companyMember: CompanyMember }> {
  // Validate input
  if (input.name.length < 1 || input.name.length > 100) {
    throw new InputParseError('Company name must be between 1 and 100 characters');
  }

  if (input.currency.length !== 3) {
    throw new InputParseError('Currency must be a valid 3-letter ISO code');
  }

  // Generate slug from company name
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Check if slug is already taken (in a real app, you'd want to handle this better)
  const companiesRepository = getCompaniesRepository();
  const existingCompany = await companiesRepository.getCompanyBySlug(slug);
  if (existingCompany) {
    throw new InputParseError('A company with this name already exists');
  }

  const transactionService = getTransactionManagerService();
  const companyMembersRepository = getCompanyMembersRepository();

  // Create company and company member in a transaction
  const result = await transactionService.startTransaction(async (tx) => {
    // Create company
    const companyId = generateIdFromEntropySize(10);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    const company = await companiesRepository.createCompany(
      {
        id: companyId,
        name: input.name,
        legalName: input.legalName,
        slug: `${slug}-${companyId.slice(0, 6)}`, // Add unique suffix
        country: input.country,
        currency: input.currency,
        subscriptionPlan: 'BASIC',
        subscriptionStatus: 'TRIALING',
        trialEndsAt,
      },
      tx
    );

    // Create company member (OWNER)
    const companyMemberId = generateIdFromEntropySize(10);
    const companyMember = await companyMembersRepository.createCompanyMember(
      {
        id: companyMemberId,
        userId: input.userId,
        companyId: company.id,
        role: 'OWNER',
      },
      tx
    );

    return { company, companyMember };
  });

  return result;
}

