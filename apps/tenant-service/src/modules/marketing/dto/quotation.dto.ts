import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const QuotationItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  rate: z.number().positive(),
});

export const QuotationCreateSchema = z.object({
  quotationNo: z.string().optional().nullable(), // Optional since we auto-generate it if empty
  leadId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  quoteDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional().nullable(),
  discount: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  status: z.enum(['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED']).default('DRAFT'),
  items: z.array(QuotationItemSchema).min(1),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  preparedBy: z.string().uuid().optional().nullable(),
  approvedBy: z.string().uuid().optional().nullable(),
  signature: z.string().optional().nullable(),
});

export class QuotationItemDto {
  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a001' })
  productId!: string;

  @ApiProperty({ example: 50 })
  quantity!: number;

  @ApiProperty({ example: 95.00 })
  rate!: number;
}

export class QuotationCreateDto {
  @ApiProperty({ example: 'QT-2026-0001', required: false })
  quotationNo?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a002', required: false })
  leadId?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a003', required: false })
  customerId?: string;

  @ApiProperty({ example: '2026-07-11T12:00:00Z', required: false })
  quoteDate?: string;

  @ApiProperty({ example: '2026-08-11T12:00:00Z', required: false })
  validUntil?: string;

  @ApiProperty({ example: 100.00, required: false, default: 0.00 })
  discount?: number;

  @ApiProperty({ example: 180.00, required: false, default: 0.00 })
  taxAmount?: number;

  @ApiProperty({ example: 'DRAFT', enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'] })
  status!: string;

  @ApiProperty({ type: [QuotationItemDto] })
  items!: QuotationItemDto[];

  @ApiProperty({ example: 'Standard Net 30 terms', required: false })
  terms?: string;

  @ApiProperty({ example: 'Thank you for your business', required: false })
  notes?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a004', required: false })
  preparedBy?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a005', required: false })
  approvedBy?: string;

  @ApiProperty({ example: 'base64_encoded_signature_image', required: false })
  signature?: string;
}
