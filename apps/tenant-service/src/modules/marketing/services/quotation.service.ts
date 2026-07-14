import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { quotations, quotationItems } from '../../database/schemas/tenant.schema';
import { QuotationCreateDto } from '../dto/quotation.dto';

@Injectable()
export class QuotationService {
  async create(dto: QuotationCreateDto) {
    const db = TenantContext.getDb();

    // 1. Calculate subtotals
    let subtotal = 0;
    const itemsData = dto.items.map((item) => {
      const amount = item.rate * item.quantity;
      subtotal += amount;
      return {
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate,
        amount,
      };
    });

    const discount = dto.discount || 0;
    const taxAmount = dto.taxAmount || 0;
    const totalAmount = subtotal - discount + taxAmount;

    // 2. Insert header
    const result = await db
      .insert(quotations)
      .values({
        quotationNo: dto.quotationNo,
        leadId: dto.leadId,
        customerId: dto.customerId,
        quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        subtotal: subtotal.toString(),
        discount: discount.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        status: dto.status,
      })
      .returning();

    const newQuote = result[0];

    // 3. Insert items
    const linkItems = itemsData.map((item) => ({
      quotationId: newQuote.id,
      ...item,
      subtotal: item.amount.toString(),
      rate: item.rate.toString(),
      amount: item.amount.toString(),
    }));

    await db.insert(quotationItems).values(linkItems);

    return this.findOne(newQuote.id);
  }

  async findAll() {
    const db = TenantContext.getDb();
    return db.select().from(quotations);
  }

  async findOne(id: string) {
    const db = TenantContext.getDb();
    const result = await db.select().from(quotations).where(eq(quotations.id, id)).limit(1);
    const quote = result[0];
    if (!quote) {
      throw new NotFoundException(`Quotation with ID '${id}' not found`);
    }

    const items = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id));

    return {
      ...quote,
      items,
    };
  }

  async update(id: string, dto: QuotationCreateDto) {
    const db = TenantContext.getDb();
    await this.findOne(id);

    // Re-calculate
    let subtotal = 0;
    const itemsData = dto.items.map((item) => {
      const amount = item.rate * item.quantity;
      subtotal += amount;
      return {
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate,
        amount,
      };
    });

    const discount = dto.discount || 0;
    const taxAmount = dto.taxAmount || 0;
    const totalAmount = subtotal - discount + taxAmount;

    // Update header
    await db
      .update(quotations)
      .set({
        quotationNo: dto.quotationNo,
        leadId: dto.leadId,
        customerId: dto.customerId,
        quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        subtotal: subtotal.toString(),
        discount: discount.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        status: dto.status,
      })
      .where(eq(quotations.id, id));

    // Re-link items
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
    
    const linkItems = itemsData.map((item) => ({
      quotationId: id,
      ...item,
      subtotal: item.amount.toString(),
      rate: item.rate.toString(),
      amount: item.amount.toString(),
    }));

    await db.insert(quotationItems).values(linkItems);

    return this.findOne(id);
  }
}
