import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/config';
import { getPayoutBatchesRepository, getPayoutItemsRepository, getTransactionManagerService } from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import { NotFoundError, InputParseError } from '@/src/shared/errors/common';
import { UnauthenticatedError, UnauthorizedError } from '@/src/shared/errors/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ payoutBatchId: string }> }
) {
  try {
    const { payoutBatchId } = await params;
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

    const payoutBatchesRepository = getPayoutBatchesRepository();
    const payoutBatch = await payoutBatchesRepository.getPayoutBatch(payoutBatchId);

    if (!payoutBatch) {
      return NextResponse.json(
        { error: 'Payout batch not found' },
        { status: 404 }
      );
    }

    if (payoutBatch.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Payout batch not found' },
        { status: 404 }
      );
    }

    const payoutItemsRepository = getPayoutItemsRepository();
    const payoutItems = await payoutItemsRepository.getPayoutItemsByBatch(payoutBatchId);

    return NextResponse.json({ payoutBatch, payoutItems });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get payout batch details error:', err);
    return NextResponse.json(
      { error: 'An error happened while fetching payout batch details.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ payoutBatchId: string }> }
) {
  try {
    const { payoutBatchId } = await params;
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

    await validateCompanyAccess(sessionId, companyId, 'ADMIN');

    const payoutBatchesRepository = getPayoutBatchesRepository();
    const payoutBatch = await payoutBatchesRepository.getPayoutBatch(payoutBatchId);

    if (!payoutBatch) {
      return NextResponse.json(
        { error: 'Payout batch not found' },
        { status: 404 }
      );
    }

    if (payoutBatch.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Payout batch not found' },
        { status: 404 }
      );
    }

    if (payoutBatch.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Payout batch is already completed' },
        { status: 400 }
      );
    }

    const transactionService = getTransactionManagerService();
    await transactionService.startTransaction(async (tx) => {
      return payoutBatchesRepository.markPayoutBatchAsCompleted(payoutBatchId, tx);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof InputParseError) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'You do not have permission to complete payout batches' },
        { status: 403 }
      );
    }

    console.error('Complete payout batch error:', err);
    return NextResponse.json(
      { error: 'An error happened while completing the payout batch. Please try again later.' },
      { status: 500 }
    );
  }
}

