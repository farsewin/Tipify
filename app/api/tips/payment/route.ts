import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getCompaniesRepository,
  getBranchesRepository,
  getStaffProfilesRepository,
  getPaymentService,
  getTransactionManagerService,
  getTipsRepository,
} from '@/src/service-locator';
import { NotFoundError, InputParseError } from '@/src/shared/errors/common';

const processTipPaymentSchema = z.object({
  companyId: z.string(),
  branchId: z.string(),
  staffProfileId: z.string(),
  amount: z.number().int().positive().min(500),
  customerNote: z.string().max(500).optional(),
  customerRating: z.number().int().min(1).max(5).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = processTipPaymentSchema.parse(body);

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(data.companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const staffProfilesRepository = getStaffProfilesRepository();
    const staff = await staffProfilesRepository.getStaffProfile(
      data.staffProfileId
    );
    if (!staff || staff.companyId !== data.companyId) {
      return NextResponse.json(
        { error: 'Staff profile not found' },
        { status: 404 }
      );
    }

    const branchesRepository = getBranchesRepository();
    const branch = await branchesRepository.getBranch(data.branchId);
    if (!branch || branch.companyId !== data.companyId || !branch.active) {
      return NextResponse.json(
        { error: 'Branch not found or inactive' },
        { status: 404 }
      );
    }

    const paymentService = getPaymentService();
    const transactionService = getTransactionManagerService();
    const tipsRepository = getTipsRepository();

    const result = await transactionService.startTransaction(async (tx) => {
      const paymentResponse = await paymentService.processPayment({
        amount: data.amount,
        currency: 'QAR',
        description: `Tip for ${staff.displayName}`,
        metadata: {
          companyId: data.companyId,
          branchId: data.branchId,
          staffProfileId: data.staffProfileId,
        },
      });

      if (!paymentResponse.success || paymentResponse.status !== 'SUCCEEDED') {
        throw new Error(paymentResponse.message || 'Payment failed');
      }

      const tipId = crypto.randomUUID();
      console.log('💰 [Tips Payment API] Creating tip with ID:', tipId);
      const tip = await tipsRepository.createTip(
        {
          id: tipId,
          companyId: data.companyId,
          branchId: data.branchId,
          staffProfileId: data.staffProfileId,
          amount: data.amount,
          paymentProvider: 'LOCAL_GATEWAY',
          paymentProviderTransactionId: paymentResponse.transactionId,
          paymentStatus: 'SUCCEEDED',
          customerNote: data.customerNote || null,
          customerRating: data.customerRating || null,
        },
        tx
      );

      return { tip, paymentResponse };
    });

    return NextResponse.json({
      success: true,
      tipId: result.tip.id,
      transactionId: result.paymentResponse.transactionId,
    });
  } catch (err) {
    console.error('Process tip payment error:', err);

    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    if (err instanceof InputParseError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          'An error happened while processing the payment. Please try again later.',
      },
      { status: 500 }
    );
  }
}
