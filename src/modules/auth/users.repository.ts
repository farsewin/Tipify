import { hash } from 'bcrypt-ts';
import { eq } from 'drizzle-orm';
import { PASSWORD_SALT_ROUNDS } from '@/config';
import { db, type Transaction } from '@/drizzle';
import { users } from '@/drizzle/schema';
import type { CreateUser, User } from '@/src/modules/auth/user.model';

export class UsersRepository {
  private static instance: UsersRepository;

  private constructor() {}

  static getInstance(): UsersRepository {
    if (!UsersRepository.instance) {
      UsersRepository.instance = new UsersRepository();
    }
    return UsersRepository.instance;
  }

  async getUser(id: string, tx?: Transaction): Promise<User | undefined> {
    const invoker = tx ?? db;
    const result = await invoker.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string, tx?: Transaction): Promise<User | undefined> {
    const invoker = tx ?? db;
    const result = await invoker.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(input: CreateUser, tx?: Transaction): Promise<User> {
    const invoker = tx ?? db;
    const password_hash = await hash(input.password, PASSWORD_SALT_ROUNDS);

    const [created] = await invoker
      .insert(users)
      .values({
        id: input.id,
        name: input.name,
        email: input.email,
        password_hash,
        role: input.role ?? 'STAFF',
      })
      .returning();

    if (!created) throw new Error('Cannot create user');

    return created;
  }

  async updateUser(
    id: string,
    updates: Partial<Pick<User, 'name' | 'email' | 'role'>>,
    tx?: Transaction
  ): Promise<User> {
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update user');

    return updated;
  }

  async updatePassword(
    id: string,
    passwordHash: string,
    tx?: Transaction
  ): Promise<User> {
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(users)
      .set({ password_hash: passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update password');

    return updated;
  }
}
