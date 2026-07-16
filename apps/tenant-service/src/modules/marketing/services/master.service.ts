import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { leadSources, industries, companies } from '../../database/schemas/tenant.schema';
import { LeadSourceDto, IndustryDto, CompanyDto } from '../dto/master.dto';

@Injectable()
export class MasterService {
  // ==========================================
  // Lead Source Master
  // ==========================================
  async createLeadSource(dto: LeadSourceDto) {
    const db = TenantContext.getDb();
    const result = await db
      .insert(leadSources)
      .values({
        code: dto.code.trim().toLowerCase(),
        name: dto.name.trim(),
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      })
      .returning();
    return result[0];
  }

  async findAllLeadSources(query?: string) {
    const db = TenantContext.getDb();
    let qb = db.select().from(leadSources);
    if (query) {
      qb = qb.where(sql`${leadSources.name} ILIKE ${`%"${query}"%`}`) as any;
    }
    return qb;
  }

  async updateLeadSource(id: string, dto: LeadSourceDto) {
    const db = TenantContext.getDb();
    const result = await db
      .update(leadSources)
      .set({
        code: dto.code.trim().toLowerCase(),
        name: dto.name.trim(),
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(leadSources.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Lead source with ID '${id}' not found`);
    }
    return result[0];
  }

  async deleteLeadSource(id: string) {
    const db = TenantContext.getDb();
    const result = await db.delete(leadSources).where(eq(leadSources.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundException(`Lead source with ID '${id}' not found`);
    }
    return { success: true };
  }

  // ==========================================
  // Industry Master
  // ==========================================
  async createIndustry(dto: IndustryDto) {
    const db = TenantContext.getDb();
    const result = await db
      .insert(industries)
      .values({
        code: dto.code.trim().toLowerCase(),
        name: dto.name.trim(),
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      })
      .returning();
    return result[0];
  }

  async findAllIndustries(query?: string) {
    const db = TenantContext.getDb();
    let qb = db.select().from(industries);
    if (query) {
      qb = qb.where(sql`${industries.name} ILIKE ${`%"${query}"%`}`) as any;
    }
    return qb;
  }

  async updateIndustry(id: string, dto: IndustryDto) {
    const db = TenantContext.getDb();
    const result = await db
      .update(industries)
      .set({
        code: dto.code.trim().toLowerCase(),
        name: dto.name.trim(),
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(industries.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Industry with ID '${id}' not found`);
    }
    return result[0];
  }

  async deleteIndustry(id: string) {
    const db = TenantContext.getDb();
    const result = await db.delete(industries).where(eq(industries.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundException(`Industry with ID '${id}' not found`);
    }
    return { success: true };
  }

  // ==========================================
  // Company Master
  // ==========================================
  async createCompany(dto: CompanyDto) {
    const db = TenantContext.getDb();
    const result = await db
      .insert(companies)
      .values({
        companyCode: dto.companyCode.trim(),
        companyName: dto.companyName.trim(),
        email: dto.email ? dto.email.trim() : null,
        phone: dto.phone ? dto.phone.trim() : null,
        website: dto.website ? dto.website.trim() : null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      })
      .returning();
    return result[0];
  }

  async findAllCompanies(query?: string) {
    const db = TenantContext.getDb();
    let qb = db.select().from(companies);
    if (query) {
      const search = `%${query}%`;
      qb = qb.where(sql`(${companies.companyName} ILIKE ${search} OR ${companies.companyCode} ILIKE ${search})`) as any;
    }
    return qb;
  }

  async updateCompany(id: string, dto: CompanyDto) {
    const db = TenantContext.getDb();
    const result = await db
      .update(companies)
      .set({
        companyCode: dto.companyCode.trim(),
        companyName: dto.companyName.trim(),
        email: dto.email ? dto.email.trim() : null,
        phone: dto.phone ? dto.phone.trim() : null,
        website: dto.website ? dto.website.trim() : null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();
    if (result.length === 0) {
      throw new NotFoundException(`Company with ID '${id}' not found`);
    }
    return result[0];
  }

  async deleteCompany(id: string) {
    const db = TenantContext.getDb();
    const result = await db.delete(companies).where(eq(companies.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundException(`Company with ID '${id}' not found`);
    }
    return { success: true };
  }
}
