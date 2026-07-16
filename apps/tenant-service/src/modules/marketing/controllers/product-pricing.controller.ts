import { Controller, Get, Query, Body, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Product Pricing')
@Controller('product-pricing')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class ProductPricingController {
  constructor(private readonly productService: ProductService) {}

  @Get('calculate')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Calculate product price based on pricing slab and type' })
  async calculate(
    @Query('productId') queryProductId?: string,
    @Query('estimatedCount') queryEstimatedCount?: string,
    @Body() body?: { productId?: string; estimatedCount?: number },
  ) {
    const productId = queryProductId || body?.productId;
    const countStr = queryEstimatedCount !== undefined ? queryEstimatedCount : (body?.estimatedCount !== undefined ? String(body.estimatedCount) : undefined);
    
    if (!productId) {
      throw new BadRequestException('productId is required');
    }
    if (countStr === undefined) {
      throw new BadRequestException('estimatedCount is required');
    }
    
    const estimatedCount = parseInt(countStr, 10);
    if (isNaN(estimatedCount) || estimatedCount <= 0) {
      throw new BadRequestException('estimatedCount must be a positive integer');
    }

    return this.productService.calculateProductPrice(productId, estimatedCount);
  }
}
