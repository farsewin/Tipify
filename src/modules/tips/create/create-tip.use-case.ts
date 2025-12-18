import { generateIdFromEntropySize } from 'lucia';
import {
  getTipsRepository,
  getStaffProfilesRepository,
  getCompaniesRepository,
  getBranchesRepository,
} from '@/src/service-locator';
import type { Tip } from '@/src/modules/tips/tip.model';
import { InputParseError, NotFoundError } from '@/src/modules/shared/errors/common';
import { getTransactionManagerService } from '@/src/service-locator';

export async function createTipUseCase(input: {
  companyId: string;
  branchId: string;
  staffProfileId: string;
  amount: number; // Amount in cents
  currency: string;
  paymentProviderTransactionId: string;
  customerNote?: string;
  customerRating?: number;
}): Promise<Tip> {
  // Validate input
  if (input.amount < 500) {
    // Minimum 5.00 in currency units (500 cents)
    throw new InputParseError('Tip amount must be at least 5.00');
  }

  if (input.amount > 1000000) {
    // Maximum 10,000.00 in currency units (1,000,000 cents)
    throw new InputParseError('Tip amount cannot exceed 10,000.00');
  }

  // Verify company exists and subscription is active
  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompany(input.companyId);
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  if (company.subscriptionStatus === 'CANCELED') {
    throw new InputParseError('Company subscription has been canceled');
  }

  // Verify branch exists and belongs to company
  const branchesRepository = getBranchesRepository();
  const branch = await branchesRepository.getBranch(input.branchId);
  if (!branch || branch.companyId !== input.companyId || !branch.active) {
    throw new NotFoundError('Branch not found or inactive');
  }

  // Verify staff profile exists and is active
  const staffProfilesRepository = getStaffProfilesRepository();
  const staff = await staffProfilesRepository.getStaffProfile(input.staffProfileId);
  if (!staff || staff.companyId !== input.companyId || !staff.active) {
    throw new NotFoundError('Staff profile not found or inactive');
  }

  // Verify currency matches company currency
  if (input.currency !== company.currency) {
    throw new InputParseError('Currency mismatch');
  }

  // Validate rating if provided
  if (input.customerRating !== undefined) {
    if (input.customerRating < 1 || input.customerRating > 5) {
      throw new InputParseError('Rating must be between 1 and 5');
    }
  }

  // Create tip
  const tipsRepository = getTipsRepository();
  const tipId = generateIdFromEntropySize(10);

  const tip = await tipsRepository.createTip({
    id: tipId,
    companyId: input.companyId,
    branchId: input.branchId,
    staffProfileId: input.staffProfileId,
    amount: input.amount,
    currency: input.currency,
    paymentStatus: 'SUCCEEDED', // Payment already processed
    distributionStatus: 'PENDING',
    paymentProvider: 'LOCAL_GATEWAY', // Will be updated when real gateway is integrated
    paymentProviderTransactionId: input.paymentProviderTransactionId,
    customerNote: input.customerNote || null,
    customerRating: input.customerRating || null,
  });

  return tip;
}

