import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { leads, leadProducts, leadStatuses, leadNumberSettings, users, activities, productPrices } from '../../database/schemas/tenant.schema';

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

    const today = new Date();
    const currentYear = today.getFullYear();
    
    // 3. Zero pad sequence to 6 digits (e.g. 000001)
    const seqString = sequence.toString().padStart(6, '0');

    return `${prefix}-${currentYear}-${seqString}`;
  }

  async resolveLeadExpectedValue(productsData?: any[]): Promise<{ expectedValue: number; resolvedProducts: any[] }> {
    const db = TenantContext.getDb();
    if (!productsData || productsData.length === 0) {
      return { expectedValue: 0, resolvedProducts: [] };
    }
    
    let expectedValue = 0;
    const resolvedProducts = [];
    
    for (const p of productsData) {
      const prices = await db
        .select()
        .from(productPrices)
        .where(eq(productPrices.productId, p.productId));
        
      const matchingSlab = prices.find(
        (sp) => p.quantity >= sp.minCount && p.quantity <= sp.maxCount
      );
      
      let amount = 0;
      let unitPrice = 0;
      
      if (matchingSlab) {
        if (matchingSlab.pricingType === 'FIXED') {
          amount = parseFloat(matchingSlab.fixedAmount || '0');
          unitPrice = amount; // Map FIXED amount directly
        } else {
          unitPrice = parseFloat(matchingSlab.unitPrice || '0');
          amount = p.quantity * unitPrice;
        }
      } else {
        unitPrice = p.unitPrice || 0;
        amount = p.quantity * unitPrice;
      }
      
      expectedValue += amount;
      
      resolvedProducts.push({
        ...p,
        unitPrice,
        amount
      });
    }
    
    return { expectedValue, resolvedProducts };
  }

  async create(leadData: any, productsData?: any[]) {
    const db = TenantContext.getDb();
    
    // Auto-generate lead number
    const leadNo = await this.getNextLeadNumber();

    // Resolve automatic price calculations
    const { expectedValue, resolvedProducts } = await this.resolveLeadExpectedValue(productsData);

    const insertData = {
      ...leadData,
      leadNo,
      expectedValue: expectedValue.toString(),
    };

    const result = await db.insert(leads).values(insertData).returning();
    const newLead = result[0];

    if (resolvedProducts.length > 0) {
      const pValues = resolvedProducts.map((p) => ({
        leadId: newLead.id,
        productId: p.productId,
        quantity: p.quantity,
        unitPrice: p.unitPrice.toString(),
        amount: p.amount.toString(),
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

    let updatedLeadData = { ...leadData };

    if (productsData) {
      const { expectedValue, resolvedProducts } = await this.resolveLeadExpectedValue(productsData);
      updatedLeadData.expectedValue = expectedValue.toString();

      // Re-link lead products
      await db.delete(leadProducts).where(eq(leadProducts.leadId, id));
      if (resolvedProducts.length > 0) {
        const pValues = resolvedProducts.map((p) => ({
          leadId: id,
          productId: p.productId,
          quantity: p.quantity,
          unitPrice: p.unitPrice.toString(),
          amount: p.amount.toString(),
        }));
        await db.insert(leadProducts).values(pValues);
      }
    }

    if (Object.keys(updatedLeadData).length > 0) {
      await db
        .update(leads)
        .set({ ...updatedLeadData, updatedAt: new Date() })
        .where(eq(leads.id, id));
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
