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
  minimumQty: z.number().int().nonnegative(),
  maximumQty: z.number().int().positive(),
  unitPrice: z.number().positive(),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime(),
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
  @ApiProperty({ example: 1 })
  minimumQty!: number;

  @ApiProperty({ example: 100 })
  maximumQty!: number;

  @ApiProperty({ example: 100.00 })
  unitPrice!: number;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  effectiveFrom!: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z' })
  effectiveTo!: string;
}
