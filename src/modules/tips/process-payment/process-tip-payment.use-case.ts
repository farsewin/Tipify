import {
  getPaymentService,
  getStaffProfilesRepository,
  getCompaniesRepository,
} from '@/src/service-locator';
import { createTipUseCase } from '../create/create-tip.use-case';
import { InputParseError, NotFoundError } from '@/src/modules/shared/errors/common';
import { getTransactionManagerService } from '@/src/service-locator';
import type { Tip } from '@/src/modules/tips/tip.model';

export async function processTipPaymentUseCase(input: {
  companyId: string;
  branchId: string;
  staffProfileId: string;
  amount: number; // Amount in cents
  currency: string;
  customerNote?: string;
  customerRating?: number;
}): Promise<{ tip: Tip; paymentResponse: any }> {
  // Validate minimum amount
  if (input.amount < 500) {
    // Minimum 5.00 in currency units
    throw new InputParseError('Tip amount must be at least 5.00');
  }

  // Verify company exists
  const companiesRepository = getCompaniesRepository();
  const company = await companiesRepository.getCompany(input.companyId);
  if (!company) {
    throw new NotFoundError('Company not found');
  }

  // Verify staff exists
  const staffProfilesRepository = getStaffProfilesRepository();
  const staff = await staffProfilesRepository.getStaffProfile(input.staffProfileId);
  if (!staff || staff.companyId !== input.companyId) {
    throw new NotFoundError('Staff profile not found');
  }

  const paymentService = getPaymentService();
  const transactionService = getTransactionManagerService();

  // Process payment and create tip in a transaction
  const result = await transactionService.startTransaction(async (tx) => {
    // Process payment
    const paymentResponse = await paymentService.processPayment({
      amount: input.amount,
      currency: input.currency,
      description: `Tip for ${staff.displayName}`,
      metadata: {
        companyId: input.companyId,
        branchId: input.branchId,
        staffProfileId: input.staffProfileId,
      },
    });

    if (!paymentResponse.success || paymentResponse.status !== 'SUCCEEDED') {
      throw new Error(paymentResponse.message || 'Payment failed');
    }

    // Create tip record
    const tip = await createTipUseCase({
      companyId: input.companyId,
      branchId: input.branchId,
      staffProfileId: input.staffProfileId,
      amount: input.amount,
      currency: input.currency,
      paymentProviderTransactionId: paymentResponse.transactionId,
      customerNote: input.customerNote,
      customerRating: input.customerRating,
    });

    return { tip, paymentResponse };
  });

  return result;
}

