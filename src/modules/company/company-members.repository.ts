import { and, eq } from 'drizzle-orm';
import { db, type Transaction } from '@/drizzle';
import { companyMembers } from '@/drizzle/schema';
import type {
  CompanyMember,
  CreateCompanyMember,
} from '@/src/modules/company/company-member.model';

export class CompanyMembersRepository {
  private static instance: CompanyMembersRepository;

  private constructor() {}

  static getInstance(): CompanyMembersRepository {
    if (!CompanyMembersRepository.instance) {
      CompanyMembersRepository.instance = new CompanyMembersRepository();
    }
    return CompanyMembersRepository.instance;
  }

  async getCompanyMember(
    id: string,
    tx?: Transaction
  ): Promise<CompanyMember | undefined> {
    const invoker = tx ?? db;
    return invoker.query.companyMembers.findFirst({ where: eq(companyMembers.id, id) });
  }

  async getCompanyMemberByUserAndCompany(
    userId: string,
    companyId: string,
    tx?: Transaction
  ): Promise<CompanyMember | undefined> {
    const invoker = tx ?? db;
    return invoker.query.companyMembers.findFirst({
      where: and(
        eq(companyMembers.userId, userId),
        eq(companyMembers.companyId, companyId)
      ),
    });
  }

  async getCompanyMembersByUser(
    userId: string,
    tx?: Transaction
  ): Promise<CompanyMember[]> {
    const invoker = tx ?? db;
    return invoker.query.companyMembers.findMany({
      where: eq(companyMembers.userId, userId),
    });
  }

  async getCompanyMembersByCompany(
    companyId: string,
    tx?: Transaction
  ): Promise<CompanyMember[]> {
    const invoker = tx ?? db;
    return invoker.query.companyMembers.findMany({
      where: eq(companyMembers.companyId, companyId),
    });
  }

  async createCompanyMember(
    input: CreateCompanyMember,
    tx?: Transaction
  ): Promise<CompanyMember> {
    const invoker = tx ?? db;
    const [created] = await invoker.insert(companyMembers).values(input).returning();

    if (!created) throw new Error('Cannot create company member');

    return created;
  }

  async updateCompanyMemberRole(
    id: string,
    role: CompanyMember['role'],
    tx?: Transaction
  ): Promise<CompanyMember> {
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(companyMembers)
      .set({ role, updatedAt: new Date() })
      .where(eq(companyMembers.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update company member');

    return updated;
  }

  async deleteCompanyMember(id: string, tx?: Transaction): Promise<void> {
    const invoker = tx ?? db;
    await invoker.delete(companyMembers).where(eq(companyMembers.id, id));
  }
}

