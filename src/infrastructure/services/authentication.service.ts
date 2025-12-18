import { generateIdFromEntropySize, Lucia } from 'lucia';
import { compare } from 'bcrypt-ts';

import { SESSION_COOKIE } from '@/config';
import { luciaAdapter } from '@/drizzle';
import { UsersRepository } from '@/src/modules/auth/users.repository';
import { UnauthenticatedError } from '@/src/modules/shared/errors/auth';
import { Cookie } from '@/src/modules/shared/models/cookie';
import { Session, sessionSchema } from '@/src/modules/shared/models/session';
import { User } from '@/src/modules/auth/user.model';

export class AuthenticationService {
  private static instance: AuthenticationService;

  private lucia: Lucia;
  private usersRepository: UsersRepository;

  private constructor() {
    this.usersRepository = UsersRepository.getInstance(); // use singleton repo

    this.lucia = new Lucia(luciaAdapter, {
      sessionCookie: {
        name: SESSION_COOKIE,
        expires: false,
        attributes: {
          secure: process.env.NODE_ENV === 'production',
        },
      },
      getUserAttributes: (attributes) => ({ username: attributes.username }),
    });
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
    return compare(inputPassword, usersHashedPassword);
  }

  async validateSession(
    sessionId: string
  ): Promise<{ user: User; session: Session }> {
    const result = await this.lucia.validateSession(sessionId);

    if (!result.user || !result.session) {
      throw new UnauthenticatedError('Unauthenticated');
    }

    const user = await this.usersRepository.getUser(result.user.id);

    if (!user) {
      throw new UnauthenticatedError("User doesn't exist");
    }

    return { user, session: result.session };
  }

  async createSession(
    user: User
  ): Promise<{ session: Session; cookie: Cookie }> {
    const luciaSession = await this.lucia.createSession(user.id, {});
    const session = sessionSchema.parse(luciaSession);
    const cookie = this.lucia.createSessionCookie(session.id);

    return { session, cookie };
  }

  async invalidateSession(sessionId: string): Promise<{ blankCookie: Cookie }> {
    await this.lucia.invalidateSession(sessionId);
    const blankCookie = this.lucia.createBlankSessionCookie();

    return { blankCookie };
  }

  generateUserId(): string {
    return generateIdFromEntropySize(10);
  }
}

interface DatabaseUserAttributes {
  username: string;
}

declare module 'lucia' {
  interface Register {
    Lucia: Lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}
