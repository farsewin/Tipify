import type { Cookie } from '@/src/modules/shared/models/cookie';
import type { Session } from '@/src/modules/shared/models/session';
import type { User } from '@/src/modules/auth/user.model';
import type { Company } from '@/src/modules/company/company.model';
import type { CompanyMember } from '@/src/modules/company/company-member.model';
import { AuthenticationError } from '@/src/modules/shared/errors/auth';
import { createCompanyUseCase } from '@/src/modules/company/create/create-company.use-case';
import {
  getUsersRepository,
  getAuthenticationService,
  getTransactionManagerService,
} from '@/src/service-locator';

export async function signUpUseCase(input: {
  name: string;
  email: string;
  password: string;
  companyName: string;
  companyLegalName?: string;
  country: string;
  currency: string;
}): Promise<{
  session: Session;
  cookie: Cookie;
  user: Pick<User, 'id' | 'name' | 'email'>;
  company: Company;
  companyMember: CompanyMember;
}> {
  const usersRepository = getUsersRepository();
  const authenticationService = getAuthenticationService();
  const transactionService = getTransactionManagerService();

  // Check if email is already taken
  const existingUser = await usersRepository.getUserByEmail(input.email);
  if (existingUser) {
    throw new AuthenticationError('Email already registered');
  }

  // Create user first
  const userId = authenticationService.generateUserId();
  const newUser = await usersRepository.createUser({
    id: userId,
    name: input.name,
    email: input.email,
    password: input.password,
    role: 'STAFF', // Default role, will be OWNER via company member
  });

  // Create company (this creates its own transaction and also creates the company member)
  const { company, companyMember } = await createCompanyUseCase({
    name: input.companyName,
    legalName: input.companyLegalName,
    country: input.country,
    currency: input.currency,
    userId: newUser.id,
  });

  const result = { user: newUser, company, companyMember };

  // Create session after transaction
  const { cookie, session } = await authenticationService.createSession(result.user);

  return {
    cookie,
    session,
    user: { id: result.user.id, name: result.user.name, email: result.user.email },
    company: result.company,
    companyMember: result.companyMember,
  };
}
