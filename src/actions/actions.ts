'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, PASSWORD_SALT_ROUNDS } from '@/config';
import { z } from 'zod';
import { hash } from 'bcrypt-ts';
import { generateIdFromEntropySize } from 'lucia';
import {
  getBranchesRepository,
  getCompaniesRepository,
  getStaffProfilesRepository,
  getUsersRepository,
  getCompanyMembersRepository,
  getTipsRepository,
  getPayoutBatchesRepository,
  getPayoutItemsRepository,
  getAuthenticationService,
  getTransactionManagerService,
  getQRCodeService,
  getPaymentService,
} from '@/src/service-locator';
import {
  validateCompanyAccess,
  getUserCompanies,
} from '@/src/shared/helpers/access-control';
import {
  InputParseError,
  NotFoundError,
} from '@/src/shared/errors/common';
import {
  UnauthenticatedError,
  UnauthorizedError,
  AuthenticationError,
} from '@/src/shared/errors/auth';

// ============================================
// HELPER: Get Session
// ============================================

async function getSessionId() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    throw new UnauthenticatedError('Must be logged in');
  }

  return sessionId;
}

// ============================================
// SCHEMAS
// ============================================

const createBranchSchema = z.object({
  companyId: z.string(),
  name: z.string().min(1).max(100),
  location: z.string().max(255).optional(),
  timezone: z.string().default('UTC'),
});

const updateBranchSchema = z.object({
  branchId: z.string(),
  companyId: z.string(),
  name: z.string().min(1).max(100).optional(),
  location: z.string().max(255).nullable().optional(),
  timezone: z.string().optional(),
  active: z.boolean().optional(),
});

const createStaffSchema = z.object({
  companyId: z.string(),
  branchId: z.string(),
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(255),
  position: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

const updateStaffSchema = z.object({
  staffProfileId: z.string(),
  companyId: z.string(),
  displayName: z.string().min(1).max(100).optional(),
  position: z.string().max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  active: z.boolean().optional(),
  branchId: z.string().optional(),
});

const updateCompanySchema = z.object({
  companyId: z.string(),
  name: z.string().min(1).max(100).optional(),
  legalName: z.string().max(200).optional(),
  country: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(8).max(255),
    newPassword: z.string().min(8).max(255),
    confirmPassword: z.string().min(8).max(255),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'New passwords do not match',
        path: ['newPassword'],
      });
    }
  });

const processTipPaymentSchema = z.object({
  companyId: z.string(),
  branchId: z.string(),
  staffProfileId: z.string(),
  amount: z.number().int().positive().min(500),
  currency: z.string().length(3),
  customerNote: z.string().max(500).optional(),
  customerRating: z.number().int().min(1).max(5).optional(),
});

const createPayoutBatchSchema = z.object({
  companyId: z.string(),
  branchId: z.string().optional(),
  payoutDate: z.string().transform((str) => new Date(str)),
  tipIds: z.array(z.string()).min(1),
});

// ============================================
// COMPANY ACTIONS
// ============================================

