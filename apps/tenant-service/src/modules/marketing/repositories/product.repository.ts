import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { products, productPrices } from '../../database/schemas/tenant.schema';

@Injectable()
export class ProductRepository {
  async createProduct(productData: any) {
    const db = TenantContext.getDb();
    const result = await db.insert(products).values(productData).returning();
    return result[0];
  }

  async findAllProducts() {
    const db = TenantContext.getDb();
    return db.select().from(products);
  }

  async findProductById(id: string) {
    const db = TenantContext.getDb();
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    const prod = result[0];
    if (!prod) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }
    return prod;
  }

  async createProductPrice(productId: string, priceData: any) {
    const db = TenantContext.getDb();
    await this.findProductById(productId);

    // Verify no overlaps
    const existingPrices = await this.findPricesOfProduct(productId);
    const hasOverlap = existingPrices.some(
      (p) => priceData.minCount <= p.maxCount && priceData.maxCount >= p.minCount
    );
    if (hasOverlap) {
      throw new Error(`Pricing ranges for the same product must not overlap.`);
    }

    const result = await db
      .insert(productPrices)
      .values({
        productId,
        pricingType: priceData.pricingType,
        minCount: priceData.minCount,
        maxCount: priceData.maxCount,
        unitPrice: priceData.unitPrice ? priceData.unitPrice.toString() : null,
        fixedAmount: priceData.fixedAmount ? priceData.fixedAmount.toString() : null,
        currency: priceData.currency || 'INR',
        effectiveFrom: new Date(priceData.effectiveFrom),
        effectiveTo: new Date(priceData.effectiveTo),
        status: priceData.status || 'ACTIVE',
      })
      .returning();
    return result[0];
  }

  async findPricesOfProduct(productId: string) {
    const db = TenantContext.getDb();
    await this.findProductById(productId);
    return db
      .select()
      .from(productPrices)
      .where(eq(productPrices.productId, productId));
  }

  async getPriceForQty(productId: string, qty: number): Promise<number> {
    const db = TenantContext.getDb();
    const prices = await db
      .select()
      .from(productPrices)
      .where(eq(productPrices.productId, productId));
    
    const matchingSlab = prices.find(
      (p) => qty >= p.minCount && qty <= p.maxCount
    );
    
    if (matchingSlab) {
      if (matchingSlab.pricingType === 'FIXED') {
        return parseFloat(matchingSlab.fixedAmount || '0');
      } else {
        return qty * parseFloat(matchingSlab.unitPrice || '0');
      }
    }
    return 0;
  }
}
