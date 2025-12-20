import type { CompanyMember } from '@/src/models/company-member.model';
import type { StaffProfile } from '@/src/models/staff-profile.model';
import type { User } from '@/src/models/user.model';
import {
  getCompanyMembersRepository,
  getStaffProfilesRepository,
  getAuthenticationService,
} from '@/src/service-locator';
import { UnauthorizedError, UnauthenticatedError } from '@/src/shared/errors/auth';

export type RequiredRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';

/**
 * Validates that a user has access to a company and optionally checks their role
 */
export async function validateCompanyAccess(
  sessionId: string | undefined,
  companyId: string,
  requiredRole?: RequiredRole
): Promise<{ user: User; companyMember: CompanyMember }> {
  if (!sessionId) {
    throw new UnauthenticatedError('Must be logged in');
  }

  const authService = getAuthenticationService();
  const { user } = await authService.validateSession(sessionId);

  const companyMembersRepository = getCompanyMembersRepository();
  const companyMember = await companyMembersRepository.getCompanyMemberByUserAndCompany(
    user.id,
    companyId
  );

  if (!companyMember) {
    throw new UnauthorizedError('You do not have access to this company');
  }

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
      throw new UnauthorizedError(
        `This action requires ${requiredRole} role or higher`
      );
    }
  }

  return { user, companyMember };
}

/**
 * Gets all companies a user has access to
 */
export async function getUserCompanies(sessionId: string | undefined): Promise<CompanyMember[]> {
  if (!sessionId) {
    throw new UnauthenticatedError('Must be logged in');
  }

  const authService = getAuthenticationService();
  const { user } = await authService.validateSession(sessionId);

  const companyMembersRepository = getCompanyMembersRepository();
  return companyMembersRepository.getCompanyMembersByUser(user.id);
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
export async function getUserType(sessionId: string | undefined): Promise<{
  user: User;
  userType: UserType;
}> {
  if (!sessionId) {
    throw new UnauthenticatedError('Must be logged in');
  }

  const authService = getAuthenticationService();
  const { user } = await authService.validateSession(sessionId);

  const companyMembersRepository = getCompanyMembersRepository();
  const staffProfilesRepository = getStaffProfilesRepository();

  const [companyMembers, staffProfiles] = await Promise.all([
    companyMembersRepository.getCompanyMembersByUser(user.id),
    staffProfilesRepository.getStaffProfilesByUser(user.id),
  ]);

  // Enforce strict separation: users cannot be both company members and staff members
  // If both exist, prioritize company membership and log for cleanup
  if (companyMembers.length > 0 && staffProfiles.length > 0) {
    console.error(
      `[DATA INCONSISTENCY] User ${user.id} (${user.email}) is both a company member and a staff member. ` +
        `Prioritizing company membership. Staff profiles should be unlinked:`,
      staffProfiles.map((sp) => sp.id)
    );
    // Prioritize company membership - treat as company member only
    // Staff profiles should be cleaned up (unlink userId or delete)
  }

  const userType: UserType = {
    // If user is both, prioritize company membership
    isCompanyMember: companyMembers.length > 0,
    isStaffMember: staffProfiles.length > 0 && companyMembers.length === 0,
    companyMembers,
    staffProfiles: companyMembers.length > 0 ? [] : staffProfiles, // Clear staff profiles if company member
  };

  return { user, userType };
}

/**
 * Determines the appropriate dashboard redirect for a user
 * Strict separation: users are either company members OR staff members, never both
 */
export async function getDashboardRedirect(sessionId: string | undefined): Promise<string> {
  const { userType } = await getUserType(sessionId);

  // If user is a company member, redirect to company dashboard
  if (userType.isCompanyMember) {
    return '/app/dashboard';
  }

  // If user is a staff member, redirect to staff dashboard
  if (userType.isStaffMember) {
    return '/staff/dashboard';
  }

  // Default fallback (shouldn't happen in normal flow - user has no relationships)
  return '/app/dashboard';
}

