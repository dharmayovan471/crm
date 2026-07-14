import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { customers } from '../../database/schemas/tenant.schema';

@Injectable()
export class CustomerRepository {
  async create(customerData: any) {
    const db = TenantContext.getDb();
    const result = await db.insert(customers).values(customerData).returning();
    return result[0];
  }

  async findAll() {
    const db = TenantContext.getDb();
    return db.select().from(customers);
  }

  async findById(id: string) {
    const db = TenantContext.getDb();
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    const customer = result[0];
    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }
    return customer;
  }

  async update(id: string, customerData: any) {
    const db = TenantContext.getDb();
    await this.findById(id);
    const result = await db.update(customers).set(customerData).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async getMapCoordinates() {
    const db = TenantContext.getDb();
    return db
      .select({
        id: customers.id,
        customerCode: customers.customerCode,
        companyName: customers.companyName,
        latitude: customers.latitude,
        longitude: customers.longitude,
      })
      .from(customers)
      .where(sql`${customers.latitude} IS NOT NULL AND ${customers.longitude} IS NOT NULL`);
  }
}
