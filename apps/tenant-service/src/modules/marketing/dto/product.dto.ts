import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const ProductCreateSchema = z.object({
  productCode: z.string().min(2),
  productName: z.string().min(2),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  uom: z.string().min(1),
  isActive: z.boolean().default(true),
});

export const PriceCreateSchema = z.object({
  pricingType: z.enum(['FIXED', 'UNIT']),
  minCount: z.number().int().nonnegative(),
  maxCount: z.number().int().positive(),
  unitPrice: z.number().positive().optional().nullable(),
  fixedAmount: z.number().positive().optional().nullable(),
  currency: z.string().optional().default('INR'),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime(),
}).refine((data) => {
  if (data.pricingType === 'FIXED') {
    return data.fixedAmount !== undefined && data.fixedAmount !== null && (data.unitPrice === undefined || data.unitPrice === null);
  } else {
    return data.unitPrice !== undefined && data.unitPrice !== null && (data.fixedAmount === undefined || data.fixedAmount === null);
  }
}, {
  message: "For FIXED pricing, fixedAmount is required and unitPrice must be null. For UNIT pricing, unitPrice is required and fixedAmount must be null.",
  path: ["pricingType"]
});

export class ProductCreateDto {
  @ApiProperty({ example: 'PROD-001' })
  productCode!: string;

  @ApiProperty({ example: 'Steel Pipe' })
  productName!: string;

  @ApiProperty({ example: 'Hardware', required: false })
  category?: string;

  @ApiProperty({ example: 'High strength steel pipes', required: false })
  description?: string;

  @ApiProperty({ example: 'PCS' })
  uom!: string;

  @ApiProperty({ example: true, default: true })
  isActive!: boolean;
}

export class PriceCreateDto {
  @ApiProperty({ example: 'FIXED', enum: ['FIXED', 'UNIT'] })
  pricingType!: 'FIXED' | 'UNIT';

  @ApiProperty({ example: 1 })
  minCount!: number;

  @ApiProperty({ example: 100 })
  maxCount!: number;

  @ApiProperty({ example: null, required: false })
  unitPrice?: number | null;

  @ApiProperty({ example: 20000.00, required: false })
  fixedAmount?: number | null;

  @ApiProperty({ example: 'INR', default: 'INR' })
  currency!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  effectiveFrom!: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z' })
  effectiveTo!: string;
}
