import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/config';
import { getTipsRepository } from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import { InputParseError } from '@/src/shared/errors/common';
import { UnauthenticatedError, UnauthorizedError } from '@/src/shared/errors/auth';

const markTipsAsPaidSchema = z.object({
  companyId: z.string(),
  tipIds: z.array(z.string()).min(1),
});

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
    const branchId = searchParams.get('branchId');
    const staffProfileId = searchParams.get('staffProfileId');
    const distributionStatus = searchParams.get('distributionStatus') as 'PENDING' | 'PAID' | null;
    const paymentStatus = searchParams.get('paymentStatus') as 'SUCCEEDED' | 'PENDING' | 'FAILED' | null;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    await validateCompanyAccess(sessionId, companyId);

    const tipsRepository = getTipsRepository();
    const tips = await tipsRepository.getTipsByCompany(companyId, {
      branchId: branchId || undefined,
      staffProfileId: staffProfileId || undefined,
      distributionStatus: distributionStatus || undefined,
      paymentStatus: paymentStatus || undefined,
      startDate,
      endDate,
    });

    return NextResponse.json({ tips });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Get tips error:', err);
    return NextResponse.json(
      { error: 'An error happened while fetching tips.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
    const data = markTipsAsPaidSchema.parse(body);

    await validateCompanyAccess(sessionId, data.companyId, 'ADMIN');

    if (data.tipIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    const tipsRepository = getTipsRepository();
    const { getTransactionManagerService } = await import('@/src/service-locator');
    const transactionService = getTransactionManagerService();

    const tips = await tipsRepository.getTipsByCompany(data.companyId, {
      distributionStatus: 'PENDING',
      paymentStatus: 'SUCCEEDED',
    });

    const validTipIds = tips.filter((tip) => data.tipIds.includes(tip.id)).map((tip) => tip.id);

    if (validTipIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid tips found to mark as paid' },
        { status: 400 }
      );
    }

    await transactionService.startTransaction(async (tx) => {
      return tipsRepository.markTipsAsPaid(validTipIds, tx);
    });

    return NextResponse.json({ success: true });
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
        { error: 'You do not have permission to mark tips as paid' },
        { status: 403 }
      );
    }

    console.error('Mark tips paid error:', err);
    return NextResponse.json(
      { error: 'An error happened while marking tips as paid. Please try again later.' },
      { status: 500 }
    );
  }
}


