import { eq } from 'drizzle-orm';
import { db, type Transaction } from '@/drizzle';
import { companies } from '@/drizzle/schema';
import type { Company, CreateCompany, UpdateCompany } from '@/src/modules/company/company.model';

export class CompaniesRepository {
  private static instance: CompaniesRepository;

  private constructor() {}

  static getInstance(): CompaniesRepository {
    if (!CompaniesRepository.instance) {
      CompaniesRepository.instance = new CompaniesRepository();
    }
    return CompaniesRepository.instance;
  }

  async getCompany(id: string, tx?: Transaction): Promise<Company | undefined> {
    const invoker = tx ?? db;
    return invoker.query.companies.findFirst({ where: eq(companies.id, id) });
  }

  async getCompanyBySlug(slug: string, tx?: Transaction): Promise<Company | undefined> {
    const invoker = tx ?? db;
    return invoker.query.companies.findFirst({ where: eq(companies.slug, slug) });
  }

  async createCompany(input: CreateCompany, tx?: Transaction): Promise<Company> {
    const invoker = tx ?? db;
    const [created] = await invoker.insert(companies).values(input).returning();

    if (!created) throw new Error('Cannot create company');

    return created;
  }

  async updateCompany(
    id: string,
    updates: UpdateCompany,
    tx?: Transaction
  ): Promise<Company> {
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update company');

    return updated;
  }

  async updateSubscription(
    id: string,
    updates: {
      subscriptionPlan?: Company['subscriptionPlan'];
      subscriptionStatus?: Company['subscriptionStatus'];
      paymentProviderCustomerId?: string | null;
      paymentProviderSubscriptionId?: string | null;
    },
    tx?: Transaction
  ): Promise<Company> {
    const invoker = tx ?? db;
    const [updated] = await invoker
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();

    if (!updated) throw new Error('Cannot update subscription');

    return updated;
  }
}

