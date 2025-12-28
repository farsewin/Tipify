import { compare } from 'bcrypt-ts';

import { db } from '@/drizzle';
import { sessions, users } from '@/drizzle/schema';
import { eq, and, gt } from 'drizzle-orm';
import { UsersRepository } from '@/src/repositories/users.repository';
import { UnauthenticatedError } from '@/src/shared/errors/auth';
import { User } from '@/src/models/user.model';

// Session type from Better Auth
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Cookie type for compatibility
export interface Cookie {
  name: string;
  value: string;
  attributes: {
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
    path?: string;
    maxAge?: number;
    expires?: Date;
  };
}

export class AuthenticationService {
  private static instance: AuthenticationService;

  private usersRepository: UsersRepository;

  private constructor() {
    console.log(
      '🔐 [AuthService] Initializing AuthenticationService with Better Auth...'
    );
    this.usersRepository = UsersRepository.getInstance();
    console.log('✅ [AuthService] AuthenticationService initialized');
  }

  static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  async validatePasswords(
    inputPassword: string,
    usersHashedPassword: string
  ): Promise<boolean> {
    console.log('🔐 [AuthService] Validating passwords...');
    const isValid = await compare(inputPassword, usersHashedPassword);
    console.log(
      `🔐 [AuthService] Password validation result: ${isValid ? 'valid' : 'invalid'}`
    );
    return isValid;
  }

  async validateSession(
    sessionToken: string
  ): Promise<{ user: User; session: Session }> {
    console.log('🔐 [AuthService] Validating session token...');
    console.log(
      `🔐 [AuthService] Token (first 10 chars): ${sessionToken.substring(0, 10)}...`
    );

    try {
      // Query session directly from database using the token
      const sessionResult = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.token, sessionToken),
            gt(sessions.expiresAt, new Date())
          )
        )
        .limit(1);

      console.log(
        '🔐 [AuthService] Session query result:',
        sessionResult.length > 0 ? 'session found' : 'no session'
      );

      if (sessionResult.length === 0) {
        console.log('❌ [AuthService] No valid session found in database');
        throw new UnauthenticatedError('Unauthenticated');
      }

      const sessionData = sessionResult[0];
      console.log(`🔐 [AuthService] Session user ID: ${sessionData.userId}`);

      // Get full user from our repository (to get custom fields like role)
      const user = await this.usersRepository.getUser(sessionData.userId);

      if (!user) {
        console.log(
          `❌ [AuthService] User not found in database: ${sessionData.userId}`
        );
        throw new UnauthenticatedError("User doesn't exist");
      }

      console.log(`✅ [AuthService] Session validated for user: ${user.email}`);

      // Map to our Session type
      const session: Session = {
        id: sessionData.id,
        userId: sessionData.userId,
        expiresAt: sessionData.expiresAt,
        token: sessionData.token,
        createdAt: sessionData.createdAt,
        updatedAt: sessionData.updatedAt,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
      };

      return { user, session };
    } catch (error) {
      console.error('❌ [AuthService] Session validation error:', error);
      if (error instanceof UnauthenticatedError) {
        throw error;
      }
      throw new UnauthenticatedError('Session validation failed');
    }
  }

  async createSession(
    user: User
  ): Promise<{ session: Session; cookie: Cookie }> {
    console.log(`🔐 [AuthService] Creating session for user: ${user.email}`);

    // Note: With Better Auth, sessions are created automatically during sign-in
    // This method is kept for compatibility but should use Better Auth's sign-in flow
    // In most cases, you should use the auth.api.signInEmail endpoint directly

    console.log(
      '⚠️ [AuthService] createSession called - sessions should be created via Better Auth sign-in flow'
    );

    // Return a placeholder - actual session creation happens in the sign-in API route
    const session: Session = {
      id: crypto.randomUUID(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      token: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const cookie: Cookie = {
      name: 'better-auth.session_token',
      value: session.token,
      attributes: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    };

    console.log(`✅ [AuthService] Session created for user: ${user.id}`);
    return { session, cookie };
  }

  async invalidateSession(sessionId: string): Promise<{ blankCookie: Cookie }> {
    console.log(`🔐 [AuthService] Invalidating session: ${sessionId}`);

    try {
      // Better Auth handles session invalidation through its API
      // The actual invalidation happens in the sign-out route
      console.log('✅ [AuthService] Session invalidation requested');
    } catch (error) {
      console.error('❌ [AuthService] Session invalidation error:', error);
    }

    const blankCookie: Cookie = {
      name: 'better-auth.session_token',
      value: '',
      attributes: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      },
    };

    console.log('✅ [AuthService] Blank cookie created for sign-out');
    return { blankCookie };
  }

  generateUserId(): string {
    const id = crypto.randomUUID();
    console.log(`🔐 [AuthService] Generated user ID: ${id}`);
    return id;
  }
}