export async function getCompany(companyId: string) {
  try {
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(companyId);

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company;
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
    const sessionId = await getSessionId();
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

export async function createBranch(input: {
  companyId: string;
  name: string;
  location?: string;
  timezone?: string;
}) {
  try {
    const sessionId = await getSessionId();
    const data = createBranchSchema.parse(input);

    await validateCompanyAccess(sessionId, data.companyId, 'MANAGER');

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(data.companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const branchesRepository = getBranchesRepository();
    const existingBranch = await branchesRepository.getBranchBySlugAndCompany(
      slug,
      data.companyId
    );

    if (existingBranch) {
      return { error: 'A branch with this name already exists' };
    }

    const branchId = generateIdFromEntropySize(10);
    await branchesRepository.createBranch({
      id: branchId,
      companyId: data.companyId,
      name: data.name,
      location: data.location || null,
      slug: `${slug}-${branchId.slice(0, 6)}`,
      timezone: data.timezone,
      active: true,
    });

    revalidatePath('/app/branches');
    return { success: true };
  } catch (err) {
    console.error('Create branch error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.issues[0].message };
    }

    if (err instanceof InputParseError) {
      return { error: err.message };
    }

    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to create branches' };
    }

    if (err instanceof NotFoundError) {
      return { error: err.message };
    }

    return {
      error: 'An error happened while creating the branch. Please try again later.',
    };
  }
}

export async function getBranches(companyId: string, activeOnly?: boolean) {
  try {
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const branchesRepository = getBranchesRepository();

    if (activeOnly) {
      return branchesRepository.getActiveBranchesByCompany(companyId);
    }

    return branchesRepository.getBranchesByCompany(companyId);
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get branches error:', err);
    throw err;
  }
}

export async function getBranch(companyId: string, branchId: string) {
  const sessionId = await getSessionId();
  await validateCompanyAccess(sessionId, companyId);

  const branchesRepository = getBranchesRepository();
  const branch = await branchesRepository.getBranch(branchId);

  if (!branch) {
    throw new NotFoundError('Branch not found');
  }

  if (branch.companyId !== companyId) {
    throw new NotFoundError('Branch not found');
  }

  return branch;
}

export async function updateBranch(input: {
  branchId: string;
  companyId: string;
  name?: string;
  location?: string | null;
  timezone?: string;
  active?: boolean;
}) {
  try {
    const sessionId = await getSessionId();
    const data = updateBranchSchema.parse(input);

    await validateCompanyAccess(sessionId, data.companyId, 'MANAGER');

    const branchesRepository = getBranchesRepository();
    const existingBranch = await branchesRepository.getBranch(data.branchId);

    if (!existingBranch) {
      return { error: 'Branch not found' };
    }

    if (existingBranch.companyId !== data.companyId) {
      return { error: 'Branch does not belong to this company' };
    }

    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.location !== undefined) updates.location = data.location;
    if (data.timezone !== undefined) updates.timezone = data.timezone;
    if (data.active !== undefined) updates.active = data.active;

    await branchesRepository.updateBranch(data.branchId, updates);

    revalidatePath('/app/branches');
    return { success: true };
  } catch (err) {
    console.error('Update branch error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.issues[0].message };
    }

    if (err instanceof InputParseError) {
      return { error: err.message };
    }

    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to update branches' };
    }

    return {
      error: 'An error happened while updating the branch. Please try again later.',
    };
  }
}

// ============================================
// STAFF ACTIONS
// ============================================

