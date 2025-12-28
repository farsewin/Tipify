import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/drizzle';
import * as schema from '@/drizzle/schema';
import { hash, compare } from 'bcrypt-ts';

console.log('🔐 [BetterAuth] Initializing Better Auth configuration...');

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Custom password hashing using bcrypt-ts (same as before)
    password: {
      hash: async (password: string) => {
        console.log('🔐 [BetterAuth] Hashing password...');
        const hashedPassword = await hash(password, 10);
        console.log('✅ [BetterAuth] Password hashed successfully');
        return hashedPassword;
      },
      verify: async ({
        hash: hashedPassword,
        password,
      }: {
        hash: string;
        password: string;
      }) => {
        console.log('🔐 [BetterAuth] Verifying password...');
        const isValid = await compare(password, hashedPassword);
        console.log(
          `🔐 [BetterAuth] Password verification result: ${isValid ? 'valid' : 'invalid'}`
        );
        return isValid;
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'STAFF',
        input: false, // Don't allow users to set this during sign-up
      },
    },
  },

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
});

console.log('✅ [BetterAuth] Better Auth configured successfully');

// Export types for use in other files
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
