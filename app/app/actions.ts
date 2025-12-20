'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/config';
import { InputParseError } from '@/src/modules/shared/errors/common';
import {
  AuthenticationError,
  UnauthenticatedError,
  UnauthorizedError,
} from '@/src/modules/shared/errors/auth';
import { createBranchController } from '@/src/modules/branch/create/create-branch.controller';
import { getBranchesController } from '@/src/modules/branch/list/get-branches.controller';
import { updateBranchController } from '@/src/modules/branch/update/update-branch.controller';
import { getCompanyController } from '@/src/modules/company/get/get-company.controller';
import { getUserCompanies } from '@/src/modules/shared/helpers/access-control';
import { getAuthenticationService } from '@/src/service-locator';
import { createStaffProfileController } from '@/src/modules/staff/create/create-staff-profile.controller';
import { getStaffProfilesController } from '@/src/modules/staff/list/get-staff-profiles.controller';
import { updateStaffProfileController } from '@/src/modules/staff/update/update-staff-profile.controller';
import { getTipsController } from '@/src/modules/tips/list/get-tips.controller';
import { markTipsPaidController } from '@/src/modules/tips/mark-paid/mark-tips-paid.controller';
import { generateBranchQRController } from '@/src/modules/qr/generate-branch-qr/generate-branch-qr.controller';
import { generateStaffQRController } from '@/src/modules/qr/generate-staff-qr/generate-staff-qr.controller';
import { processTipPaymentController } from '@/src/modules/tips/process-payment/process-tip-payment.controller';
import { createPayoutBatchController } from '@/src/modules/payouts/create/create-payout-batch.controller';
import { getPayoutBatchesController } from '@/src/modules/payouts/list/get-payout-batches.controller';
import { getPayoutBatchDetailsController } from '@/src/modules/payouts/get/get-payout-batch-details.controller';
import { completePayoutBatchController } from '@/src/modules/payouts/complete/complete-payout-batch.controller';
import { getStaffTipsController } from '@/src/modules/tips/get-staff-tips/get-staff-tips.controller';
import { getMyStaffProfileController } from '@/src/modules/staff/get-my-staff-profile/get-my-staff-profile.controller';
import { updateCompanyController } from '@/src/modules/company/update/update-company.controller';
import { updatePasswordController } from '@/src/modules/auth/update-password/update-password.controller';

// ============================================
// COMPANY ACTIONS
// ============================================

export async function getCompany(companyId: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/sign-in');
    }

    return await getCompanyController({ companyId, sessionId });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get company error:', err);
    throw err;
  }
}

export async function getUserCompaniesList() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/sign-in');
    }

    return await getUserCompanies(sessionId);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    console.error('Get user companies error:', err);
    throw err;
  }
}

// ============================================
// BRANCH ACTIONS
// ============================================

export async function createBranch(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const data = Object.fromEntries(formData.entries());
    const companyId = data.companyId?.toString();

    if (!companyId) {
      return { error: 'Company ID is required' };
    }

    await createBranchController({
      companyId,
      name: data.name?.toString() || '',
      location: data.location?.toString(),
      timezone: data.timezone?.toString(),
      sessionId,
    });

    revalidatePath('/app/branches');
    return { success: true };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to create branches' };
    }
    console.error('Create branch error:', err);
    return {
      error: 'An error happened while creating the branch. Please try again later.',
    };
  }
}

export async function getBranches(companyId: string, activeOnly?: boolean) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/sign-in');
    }

    return await getBranchesController({ companyId, sessionId, activeOnly });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get branches error:', err);
    throw err;
  }
}

export async function updateBranch(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const data = Object.fromEntries(formData.entries());
    const branchId = data.branchId?.toString();
    const companyId = data.companyId?.toString();

    if (!branchId || !companyId) {
      return { error: 'Branch ID and Company ID are required' };
    }

    const updates: any = {};
    if (data.name) updates.name = data.name.toString();
    if (data.location !== undefined) updates.location = data.location.toString() || null;
    if (data.timezone) updates.timezone = data.timezone.toString();
    if (data.active !== undefined) updates.active = data.active === 'true';

    await updateBranchController({
      branchId,
      companyId,
      updates,
      sessionId,
    });

    revalidatePath('/app/branches');
    return { success: true };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to update branches' };
    }
    console.error('Update branch error:', err);
    return {
      error: 'An error happened while updating the branch. Please try again later.',
    };
  }
}

// ============================================
// STAFF ACTIONS
// ============================================