export async function createStaff(input: {
  companyId: string;
  branchId: string;
  displayName: string;
  email: string;
  password: string;
  position?: string;
  avatarUrl?: string;
}) {
  try {
    const sessionId = await getSessionId();
    const data = createStaffSchema.parse(input);

    await validateCompanyAccess(sessionId, data.companyId, 'MANAGER');

    const usersRepository = getUsersRepository();
    const companyMembersRepository = getCompanyMembersRepository();
    const transactionService = getTransactionManagerService();

    const existingUser = await usersRepository.getUserByEmail(data.email);
    if (existingUser) {
      const existingCompanyMembers = await companyMembersRepository.getCompanyMembersByUser(
        existingUser.id
      );
      if (existingCompanyMembers.length > 0) {
        throw new UnauthorizedError(
          'User is already a company member and cannot have a staff profile'
        );
      }

      const staffProfilesRepository = getStaffProfilesRepository();
      const existingStaffProfiles = await staffProfilesRepository.getStaffProfilesByUser(
        existingUser.id
      );
      if (existingStaffProfiles.length > 0) {
        throw new AuthenticationError('User already has a staff profile');
      }

      const userId = existingUser.id;
      return await transactionService.startTransaction(async (tx) => {
        const companiesRepository = getCompaniesRepository();
        const company = await companiesRepository.getCompany(data.companyId, tx);
        if (!company) {
          throw new NotFoundError('Company not found');
        }

        const branchesRepository = getBranchesRepository();
        const branch = await branchesRepository.getBranch(data.branchId, tx);
        if (!branch) {
          throw new NotFoundError('Branch not found');
        }
        if (branch.companyId !== data.companyId) {
          throw new NotFoundError('Branch does not belong to this company');
        }

        const publicId = generateIdFromEntropySize(16);
        let existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(publicId, tx);
        let attempts = 0;
        while (existingStaff && attempts < 5) {
          const newPublicId = generateIdFromEntropySize(16);
          existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(newPublicId, tx);
          attempts++;
        }

        const staffId = generateIdFromEntropySize(10);
        await staffProfilesRepository.createStaffProfile(
          {
            id: staffId,
            companyId: data.companyId,
            branchId: data.branchId,
            userId: userId,
            displayName: data.displayName,
            position: data.position || null,
            avatarUrl: data.avatarUrl || null,
            publicId: existingStaff ? generateIdFromEntropySize(16) : publicId,
            active: true,
          },
          tx
        );

        revalidatePath('/app/staff');
        return { success: true };
      });
    }

    const authenticationService = getAuthenticationService();
    const userId = authenticationService.generateUserId();

    return await transactionService.startTransaction(async (tx) => {
      const newUser = await usersRepository.createUser(
        {
          id: userId,
          name: data.displayName,
          email: data.email,
          password: data.password,
          role: 'STAFF',
        },
        tx
      );

      const companiesRepository = getCompaniesRepository();
      const company = await companiesRepository.getCompany(data.companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found');
      }

      const branchesRepository = getBranchesRepository();
      const branch = await branchesRepository.getBranch(data.branchId, tx);
      if (!branch) {
        throw new NotFoundError('Branch not found');
      }
      if (branch.companyId !== data.companyId) {
        throw new NotFoundError('Branch does not belong to this company');
      }

      const publicId = generateIdFromEntropySize(16);
      const staffProfilesRepository = getStaffProfilesRepository();
      let existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(publicId, tx);
      let attempts = 0;
      while (existingStaff && attempts < 5) {
        const newPublicId = generateIdFromEntropySize(16);
        existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(newPublicId, tx);
        attempts++;
      }

      const staffId = generateIdFromEntropySize(10);
      await staffProfilesRepository.createStaffProfile(
        {
          id: staffId,
          companyId: data.companyId,
          branchId: data.branchId,
          userId: newUser.id,
          displayName: data.displayName,
          position: data.position || null,
          avatarUrl: data.avatarUrl || null,
          publicId: existingStaff ? generateIdFromEntropySize(16) : publicId,
          active: true,
        },
        tx
      );

      revalidatePath('/app/staff');
      return { success: true };
    });
  } catch (err) {
    console.error('Create staff error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.issues[0].message };
    }

    if (err instanceof InputParseError) {
      return { error: err.message };
    }

    if (err instanceof UnauthenticatedError) {
      return { error: 'You must be logged in to create staff' };
    }

    if (err instanceof UnauthorizedError) {
      console.error('Unauthorized error creating staff:', err.message);
      return { error: err.message || 'You do not have permission to create staff' };
    }

    if (err instanceof AuthenticationError) {
      return { error: err.message };
    }

    return {
      error: 'An error happened while creating the staff profile. Please try again later.',
    };
  }
}

export async function getStaff(companyId: string, branchId?: string, activeOnly?: boolean) {
  try {
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const staffProfilesRepository = getStaffProfilesRepository();

    if (branchId) {
      if (activeOnly) {
        return staffProfilesRepository.getActiveStaffProfilesByBranch(branchId);
      }
      return staffProfilesRepository.getStaffProfilesByBranch(branchId);
    }

    return staffProfilesRepository.getStaffProfilesByCompany(companyId);
  } catch (err) {
    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      redirect('/sign-in');
    }
    console.error('Get staff error:', err);
    throw err;
  }
}

