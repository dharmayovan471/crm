import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { quotations, quotationItems, quotationRevisions, quotationHistory, productPrices } from '../../database/schemas/tenant.schema';
import { QuotationCreateDto } from '../dto/quotation.dto';

@Injectable()
export class QuotationService {
  async getNextQuotationNumber(db: any): Promise<string> {
    const today = new Date();
    const currentYear = today.getFullYear();
    const prefix = `QT-${currentYear}-`;
    
    const existingQuotes = await db
      .select({ quotationNo: quotations.quotationNo })
      .from(quotations)
      .where(sql`${quotations.quotationNo} LIKE ${`${prefix}%`}`);
      
    let maxSeq = 0;
    for (const q of existingQuotes) {
      const parts = q.quotationNo.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    const nextSeq = maxSeq + 1;
    return `${prefix}${nextSeq.toString().padStart(6, '0')}`;
  }

  async create(dto: QuotationCreateDto) {
    const db = TenantContext.getDb();

    // 1. Calculate subtotals based on pricing slabs
    let subtotal = 0;
    const itemsData = [];
    for (const item of dto.items) {
      const prices = await db
        .select()
        .from(productPrices)
        .where(eq(productPrices.productId, item.productId));
      const slab = prices.find((sp) => item.quantity >= sp.minCount && item.quantity <= sp.maxCount);
      
      let amount = 0;
      let rate = item.rate;
      if (slab) {
        if (slab.pricingType === 'FIXED') {
          amount = parseFloat(slab.fixedAmount || '0');
          rate = amount; 
        } else {
          rate = parseFloat(slab.unitPrice || '0');
          amount = item.quantity * rate;
        }
      } else {
        amount = item.quantity * rate;
      }
      subtotal += amount;
      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        rate,
        amount,
      });
    }

    const discount = dto.discount || 0;
    const taxAmount = dto.taxAmount || 0;
    const totalAmount = subtotal - discount + taxAmount;

    // 2. Generate quotation number
    const quotationNo = dto.quotationNo || (await this.getNextQuotationNumber(db));

    // 3. Insert header
    const result = await db
      .insert(quotations)
      .values({
        quotationNo,
        revisionNo: 'R0',
        leadId: dto.leadId,
        customerId: dto.customerId,
        quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        subtotal: subtotal.toString(),
        discount: discount.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        status: dto.status || 'DRAFT',
        terms: dto.terms || null,
        notes: dto.notes || null,
        preparedBy: dto.preparedBy || null,
        approvedBy: dto.approvedBy || null,
        signature: dto.signature || null,
      })
      .returning();

    const newQuote = result[0];

    // 4. Insert items
    const linkItems = itemsData.map((item) => ({
      quotationId: newQuote.id,
      productId: item.productId,
      quantity: item.quantity,
      rate: item.rate.toString(),
      amount: item.amount.toString(),
    }));

    if (linkItems.length > 0) {
      await db.insert(quotationItems).values(linkItems);
    }

    // 5. Seed initial history record
    await db.insert(quotationHistory).values({
      quotationId: newQuote.id,
      revisionNo: 'R0',
      status: dto.status || 'DRAFT',
      remarks: 'Quotation created',
    });

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
    const revisions = await db.select().from(quotationRevisions).where(eq(quotationRevisions.quotationId, id));
    const history = await db.select().from(quotationHistory).where(eq(quotationHistory.quotationId, id));

