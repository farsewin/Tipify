import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { generateIdFromEntropySize } from 'lucia';
import { SESSION_COOKIE } from '@/config';
import {
  getCompaniesRepository,
  getAuthenticationService,
  getTipsRepository,
  getTransactionManagerService,
  getPayoutBatchesRepository,
  getPayoutItemsRepository,
} from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import { NotFoundError, InputParseError } from '@/src/shared/errors/common';
import { UnauthenticatedError, UnauthorizedError } from '@/src/shared/errors/auth';

const createPayoutBatchSchema = z.object({
  companyId: z.string(),
  branchId: z.string().optional(),
  payoutDate: z.string().transform((str) => new Date(str)),
  tipIds: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createPayoutBatchSchema.parse(body);

    await validateCompanyAccess(sessionId, parsed.companyId, 'ADMIN');

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(parsed.companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const tipsRepository = getTipsRepository();
    const transactionService = getTransactionManagerService();

    const pendingTips = await tipsRepository.getPendingTipsByCompany(
      parsed.companyId,
      parsed.branchId
    );

    const validTipIds = pendingTips
      .filter((tip) => parsed.tipIds.includes(tip.id))
      .map((tip) => tip.id);

    if (validTipIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid pending tips found' },
        { status: 400 }
      );
    }

    const staffTotals = new Map<string, { amount: number; tipIds: string[] }>();

    for (const tip of pendingTips) {
      if (validTipIds.includes(tip.id)) {
        const existing = staffTotals.get(tip.staffProfileId) || {
          amount: 0,
          tipIds: [],
        };
        existing.amount += tip.amount;
        existing.tipIds.push(tip.id);
        staffTotals.set(tip.staffProfileId, existing);
      }
    }

    const result = await transactionService.startTransaction(async (tx) => {
      const totalAmount = Array.from(staffTotals.values()).reduce(
        (sum, item) => sum + item.amount,
        0
      );

      const payoutBatchesRepository = getPayoutBatchesRepository();
      const payoutBatchId = generateIdFromEntropySize(10);

      const payoutBatch = await payoutBatchesRepository.createPayoutBatch(
        {
          id: payoutBatchId,
          companyId: parsed.companyId,
          branchId: parsed.branchId || null,
          processedByUserId: user.id,
          payoutDate: parsed.payoutDate,
          totalAmount,
        },
        tx
      );

      const payoutItemsRepository = getPayoutItemsRepository();
      const payoutItems: any[] = [];

      for (const [staffProfileId, totals] of staffTotals.entries()) {
        const payoutItemId = generateIdFromEntropySize(10);
        const payoutItem = await payoutItemsRepository.createPayoutItem(
          {
            id: payoutItemId,
            payoutBatchId: payoutBatch.id,
            staffProfileId,
            amount: totals.amount,
          },
          tx
        );
        payoutItems.push(payoutItem);
      }

      await tipsRepository.markTipsAsPaid(validTipIds, tx);

      return { payoutBatch, payoutItems };
    });

    return NextResponse.json({ success: true, payoutBatchId: result.payoutBatch.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }

    if (err instanceof InputParseError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'You do not have permission to create payout batches' },
        { status: 403 }
      );
    }

    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404 }
      );
    }

    console.error('Create payout batch error:', err);
    return NextResponse.json(
      { error: 'An error happened while creating the payout batch. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Must be logged in' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await validateCompanyAccess(sessionId, companyId);

    const { getPayoutBatchesRepository } = await import('@/src/service-locator');
    const payoutBatchesRepository = getPayoutBatchesRepository();
    const payoutBatches = await payoutBatchesRepository.getPayoutBatchesByCompany(companyId);

    return NextResponse.json({ payoutBatches });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get payout batches error:', err);
    return NextResponse.json(
      { error: 'An error happened while fetching payout batches.' },
      { status: 500 }
    );
  }
}


