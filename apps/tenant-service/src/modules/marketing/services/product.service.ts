import { Injectable } from '@nestjs/common';
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
}