    return {
      ...quote,
      items,
      revisions,
      history,
    };
  }

  async update(id: string, dto: QuotationCreateDto) {
    const db = TenantContext.getDb();
    const currentQuote = await this.findOne(id);

    // Calculate subtotals based on pricing slabs
    let subtotal = 0;
    const itemsData = [];
    for (const item of dto.items) {
      const prices = await db
        .select()
        .from(productPrices)
        .where(eq(productPrices.productId, item.productId));
      const slab = prices.find((sp) => item.quantity >= sp.minCount && item.quantity <= sp.maxCount);
      
      let amount = 0;
      let rate = item.rate;
      if (slab) {
        if (slab.pricingType === 'FIXED') {
          amount = parseFloat(slab.fixedAmount || '0');
          rate = amount; 
        } else {
          rate = parseFloat(slab.unitPrice || '0');
          amount = item.quantity * rate;
        }
      } else {
        amount = item.quantity * rate;
      }
      subtotal += amount;
      itemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        rate,
        amount,
      });
    }

    const discount = dto.discount || 0;
    const taxAmount = dto.taxAmount || 0;
    const totalAmount = subtotal - discount + taxAmount;

    // Check status: If status is DRAFT, overwrite. If not, generate a new revision
    if (currentQuote.status === 'DRAFT') {
      await db
        .update(quotations)
        .set({
          leadId: dto.leadId,
          customerId: dto.customerId,
          quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : new Date(),
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          subtotal: subtotal.toString(),
          discount: discount.toString(),
          taxAmount: taxAmount.toString(),
          totalAmount: totalAmount.toString(),
          status: dto.status || 'DRAFT',
          terms: dto.terms || null,
          notes: dto.notes || null,
          preparedBy: dto.preparedBy || null,
          approvedBy: dto.approvedBy || null,
          signature: dto.signature || null,
        })
        .where(eq(quotations.id, id));

      // Re-link items
      await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
      const linkItems = itemsData.map((item) => ({
        quotationId: id,
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate.toString(),
        amount: item.amount.toString(),
      }));
      if (linkItems.length > 0) {
        await db.insert(quotationItems).values(linkItems);
      }

      await db.insert(quotationHistory).values({
        quotationId: id,
        revisionNo: currentQuote.revisionNo,
        status: dto.status || 'DRAFT',
        remarks: 'Quotation details updated',
      });
    } else {
      // 1. Create a Snapshot in quotationRevisions
      const revisionNo = currentQuote.revisionNo;
      await db.insert(quotationRevisions).values({
        quotationId: id,
        revisionNo,
        subtotal: currentQuote.subtotal,
        discount: currentQuote.discount,
        taxAmount: currentQuote.taxAmount,
        totalAmount: currentQuote.totalAmount,
        status: currentQuote.status,
        terms: currentQuote.terms,
        notes: currentQuote.notes,
        itemsSnapshot: JSON.stringify(currentQuote.items),
      });

      // 2. Parse and increment revision (e.g. 'R0' -> 'R1')
      const currentRevNum = parseInt(revisionNo.replace('R', '') || '0', 10);
      const newRevisionNo = `R${currentRevNum + 1}`;

      // 3. Update active quotation header with incremented revision number
      await db
        .update(quotations)
        .set({
          revisionNo: newRevisionNo,
          leadId: dto.leadId,
          customerId: dto.customerId,
          quoteDate: dto.quoteDate ? new Date(dto.quoteDate) : new Date(),
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          subtotal: subtotal.toString(),
          discount: discount.toString(),
          taxAmount: taxAmount.toString(),
          totalAmount: totalAmount.toString(),
          status: dto.status || 'DRAFT', // Usually drafts after edits
          terms: dto.terms || null,
          notes: dto.notes || null,
          preparedBy: dto.preparedBy || null,
          approvedBy: dto.approvedBy || null,
          signature: dto.signature || null,
        })
        .where(eq(quotations.id, id));

      // 4. Update items
      await db.delete(quotationItems).where(eq(quotationItems.quotationId, id));
      const linkItems = itemsData.map((item) => ({
        quotationId: id,
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate.toString(),
        amount: item.amount.toString(),
      }));
      if (linkItems.length > 0) {
        await db.insert(quotationItems).values(linkItems);
      }

      // 5. Track revision history
      await db.insert(quotationHistory).values({
        quotationId: id,
        revisionNo: newRevisionNo,
        status: dto.status || 'DRAFT',
        remarks: `Quotation revised to ${newRevisionNo} from ${revisionNo}`,
      });
    }

    return this.findOne(id);
  }

  async duplicate(id: string) {
    const db = TenantContext.getDb();
    const source = await this.findOne(id);

    const quotationNo = await this.getNextQuotationNumber(db);

    const result = await db
      .insert(quotations)
      .values({
        quotationNo,
        revisionNo: 'R0',
        leadId: source.leadId,
        customerId: source.customerId,
        quoteDate: new Date(),
        validUntil: source.validUntil ? new Date(source.validUntil) : null,
        subtotal: source.subtotal,
        discount: source.discount,
        taxAmount: source.taxAmount,
        totalAmount: source.totalAmount,
        status: 'DRAFT',
        terms: source.terms,
        notes: source.notes,
        preparedBy: source.preparedBy,
        approvedBy: source.approvedBy,
        signature: source.signature,
      })
      .returning();

    const newQuote = result[0];

    const copyItems = source.items.map((item: any) => ({
      quotationId: newQuote.id,
      productId: item.productId,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    }));

    if (copyItems.length > 0) {
      await db.insert(quotationItems).values(copyItems);
    }

    await db.insert(quotationHistory).values({
      quotationId: newQuote.id,
      revisionNo: 'R0',
      status: 'DRAFT',
      remarks: `Duplicated from ${source.quotationNo}`,
    });

    return this.findOne(newQuote.id);
  }

  async remove(id: string) {
    const db = TenantContext.getDb();
    await this.findOne(id);
    await db.delete(quotations).where(eq(quotations.id, id));
    return { success: true };
  }
}
