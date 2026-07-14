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
    const result = await db
      .insert(productPrices)
      .values({
        productId,
        minimumQty: priceData.minimumQty,
        maximumQty: priceData.maximumQty,
        unitPrice: priceData.unitPrice.toString(),
        effectiveFrom: new Date(priceData.effectiveFrom),
        effectiveTo: new Date(priceData.effectiveTo),
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
}
