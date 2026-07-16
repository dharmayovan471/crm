import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from '../repositories/product.repository';
import { ProductCreateDto, PriceCreateDto } from '../dto/product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async createProduct(dto: ProductCreateDto) {
    return this.productRepository.createProduct(dto);
  }

  async findAllProducts() {
    return this.productRepository.findAllProducts();
  }

  async findProductById(id: string) {
    return this.productRepository.findProductById(id);
  }

  async createProductPrice(productId: string, dto: PriceCreateDto) {
    return this.productRepository.createProductPrice(productId, dto);
  }

  async getProductPrices(productId: string) {
    return this.productRepository.findPricesOfProduct(productId);
  }

  async getPriceForQty(productId: string, qty: number): Promise<number> {
    return this.productRepository.getPriceForQty(productId, qty);
  }

  async calculateProductPrice(productId: string, estimatedCount: number) {
    const prices = await this.productRepository.findPricesOfProduct(productId);
    const matchedSlab = prices.find(
      (p) => estimatedCount >= p.minCount && estimatedCount <= p.maxCount
    );

    if (!matchedSlab) {
      throw new NotFoundException(`No pricing slab found for estimated count ${estimatedCount}`);
    }

    if (matchedSlab.pricingType === 'FIXED') {
      const fixedAmount = parseFloat(matchedSlab.fixedAmount || '0');
      return {
        pricingType: 'FIXED',
        minCount: matchedSlab.minCount,
        maxCount: matchedSlab.maxCount,
        fixedAmount,
        unitPrice: null,
        totalAmount: fixedAmount,
      };
    } else {
      const unitPrice = parseFloat(matchedSlab.unitPrice || '0');
      return {
        pricingType: 'UNIT',
        minCount: matchedSlab.minCount,
        maxCount: matchedSlab.maxCount,
        unitPrice,
        fixedAmount: null,
        estimatedCount,
        totalAmount: estimatedCount * unitPrice,
      };
    }
  }
}
