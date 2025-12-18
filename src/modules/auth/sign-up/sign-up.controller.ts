import { z } from 'zod';

import { signUpUseCase } from './sign-up.use-case';
import { InputParseError } from '@/src/modules/shared/errors/common';
import type { Cookie } from '@/src/modules/shared/models/cookie';
import type { User } from '@/src/modules/auth/user.model';
import type { Company } from '@/src/modules/company/company.model';
import type { CompanyMember } from '@/src/modules/company/company-member.model';

import {
  getInstrumentationService,
  getCrashReporterService,
} from '@/src/service-locator';

const inputSchema = z
  .object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: z.string().min(8).max(255),
    confirm_password: z.string().min(8).max(255),
    companyName: z.string().min(1).max(100),
    companyLegalName: z.string().max(200).optional(),
    country: z.string().length(2), // ISO country code
    currency: z.string().length(3), // ISO currency code
  })
  .superRefine(({ password, confirm_password }, ctx) => {
    if (confirm_password !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'The passwords did not match',
        path: ['password'],
      });
      ctx.addIssue({
        code: 'custom',
        message: 'The passwords did not match',
        path: ['confirm_password'],
      });
    }
  });

export async function signUpController(
  input: Partial<z.infer<typeof inputSchema>>
): Promise<{
  session: any;
  cookie: Cookie;
  user: Pick<User, 'id' | 'name' | 'email'>;
  company: Company;
  companyMember: CompanyMember;
}> {
  const instrumentationService = getInstrumentationService();
  const crashReporterService = getCrashReporterService();

  return instrumentationService.startSpan(
    {
      name: 'signUp Controller',
      op: 'controller',
      attributes: { email: input.email },
    },
    async () => {
      try {
        const { data, error: inputParseError } = inputSchema.safeParse(input);

        if (inputParseError) {
          throw new InputParseError('Invalid data', { cause: inputParseError });
        }

        return await signUpUseCase(data);
      } catch (error) {
        crashReporterService.report(error);
        throw error;
      }
    }
  );
}