export async function updateStaff(input: {
  staffProfileId: string;
  companyId: string;
  displayName?: string;
  position?: string;
  avatarUrl?: string | null;
  active?: boolean;
  branchId?: string;
}) {
  try {
    const sessionId = await getSessionId();
    const data = updateStaffSchema.parse(input);

    await validateCompanyAccess(sessionId, data.companyId, 'MANAGER');

    const staffProfilesRepository = getStaffProfilesRepository();
    const existingStaff = await staffProfilesRepository.getStaffProfile(data.staffProfileId);

    if (!existingStaff) {
      return { error: 'Staff profile not found' };
    }

    if (existingStaff.companyId !== data.companyId) {
      return { error: 'Staff profile does not belong to this company' };
    }

    if (data.branchId && data.branchId !== existingStaff.branchId) {
      const branchesRepository = getBranchesRepository();
      const branch = await branchesRepository.getBranch(data.branchId);
      if (!branch || branch.companyId !== data.companyId) {
        return { error: 'Branch does not belong to this company' };
      }
    }

    const updates: any = {};
    if (data.displayName !== undefined) updates.displayName = data.displayName;
    if (data.position !== undefined) updates.position = data.position;
    if (data.avatarUrl !== undefined) updates.avatarUrl = data.avatarUrl;
    if (data.active !== undefined) updates.active = data.active;
    if (data.branchId !== undefined) updates.branchId = data.branchId;

    await staffProfilesRepository.updateStaffProfile(data.staffProfileId, updates);

    revalidatePath('/app/staff');
    return { success: true };
  } catch (err) {
    console.error('Update staff error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.issues[0].message };
    }

    if (err instanceof InputParseError) {
      return { error: err.message };
    }

    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to update staff' };
    }

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
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const tipsRepository = getTipsRepository();
    return tipsRepository.getTipsByCompany(companyId, filters || {});
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
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId, 'ADMIN');

    if (tipIds.length === 0) {
      return { success: true };
    }

    const tipsRepository = getTipsRepository();
    const transactionService = getTransactionManagerService();

    const tips = await tipsRepository.getTipsByCompany(companyId, {
      distributionStatus: 'PENDING',
      paymentStatus: 'SUCCEEDED',
    });

    const validTipIds = tips.filter((tip) => tipIds.includes(tip.id)).map((tip) => tip.id);

    if (validTipIds.length === 0) {
      return { error: 'No valid tips found to mark as paid' };
    }

    await transactionService.startTransaction(async (tx) => {
      return tipsRepository.markTipsAsPaid(validTipIds, tx);
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
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const branchesRepository = getBranchesRepository();
    const branch = await branchesRepository.getBranch(branchId);
    if (!branch || branch.companyId !== companyId) {
      throw new NotFoundError('Branch not found');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrCodeService = getQRCodeService();
    const url = qrCodeService.generateBranchTippingUrl(company.slug, branch.slug, baseUrl);

    const dataUrl = await qrCodeService.generateDataURL(url, { size: 400 });
    const svg = await qrCodeService.generateSVG(url, { size: 400 });

    return { url, dataUrl, svg };
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
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const staffProfilesRepository = getStaffProfilesRepository();
    const staff = await staffProfilesRepository.getStaffProfile(staffProfileId);
    if (!staff || staff.companyId !== companyId) {
      throw new NotFoundError('Staff profile not found');
    }

    if (!staff.active) {
      throw new NotFoundError('Staff profile is not active');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrCodeService = getQRCodeService();
    const url = qrCodeService.generateStaffTippingUrl(staff.publicId, baseUrl);

    const dataUrl = await qrCodeService.generateDataURL(url, { size: 400 });
    const svg = await qrCodeService.generateSVG(url, { size: 400 });

    return { url, dataUrl, svg };
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

// app/actions.ts
export async function processTipPayment(input: {
  companyId: string;
  branchId: string;
  staffProfileId: string;
  amount: number;
  currency: string;
  customerNote?: string;
  customerRating?: number;
}) {
  try {
    // Validate input
    const data = processTipPaymentSchema.parse(input);

    // Verify company exists
    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(data.companyId);
    if (!company) {
      return { error: 'Company not found' };
    }

    // Verify currency matches
    if (data.currency !== company.currency) {
      return { error: 'Currency mismatch' };
    }

    // Verify staff exists and belongs to company
    const staffProfilesRepository = getStaffProfilesRepository();
    const staff = await staffProfilesRepository.getStaffProfile(data.staffProfileId);
    if (!staff || staff.companyId !== data.companyId) {
      return { error: 'Staff profile not found' };
    }

    // Verify branch exists and is active
    const branchesRepository = getBranchesRepository();
    const branch = await branchesRepository.getBranch(data.branchId);
    if (!branch || branch.companyId !== data.companyId || !branch.active) {
      return { error: 'Branch not found or inactive' };
    }

    const paymentService = getPaymentService();
    const transactionService = getTransactionManagerService();
    const tipsRepository = getTipsRepository();

    // Process payment and create tip in a transaction
    const result = await transactionService.startTransaction(async (tx) => {
      // Process payment first
      const paymentResponse = await paymentService.processPayment({
        amount: data.amount,
        currency: data.currency,
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

      // Create tip record
      const tipId = generateIdFromEntropySize(10);
      const tip = await tipsRepository.createTip(
        {
          id: tipId,
          companyId: data.companyId,
          branchId: data.branchId,
          staffProfileId: data.staffProfileId,
          amount: data.amount,
          currency: data.currency,
          paymentProvider: 'LOCAL_GATEWAY',
          paymentProviderTransactionId: paymentResponse.transactionId,
          paymentStatus: 'SUCCEEDED',
          customerNote: data.customerNote || null,
          customerRating: data.customerRating || null,
        },
        tx // Pass transaction to repository
      );

      return { tip, paymentResponse };
    });

    return {
      success: true,
      tipId: result.tip.id,
      transactionId: result.paymentResponse.transactionId,
    };
  } catch (err) {
    console.error('Process tip payment error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.errors[0]?.message || 'Invalid input' };
    }

    if (err instanceof InputParseError) {
      return { error: err.message };
    }

    if (err instanceof NotFoundError) {
      return { error: err.message };
    }

    return {
      error: 'An error happened while processing the payment. Please try again later.',
    };
  }
}
// ============================================
// PAYOUT BATCH ACTIONS
// ============================================

export async function createPayoutBatch(input: {
  companyId: string;
  branchId?: string;
  payoutDate: string;
  tipIds: string[];
}) {
  try {
    const sessionId = await getSessionId();
    const parsed = createPayoutBatchSchema.parse({
      ...input,
      payoutDate: input.payoutDate,
    });

    await validateCompanyAccess(sessionId, parsed.companyId, 'ADMIN');

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(parsed.companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
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
      return { error: 'No valid pending tips found' };
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
          currency: company.currency,
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
            currency: company.currency,
          },
          tx
        );
        payoutItems.push(payoutItem);
      }

      await tipsRepository.markTipsAsPaid(validTipIds, tx);

      return { payoutBatch, payoutItems };
    });

    revalidatePath('/app/payouts');
    return { success: true, payoutBatchId: result.payoutBatch.id };
  } catch (err) {
    console.error('Create payout batch error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.issues[0].message };
    }

    if (err instanceof InputParseError) {
      return { error: err.message };
    }

    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to create payout batches' };
    }

    if (err instanceof NotFoundError) {
      return { error: err.message };
    }

    return {
      error: 'An error happened while creating the payout batch. Please try again later.',
    };
  }
}

export async function getPayoutBatches(companyId: string) {
  try {
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const payoutBatchesRepository = getPayoutBatchesRepository();
    return payoutBatchesRepository.getPayoutBatchesByCompany(companyId);
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
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId);

    const payoutBatchesRepository = getPayoutBatchesRepository();
    const payoutBatch = await payoutBatchesRepository.getPayoutBatch(payoutBatchId);

    if (!payoutBatch) {
      throw new NotFoundError('Payout batch not found');
    }

    if (payoutBatch.companyId !== companyId) {
      throw new NotFoundError('Payout batch not found');
    }

    const payoutItemsRepository = getPayoutItemsRepository();
    const payoutItems = await payoutItemsRepository.getPayoutItemsByBatch(payoutBatchId);

    return { payoutBatch, payoutItems };
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
    const sessionId = await getSessionId();
    await validateCompanyAccess(sessionId, companyId, 'ADMIN');

    const payoutBatchesRepository = getPayoutBatchesRepository();
    const payoutBatch = await payoutBatchesRepository.getPayoutBatch(payoutBatchId);

    if (!payoutBatch) {
      return { error: 'Payout batch not found' };
    }

    if (payoutBatch.companyId !== companyId) {
      return { error: 'Payout batch not found' };
    }

    if (payoutBatch.status !== 'PENDING') {
      return { error: 'Payout batch is already completed' };
    }

    const transactionService = getTransactionManagerService();
    await transactionService.startTransaction(async (tx) => {
      return payoutBatchesRepository.markPayoutBatchAsCompleted(payoutBatchId, tx);
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
    const sessionId = await getSessionId();
    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const staffProfilesRepository = getStaffProfilesRepository();
    const staffProfiles = await staffProfilesRepository.getStaffProfilesByUser(user.id);

    const activeProfile = staffProfiles.find((sp) => sp.active);
    return activeProfile || staffProfiles[0] || null;
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
    const sessionId = await getSessionId();
    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const staffProfilesRepository = getStaffProfilesRepository();
    const staffProfiles = await staffProfilesRepository.getStaffProfilesByUser(user.id);

    const activeProfile = staffProfiles.find((sp) => sp.active) || staffProfiles[0];

    if (!activeProfile) {
      return [];
    }

    const tipsRepository = getTipsRepository();
    return tipsRepository.getTipsByCompany(activeProfile.companyId, {
      staffProfileId: activeProfile.id,
      paymentStatus: 'SUCCEEDED',
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

export async function updateCompanySettings(input: {
  companyId: string;
  name?: string;
  legalName?: string;
  country?: string;
  currency?: string;
}) {
  try {
    const sessionId = await getSessionId();
    const data = updateCompanySchema.parse(input);

    await validateCompanyAccess(sessionId, data.companyId, 'ADMIN');

    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(data.companyId);

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.legalName !== undefined) updates.legalName = data.legalName;
    if (data.country !== undefined) updates.country = data.country;
    if (data.currency !== undefined) updates.currency = data.currency;

    await companiesRepository.updateCompany(data.companyId, updates);

    revalidatePath('/app/settings');
    return { success: true };
  } catch (err) {
    console.error('Update company settings error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.issues[0].message };
    }

    if (err instanceof InputParseError) {
      return { error: err.message };
    }

    if (err instanceof UnauthenticatedError || err instanceof UnauthorizedError) {
      return { error: 'You do not have permission to update company settings' };
    }

    if (err instanceof NotFoundError) {
      return { error: err.message };
    }

    return {
      error: 'An error happened while updating company settings. Please try again later.',
    };
  }
}

export async function updateAccountSettings(input: { name: string; email: string }) {
  try {
    const sessionId = await getSessionId();
    const data = updateAccountSchema.parse(input);

    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const usersRepository = getUsersRepository();
    await usersRepository.updateUser(user.id, {
      name: data.name,
      email: data.email,
    });

    revalidatePath('/app/settings');
    return { success: true };
  } catch (err) {
    console.error('Update account settings error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.issues[0].message };
    }

    if (err instanceof InputParseError) {
      return { error: err.message };
    }

    if (err instanceof UnauthenticatedError) {
      return { error: 'Must be logged in' };
    }

    return {
      error: 'An error happened while updating account settings. Please try again later.',
    };
  }
}

export async function updatePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const sessionId = await getSessionId();
    const data = updatePasswordSchema.parse(input);

    const authService = getAuthenticationService();
    const { user } = await authService.validateSession(sessionId);

    const usersRepository = getUsersRepository();
    const userRecord = await usersRepository.getUser(user.id);
    if (!userRecord) {
      throw new NotFoundError('User not found');
    }

    const validPassword = await authService.validatePasswords(
      data.currentPassword,
      userRecord.password_hash
    );

    if (!validPassword) {
      return { error: 'Current password is incorrect' };
    }

    const newPasswordHash = await hash(data.newPassword, PASSWORD_SALT_ROUNDS);
    await usersRepository.updatePassword(user.id, newPasswordHash);

    revalidatePath('/app/settings');
    return { success: true };
  } catch (err) {
    console.error('Update password error:', err);

    if (err instanceof z.ZodError) {
      return { error: err.issues[0].message };
    }

    if (err instanceof InputParseError) {
      return { error: err.message };
    }

    if (err instanceof UnauthenticatedError) {
      return { error: 'Must be logged in' };
    }

    if (err instanceof NotFoundError) {
      return { error: err.message };
    }

    return {
      error: 'An error happened while updating password. Please try again later.',
    };
  }
}
