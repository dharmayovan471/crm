import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { leads, leadProducts, leadStatuses, leadNumberSettings, users, activities } from '../../database/schemas/tenant.schema';

@Injectable()
export class LeadRepository {
  async getNextLeadNumber(): Promise<string> {
    const db = TenantContext.getDb();
    
    // 1. Get settings
    const settings = await db.select().from(leadNumberSettings).limit(1);
    let prefix = 'LD';
    let sequence = 1;

    if (settings.length > 0) {
      prefix = settings[0].prefix;
      sequence = settings[0].currentSequence;
      
      // Increment sequence
      await db
        .update(leadNumberSettings)
        .set({ currentSequence: sequence + 1 })
        .where(eq(leadNumberSettings.id, settings[0].id));
    }

    // 2. Resolve Financial Year (FY)
    // Indian FY runs April 1 to March 31.
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed: Jan=0, Apr=3
    
    let fyStart = currentYear;
    let fyEnd = currentYear + 1;

    if (currentMonth < 3) {
      fyStart = currentYear - 1;
      fyEnd = currentYear;
    }

    const fyString = `${fyStart.toString().slice(-2)}-${fyEnd.toString().slice(-2)}`;

    // 3. Zero pad sequence (e.g. 0001)
    const seqString = sequence.toString().padStart(4, '0');

    return `${prefix}/${fyString}/${seqString}`;
  }

  async create(leadData: any, productsData?: any[]) {
    const db = TenantContext.getDb();
    
    // Auto-generate lead number
    const leadNo = await this.getNextLeadNumber();

    const insertData = {
      ...leadData,
      leadNo,
    };

    const result = await db.insert(leads).values(insertData).returning();
    const newLead = result[0];

    if (productsData && productsData.length > 0) {
      const pValues = productsData.map((p) => ({
        leadId: newLead.id,
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice.toString(),
        amount: (p.quantity * p.unitPrice).toString(),
      }));
      await db.insert(leadProducts).values(pValues);
    }

    return this.findById(newLead.id);
  }

  async findAll(query?: string, statusId?: string) {
    const db = TenantContext.getDb();
    const conditions = [];

    if (statusId) {
      conditions.push(eq(leads.leadStatusId, statusId));
    }

    if (query) {
      const searchPattern = `%${query}%`;
      conditions.push(
        sql`(${leads.leadNo} ILIKE ${searchPattern} OR 
             ${leads.companyName} ILIKE ${searchPattern} OR 
             ${leads.contactPerson} ILIKE ${searchPattern} OR 
             ${leads.email} ILIKE ${searchPattern})`
      );
    }

    let queryBuilder = db
      .select({
        lead: leads,
        status: leadStatuses,
        user: users,
      })
      .from(leads)
      .leftJoin(leadStatuses, eq(leads.leadStatusId, leadStatuses.id))
      .leftJoin(users, eq(leads.assignedTo, users.id));

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    const results = await queryBuilder;

    return results.map((row) => ({
      ...row.lead,
      statusName: row.status?.name || null,
      assignedUserEmail: row.user?.email || null,
      contactName: row.lead.contactPerson || null,
    }));
  }

  async findById(id: string) {
    const db = TenantContext.getDb();
    const leadResult = await db
      .select({
        lead: leads,
        status: leadStatuses,
      })
      .from(leads)
      .leftJoin(leadStatuses, eq(leads.leadStatusId, leadStatuses.id))
      .where(eq(leads.id, id))
      .limit(1);

    const leadInfo = leadResult[0];
    if (!leadInfo) {
      throw new NotFoundException(`Lead with ID '${id}' not found`);
    }

    const linkedProducts = await db
      .select()
      .from(leadProducts)
      .where(eq(leadProducts.leadId, id));

    const linkedActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.leadId, id))
      .orderBy(desc(activities.activityDate));

    return {
      ...leadInfo.lead,
      status: leadInfo.status,
      products: linkedProducts,
      activities: linkedActivities,
    };
  }

  async update(id: string, leadData: any, productsData?: any[]) {
    const db = TenantContext.getDb();
    
    // Verify lead exists
    await this.findById(id);

    if (Object.keys(leadData).length > 0) {
      await db
        .update(leads)
        .set({ ...leadData, updatedAt: new Date() })
        .where(eq(leads.id, id));
    }

    if (productsData) {
      // Re-link lead products
      await db.delete(leadProducts).where(eq(leadProducts.leadId, id));
      if (productsData.length > 0) {
        const pValues = productsData.map((p) => ({
          leadId: id,
          productId: p.productId,
          quantity: p.quantity,
          unitPrice: p.unitPrice.toString(),
          amount: (p.quantity * p.unitPrice).toString(),
        }));
        await db.insert(leadProducts).values(pValues);
      }
    }

    return this.findById(id);
  }

  async delete(id: string) {
    const db = TenantContext.getDb();
    // Verify lead exists
    await this.findById(id);
    await db.delete(leads).where(eq(leads.id, id));
    return { success: true };
  }

  async getMapCoordinates() {
    const db = TenantContext.getDb();
    return db
      .select({
        id: leads.id,
        leadNo: leads.leadNo,
        companyName: leads.companyName,
        latitude: leads.latitude,
        longitude: leads.longitude,
      })
      .from(leads)
      .where(sql`${leads.latitude} IS NOT NULL AND ${leads.longitude} IS NOT NULL`);
  }

  async getStatuses() {
    const db = TenantContext.getDb();
    return db.select().from(leadStatuses);
  }
}
