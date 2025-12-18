import { generateIdFromEntropySize } from 'lucia';
import {
  getStaffProfilesRepository,
  getBranchesRepository,
  getCompaniesRepository,
  getUsersRepository,
  getCompanyMembersRepository,
  getAuthenticationService,
  getTransactionManagerService,
} from '@/src/service-locator';
import type { StaffProfile } from '@/src/modules/staff/staff-profile.model';
import { InputParseError, NotFoundError } from '@/src/modules/shared/errors/common';
import { validateCompanyAccess } from '@/src/modules/shared/helpers/access-control';
import { AuthenticationError, UnauthorizedError } from '@/src/modules/shared/errors/auth';

export async function createStaffProfileUseCase(input: {
  companyId: string;
  branchId: string;
  displayName: string;
  email: string;
  password: string;
  position?: string;
  avatarUrl?: string;
  sessionId: string;
}): Promise<StaffProfile> {
  // Validate company access (requires at least MANAGER role)
  await validateCompanyAccess(input.sessionId, input.companyId, 'MANAGER');

  // Validate input
  if (input.displayName.length < 1 || input.displayName.length > 100) {
    throw new InputParseError('Display name must be between 1 and 100 characters');
  }

  if (input.password.length < 8 || input.password.length > 255) {
    throw new InputParseError('Password must be between 8 and 255 characters');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new InputParseError('Invalid email format');
  }

  const usersRepository = getUsersRepository();
  const companyMembersRepository = getCompanyMembersRepository();
  const transactionService = getTransactionManagerService();

  // Check if email is already taken
  const existingUser = await usersRepository.getUserByEmail(input.email);
  if (existingUser) {
    // Check if this user is already a company member - if so, they cannot be staff
    const existingCompanyMembers = await companyMembersRepository.getCompanyMembersByUser(
      existingUser.id
    );
    if (existingCompanyMembers.length > 0) {
      throw new UnauthorizedError(
        'User is already a company member and cannot have a staff profile'
      );
    }

    // Check if user already has a staff profile
    const staffProfilesRepository = getStaffProfilesRepository();
    const existingStaffProfiles = await staffProfilesRepository.getStaffProfilesByUser(
      existingUser.id
    );
    if (existingStaffProfiles.length > 0) {
      throw new AuthenticationError('User already has a staff profile');
    }

    // User exists but is not a company member and doesn't have a staff profile
    // Use existing user ID
    const userId = existingUser.id;
    return await transactionService.startTransaction(async (tx) => {
      // Verify company exists
      const companiesRepository = getCompaniesRepository();
      const company = await companiesRepository.getCompany(input.companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found');
      }

      // Verify branch exists and belongs to company
      const branchesRepository = getBranchesRepository();
      const branch = await branchesRepository.getBranch(input.branchId, tx);
      if (!branch) {
        throw new NotFoundError('Branch not found');
      }
      if (branch.companyId !== input.companyId) {
        throw new NotFoundError('Branch does not belong to this company');
      }

      // Generate unique public ID for QR codes
      const publicId = generateIdFromEntropySize(16);

      // Check if public ID already exists (very unlikely, but handle it)
      let existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(publicId, tx);
      let attempts = 0;
      while (existingStaff && attempts < 5) {
        const newPublicId = generateIdFromEntropySize(16);
        existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(newPublicId, tx);
        attempts++;
      }

      // Create staff profile with existing user
      const staffId = generateIdFromEntropySize(10);
      const staffProfile = await staffProfilesRepository.createStaffProfile(
        {
          id: staffId,
          companyId: input.companyId,
          branchId: input.branchId,
          userId: userId,
          displayName: input.displayName,
          position: input.position || null,
          avatarUrl: input.avatarUrl || null,
          publicId: existingStaff ? generateIdFromEntropySize(16) : publicId,
          active: true,
        },
        tx
      );

      return staffProfile;
    });
  }

  // Create new user account for staff member
  const authenticationService = getAuthenticationService();
  const userId = authenticationService.generateUserId();

  return await transactionService.startTransaction(async (tx) => {
    // Create user account
    const newUser = await usersRepository.createUser(
      {
        id: userId,
        name: input.displayName, // Use display name as user name
        email: input.email,
        password: input.password,
        role: 'STAFF', // Staff users always have STAFF role
      },
      tx
    );
    const finalUserId = newUser.id;

    // Verify company exists
    const companiesRepository = getCompaniesRepository();
    const company = await companiesRepository.getCompany(input.companyId, tx);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Verify branch exists and belongs to company
    const branchesRepository = getBranchesRepository();
    const branch = await branchesRepository.getBranch(input.branchId, tx);
    if (!branch) {
      throw new NotFoundError('Branch not found');
    }
    if (branch.companyId !== input.companyId) {
      throw new NotFoundError('Branch does not belong to this company');
    }

    // Generate unique public ID for QR codes
    const publicId = generateIdFromEntropySize(16);

    // Check if public ID already exists (very unlikely, but handle it)
    const staffProfilesRepository = getStaffProfilesRepository();
    let existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(publicId, tx);
    let attempts = 0;
    while (existingStaff && attempts < 5) {
      const newPublicId = generateIdFromEntropySize(16);
      existingStaff = await staffProfilesRepository.getStaffProfileByPublicId(newPublicId, tx);
      attempts++;
    }

    // Create staff profile with new user
    const staffId = generateIdFromEntropySize(10);
    const staffProfile = await staffProfilesRepository.createStaffProfile(
      {
        id: staffId,
        companyId: input.companyId,
        branchId: input.branchId,
        userId: newUser.id,
        displayName: input.displayName,
        position: input.position || null,
        avatarUrl: input.avatarUrl || null,
        publicId: existingStaff ? generateIdFromEntropySize(16) : publicId,
        active: true,
      },
      tx
    );

    return staffProfile;
  });
}