export async function createStaff(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const data = Object.fromEntries(formData.entries());
    const companyId = data.companyId?.toString();
    const branchId = data.branchId?.toString();

    if (!companyId || !branchId) {
      return { error: 'Company ID and Branch ID are required' };
    }

    const email = data.email?.toString();
    const password = data.password?.toString();

    if (!email || !password) {
      return { error: 'Email and password are required' };
    }

    await createStaffProfileController({
      companyId,
      branchId,
      displayName: data.displayName?.toString() || '',
      email,
      password,
      position: data.position?.toString() || undefined,
      avatarUrl: data.avatarUrl?.toString() || undefined,
      sessionId,
    });

    revalidatePath('/app/staff');
    return { success: true };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError) {
      return { error: 'You must be logged in to create staff' };
    }
    if (err instanceof UnauthorizedError) {
      // Include the actual error message to help debug
      console.error('Unauthorized error creating staff:', err.message);
      return { error: err.message || 'You do not have permission to create staff' };
    }
    console.error('Create staff error:', err);
    return {
      error: 'An error happened while creating the staff profile. Please try again later.',
    };
  }
}

export async function getStaff(companyId: string, branchId?: string, activeOnly?: boolean) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/sign-in');
    }

    return await getStaffProfilesController({ companyId, branchId, activeOnly, sessionId });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get staff error:', err);
    throw err;
  }
}

export async function updateStaff(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const data = Object.fromEntries(formData.entries());
    const staffProfileId = data.staffProfileId?.toString();
    const companyId = data.companyId?.toString();

    if (!staffProfileId || !companyId) {
      return { error: 'Staff Profile ID and Company ID are required' };
    }

    const updates: any = {};
    if (data.displayName) updates.displayName = data.displayName.toString();
    if (data.position) updates.position = data.position.toString();
    if (data.avatarUrl) updates.avatarUrl = data.avatarUrl.toString();
    if (data.active !== undefined) updates.active = data.active === 'true';
    if (data.branchId) updates.branchId = data.branchId.toString();

    await updateStaffProfileController({
      staffProfileId,
      companyId,
      updates,
      sessionId,
    });

    revalidatePath('/app/staff');
    return { success: true };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to update staff' };
    }
    console.error('Update staff error:', err);
    return {
      error: 'An error happened while updating the staff profile. Please try again later.',
    };
  }
}

// ============================================
// TIPS ACTIONS
// ============================================

export async function getTips(
  companyId: string,
  filters?: {
    branchId?: string;
    staffProfileId?: string;
    distributionStatus?: 'PENDING' | 'PAID';
    paymentStatus?: 'SUCCEEDED' | 'PENDING' | 'FAILED';
    startDate?: Date;
    endDate?: Date;
  }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/sign-in');
    }

    return await getTipsController({
      companyId,
      ...filters,
      sessionId,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get tips error:', err);
    throw err;
  }
}

export async function markTipsAsPaid(companyId: string, tipIds: string[]) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    await markTipsPaidController({
      companyId,
      tipIds,
      sessionId,
    });

    revalidatePath('/app/tips');
    return { success: true };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to mark tips as paid' };
    }
    console.error('Mark tips paid error:', err);
    return {
      error: 'An error happened while marking tips as paid. Please try again later.',
    };
  }
}

// ============================================
// QR CODE ACTIONS
// ============================================

export async function generateBranchQR(companyId: string, branchId: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return await generateBranchQRController({
      companyId,
      branchId,
      sessionId,
      baseUrl,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to generate QR codes' };
    }
    console.error('Generate branch QR error:', err);
    return {
      error: 'An error happened while generating QR code. Please try again later.',
    };
  }
}

export async function generateStaffQR(companyId: string, staffProfileId: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return await generateStaffQRController({
      companyId,
      staffProfileId,
      sessionId,
      baseUrl,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to generate QR codes' };
    }
    console.error('Generate staff QR error:', err);
    return {
      error: 'An error happened while generating QR code. Please try again later.',
    };
  }
}

// ============================================
// TIP PAYMENT ACTIONS (Public)
// ============================================

export async function processTipPayment(formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries());
    const companyId = data.companyId?.toString();
    const branchId = data.branchId?.toString();
    const staffProfileId = data.staffProfileId?.toString();
    const amount = data.amount?.toString();
    const currency = data.currency?.toString();
    const customerNote = data.customerNote?.toString();
    const customerRating = data.customerRating?.toString();

    if (!companyId || !branchId || !staffProfileId || !amount || !currency) {
      return { error: 'Missing required fields' };
    }

    const amountInCents = parseInt(amount, 10);
    if (isNaN(amountInCents) || amountInCents < 500) {
      return { error: 'Invalid amount. Minimum is 5.00' };
    }

    const result = await processTipPaymentController({
      companyId,
      branchId,
      staffProfileId,
      amount: amountInCents,
      currency,
      customerNote: customerNote || undefined,
      customerRating: customerRating ? parseInt(customerRating, 10) : undefined,
    });

    return {
      success: true,
      tipId: result.tip.id,
      transactionId: result.paymentResponse.transactionId,
    };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    console.error('Process tip payment error:', err);
    return {
      error: 'An error happened while processing the payment. Please try again later.',
    };
  }
}

