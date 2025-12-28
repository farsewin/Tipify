import { hash } from 'bcrypt-ts';
import { eq } from 'drizzle-orm';
import { PASSWORD_SALT_ROUNDS } from '@/config';
import { db, type Transaction } from '@/drizzle';
import { users, accounts } from '@/drizzle/schema';
import type { CreateUser, User } from '@/src/models/user.model';

export class UsersRepository {
  private static instance: UsersRepository;

  private constructor() {
    console.log('📦 [UsersRepository] Initializing UsersRepository...');
  }

  static getInstance(): UsersRepository {
    if (!UsersRepository.instance) {
      UsersRepository.instance = new UsersRepository();
    }
    return UsersRepository.instance;
  }

  async getUser(id: string, tx?: Transaction): Promise<User | undefined> {
    console.log(`📦 [UsersRepository] Getting user by ID: ${id}`);
    const invoker = tx ?? db;
    const result = await invoker
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    console.log(`📦 [UsersRepository] User found: ${result[0] ? 'yes' : 'no'}`);
    return result[0];
  }

  async getUserByEmail(
    email: string,
    tx?: Transaction
  ): Promise<User | undefined> {
    console.log(`📦 [UsersRepository] Getting user by email: ${email}`);
    const invoker = tx ?? db;
    const result = await invoker
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    console.log(`📦 [UsersRepository] User found: ${result[0] ? 'yes' : 'no'}`);
    return result[0];
  }

  async createUser(input: CreateUser, tx?: Transaction): Promise<User> {
    console.log(`📦 [UsersRepository] Creating user: ${input.email}`);
    const invoker = tx ?? db;

    const [created] = await invoker
      .insert(users)
      .values({
        id: input.id,
        name: input.name,
        email: input.email,
        emailVerified: false,
        role: input.role ?? 'STAFF',
      })
      .returning();

    if (!created) throw new Error('Cannot create user');

    // If password is provided, create an account entry for credential auth
    if (input.password) {
      console.log(
        `📦 [UsersRepository] Creating credential account for user: ${input.email}`
      );
      const passwordHash = await hash(input.password, PASSWORD_SALT_ROUNDS);

      await invoker.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: created.id,
        providerId: 'credential',
        userId: created.id,
        password: passwordHash,
      });
      console.log(`✅ [UsersRepository] Credential account created`);
    }

    console.log(`✅ [UsersRepository] User created: ${created.id}`);
    return created;
  }

  async updateUser(
    id: string,
    updates: Partial<Pick<User, 'name' | 'email' | 'role'>>,
    tx?: Transaction
  ): Promise<User> {
    console.log(`📦 [UsersRepository] Updating user: ${id}`);
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update user');

    console.log(`✅ [UsersRepository] User updated: ${id}`);
    return updated;
  }

  async updatePassword(
    id: string,
    newPassword: string,
    tx?: Transaction
  ): Promise<void> {
    console.log(`📦 [UsersRepository] Updating password for user: ${id}`);
    const invoker = tx ?? db;
    const passwordHash = await hash(newPassword, PASSWORD_SALT_ROUNDS);

    // Update password in the accounts table
    await invoker
      .update(accounts)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(accounts.userId, id));

    console.log(`✅ [UsersRepository] Password updated for user: ${id}`);
  }

  async getPasswordHash(
    userId: string,
    tx?: Transaction
  ): Promise<string | null> {
    console.log(
      `📦 [UsersRepository] Getting password hash for user: ${userId}`
    );
    const invoker = tx ?? db;
    const result = await invoker
      .select({ password: accounts.password })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);

    const hash = result[0]?.password ?? null;
    console.log(
      `📦 [UsersRepository] Password hash found: ${hash ? 'yes' : 'no'}`
    );
    return hash;
  }
}
