import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/config';
import { getCompaniesRepository, getStaffProfilesRepository, getQRCodeService } from '@/src/service-locator';
import { validateCompanyAccess } from '@/src/shared/helpers/access-control';
import { NotFoundError } from '@/src/shared/errors/common';
import { UnauthenticatedError, UnauthorizedError } from '@/src/shared/errors/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ staffProfileId: string }> }
) {
  try {
    const { staffProfileId } = await params;
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

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(companyId);
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const staffProfilesRepository = getStaffProfilesRepository();
    const staff = await staffProfilesRepository.getStaffProfile(staffProfileId);
    if (!staff || staff.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Staff profile not found' },
        { status: 404 }
      );
    }

    if (!staff.active) {
      return NextResponse.json(
        { error: 'Staff profile is not active' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrCodeService = getQRCodeService();
    const url = qrCodeService.generateStaffTippingUrl(staff.publicId, baseUrl);

    const dataUrl = await qrCodeService.generateDataURL(url, { size: 400 });
    const svg = await qrCodeService.generateSVG(url, { size: 400 });

    return NextResponse.json({ url, dataUrl, svg });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'You do not have permission to generate QR codes' },
        { status: 403 }
      );
    }
    console.error('Generate staff QR error:', err);
    return NextResponse.json(
      { error: 'An error happened while generating QR code. Please try again later.' },
      { status: 500 }
    );
  }
}