// ============================================
// PAYOUT BATCH ACTIONS
// ============================================

export async function createPayoutBatch(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const data = Object.fromEntries(formData.entries());
    const companyId = data.companyId?.toString();
    const branchId = data.branchId?.toString();
    const tipIds = data.tipIds?.toString().split(',').filter(Boolean) || [];
    const payoutDate = data.payoutDate?.toString();

    if (!companyId || !payoutDate || tipIds.length === 0) {
      return { error: 'Missing required fields' };
    }

    // Get current user
    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const result = await createPayoutBatchController({
      companyId,
      branchId: branchId || undefined,
      processedByUserId: user.id,
      payoutDate: new Date(payoutDate),
      tipIds,
      sessionId,
    });

    revalidatePath('/app/payouts');
    return { success: true, payoutBatchId: result.payoutBatch.id };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to create payout batches' };
    }
    console.error('Create payout batch error:', err);
    return {
      error: 'An error happened while creating the payout batch. Please try again later.',
    };
  }
}

export async function getPayoutBatches(companyId: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/sign-in');
    }

    return await getPayoutBatchesController({ companyId, sessionId });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get payout batches error:', err);
    throw err;
  }
}

export async function getPayoutBatchDetails(companyId: string, payoutBatchId: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/sign-in');
    }

    return await getPayoutBatchDetailsController({
      payoutBatchId,
      companyId,
      sessionId,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get payout batch details error:', err);
    throw err;
  }
}

export async function completePayoutBatch(companyId: string, payoutBatchId: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    await completePayoutBatchController({
      payoutBatchId,
      companyId,
      sessionId,
    });

    revalidatePath('/app/payouts');
    return { success: true };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to complete payout batches' };
    }
    console.error('Complete payout batch error:', err);
    return {
      error: 'An error happened while completing the payout batch. Please try again later.',
    };
  }
}

// ============================================
// STAFF DASHBOARD ACTIONS
// ============================================

export async function getMyStaffProfile() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/sign-in');
    }

    return await getMyStaffProfileController({ sessionId });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    console.error('Get my staff profile error:', err);
    throw err;
  }
}

export async function getMyStaffTips(startDate?: Date, endDate?: Date) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      redirect('/sign-in');
    }

    // Get staff profile first
    const staffProfile = await getMyStaffProfileController({ sessionId });

    if (!staffProfile) {
      return [];
    }

    return await getStaffTipsController({
      staffProfileId: staffProfile.id,
      sessionId,
      startDate,
      endDate,
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/sign-in');
    }
    console.error('Get my staff tips error:', err);
    throw err;
  }
}

// ============================================
// SETTINGS ACTIONS
// ============================================

export async function updateCompanySettings(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const data = Object.fromEntries(formData.entries());
    const companyId = data.companyId?.toString();

    if (!companyId) {
      return { error: 'Company ID is required' };
    }

    await updateCompanyController({
      companyId,
      updates: {
        name: data.name?.toString(),
        legalName: data.legalName?.toString() || undefined,
        country: data.country?.toString(),
        currency: data.currency?.toString(),
      },
      sessionId,
    });

    revalidatePath('/app/settings');
    return { success: true };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to update company settings' };
    }
    console.error('Update company settings error:', err);
    return {
      error: 'An error happened while updating company settings. Please try again later.',
    };
  }
}

export async function updateAccountSettings(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const data = Object.fromEntries(formData.entries());

    // Update user info
    const { getUsersRepository } = await import('@/src/service-locator');
    const usersRepository = getUsersRepository();
    await usersRepository.updateUser(user.id, {
      name: data.name?.toString(),
      email: data.email?.toString(),
    });

    revalidatePath('/app/settings');
    return { success: true };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError) {
      return { error: 'Must be logged in' };
    }
    console.error('Update account settings error:', err);
    return {
      error: 'An error happened while updating account settings. Please try again later.',
    };
  }
}

export async function updatePassword(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { error: 'Must be logged in' };
    }

    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const data = Object.fromEntries(formData.entries());

    await updatePasswordController({
      userId: user.id,
      currentPassword: data.currentPassword?.toString() || '',
      newPassword: data.newPassword?.toString() || '',
      confirmPassword: data.confirmPassword?.toString() || '',
    });

    revalidatePath('/app/settings');
    return { success: true };
  } catch (err) {
    if (err instanceof InputParseError) {
      return { error: err.message };
    }
    if (err instanceof UnauthenticatedError) {
      return { error: 'Must be logged in' };
    }
    console.error('Update password error:', err);
    return {
      error: 'An error happened while updating password. Please try again later.',
    };
  }
}

