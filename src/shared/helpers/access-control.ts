import type { CompanyMember } from '@/src/models/company-member.model';
import type { StaffProfile } from '@/src/models/staff-profile.model';
import type { User } from '@/src/models/user.model';
import {
  getCompanyMembersRepository,
  getStaffProfilesRepository,
  getAuthenticationService,
} from '@/src/service-locator';
import {
  UnauthorizedError,
  UnauthenticatedError,
} from '@/src/shared/errors/auth';

export type RequiredRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';

/**
 * Validates that a user has access to a company and optionally checks their role
 */
export async function validateCompanyAccess(
  sessionToken: string | undefined,
  companyId: string,
  requiredRole?: RequiredRole
): Promise<{ user: User; companyMember: CompanyMember }> {
  console.log(
    `🔐 [AccessControl] Validating company access for company: ${companyId}`
  );

  if (!sessionToken) {
    console.log('❌ [AccessControl] No session token provided');
    throw new UnauthenticatedError('Must be logged in');
  }

  const authService = getAuthenticationService();
  const { user } = await authService.validateSession(sessionToken);

  console.log(`🔐 [AccessControl] User validated: ${user.id}`);

  const companyMembersRepository = getCompanyMembersRepository();
  const companyMember =
    await companyMembersRepository.getCompanyMemberByUserAndCompany(
      user.id,
      companyId
    );

  if (!companyMember) {
    console.log(
      `❌ [AccessControl] User ${user.id} is not a member of company ${companyId}`
    );
    throw new UnauthorizedError('You do not have access to this company');
  }

  console.log(
    `✅ [AccessControl] User is a ${companyMember.role} of company ${companyId}`
  );

  // Check role if required
  if (requiredRole) {
    const roleHierarchy: Record<RequiredRole, number> = {
      OWNER: 4,
      ADMIN: 3,
      MANAGER: 2,
      STAFF: 1,
    };

    const userRoleLevel = roleHierarchy[companyMember.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      console.log(
        `❌ [AccessControl] User role ${companyMember.role} is below required ${requiredRole}`
      );
      throw new UnauthorizedError(
        `This action requires ${requiredRole} role or higher`
      );
    }
    console.log(
      `✅ [AccessControl] Role check passed: ${companyMember.role} >= ${requiredRole}`
    );
  }

  return { user, companyMember };
}

/**
 * Gets all companies a user has access to
 */
export async function getUserCompanies(
  sessionToken: string | undefined
): Promise<CompanyMember[]> {
  console.log('🔐 [AccessControl] Getting user companies...');

  if (!sessionToken) {
    console.log('❌ [AccessControl] No session token provided');
    throw new UnauthenticatedError('Must be logged in');
  }

  const authService = getAuthenticationService();
  const { user } = await authService.validateSession(sessionToken);

  console.log(`🔐 [AccessControl] User validated: ${user.id}`);

  const companyMembersRepository = getCompanyMembersRepository();
  const companies = await companyMembersRepository.getCompanyMembersByUser(
    user.id
  );

  console.log(
    `✅ [AccessControl] Found ${companies.length} companies for user`
  );
  return companies;
}

/**
 * User type information - determines what type of user this is based on relationships
 */
export type UserType = {
  isCompanyMember: boolean;
  isStaffMember: boolean;
  companyMembers: CompanyMember[];
  staffProfiles: StaffProfile[];
};

/**
 * Determines the user type by checking their relationships
 * - Company Member: has entries in company_member table
 * - Staff Member: has entries in staff_profile table with userId linked
 *
 * IMPORTANT: Users CANNOT be both company members and staff members.
 * This enforces strict separation between company users and staff users.
 */
export async function getUserType(sessionToken: string | undefined): Promise<{
  user: User;
  userType: UserType;
}> {
  console.log('🔐 [AccessControl] Determining user type...');

  if (!sessionToken) {
    console.log('❌ [AccessControl] No session token provided');
    throw new UnauthenticatedError('Must be logged in');
  }

  const authService = getAuthenticationService();
  const { user } = await authService.validateSession(sessionToken);

  console.log(`🔐 [AccessControl] User validated: ${user.id} (${user.email})`);

  const companyMembersRepository = getCompanyMembersRepository();
  const staffProfilesRepository = getStaffProfilesRepository();

  const [companyMembers, staffProfiles] = await Promise.all([
    companyMembersRepository.getCompanyMembersByUser(user.id),
    staffProfilesRepository.getStaffProfilesByUser(user.id),
  ]);

  console.log(
    `🔐 [AccessControl] Found ${companyMembers.length} company memberships, ${staffProfiles.length} staff profiles`
  );

  // Enforce strict separation: users cannot be both company members and staff members
  // If both exist, prioritize company membership and log for cleanup
  if (companyMembers.length > 0 && staffProfiles.length > 0) {
    console.error(
      `⚠️ [AccessControl] DATA INCONSISTENCY: User ${user.id} (${user.email}) is both a company member and a staff member. ` +
        `Prioritizing company membership. Staff profiles should be unlinked:`,
      staffProfiles.map((sp) => sp.id)
    );
  }

  const userType: UserType = {
    // If user is both, prioritize company membership
    isCompanyMember: companyMembers.length > 0,
    isStaffMember: staffProfiles.length > 0 && companyMembers.length === 0,
    companyMembers,
    staffProfiles: companyMembers.length > 0 ? [] : staffProfiles,
  };

  console.log(
    `✅ [AccessControl] User type determined: isCompanyMember=${userType.isCompanyMember}, isStaffMember=${userType.isStaffMember}`
  );

  return { user, userType };
}

/**
 * Determines the appropriate dashboard redirect for a user
 * Strict separation: users are either company members OR staff members, never both
 */
export async function getDashboardRedirect(
  sessionToken: string | undefined
): Promise<string> {
  console.log('🔐 [AccessControl] Determining dashboard redirect...');

  const { userType } = await getUserType(sessionToken);

  // If user is a company member, redirect to company dashboard
  if (userType.isCompanyMember) {
    console.log('✅ [AccessControl] Redirecting to company dashboard');
    return '/app/dashboard';
  }

  // If user is a staff member, redirect to staff dashboard
  if (userType.isStaffMember) {
    console.log('✅ [AccessControl] Redirecting to staff dashboard');
    return '/staff/dashboard';
  }

  // Default fallback (shouldn't happen in normal flow - user has no relationships)
  console.log(
    '⚠️ [AccessControl] User has no relationships, defaulting to company dashboard'
  );
  return '/app/dashboard';
}
