import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ProductCreateDto, PriceCreateDto, ProductCreateSchema, PriceCreateSchema } from '../dto/product.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Product Master')
@Controller('products')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Permissions('product:create')
  @ApiOperation({ summary: 'Create a new product record' })
  @ApiResponse({ status: 201, description: MESSAGES.PRODUCT_CREATE_SUCCESS })
  async createProduct(@Body(new ZodValidationPipe(ProductCreateSchema)) dto: ProductCreateDto) {
    return this.productService.createProduct(dto);
  }

  @Get()
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: MESSAGES.PRODUCT_RETRIEVE_SUCCESS })
  async findAllProducts() {
    return this.productService.findAllProducts();
  }

  @Post(':id/prices')
  @Permissions('product:create')
  @ApiOperation({ summary: 'Set pricing limits matrix for a product' })
  @ApiResponse({ status: 201, description: MESSAGES.PRICE_CREATE_SUCCESS })
  async createProductPrice(
    @Param('id') productId: string,
    @Body(new ZodValidationPipe(PriceCreateSchema)) dto: PriceCreateDto,
  ) {
    return this.productService.createProductPrice(productId, dto);
  }

  @Get(':id/prices')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get price tiers of a product' })
  @ApiResponse({ status: 200, description: MESSAGES.PRICE_RETRIEVE_SUCCESS })
  async getProductPrices(@Param('id') productId: string) {
    return this.productService.getProductPrices(productId);
  }

  @Get(':id/price')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get price of a product for a specific estimated count/quantity based on pricing slabs' })
  async getPriceForQty(
    @Param('id') productId: string,
    @Query('quantity') quantity: string,
  ) {
    const qty = parseInt(quantity || '0', 10);
    const price = await this.productService.getPriceForQty(productId, qty);
    return { unitPrice: price, quantity: qty, amount: price * qty };
  }
}
