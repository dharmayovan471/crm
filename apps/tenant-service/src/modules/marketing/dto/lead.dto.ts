import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const LeadProductSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

export const LeadCreateSchema = z.object({
  companyName: z.string().min(2),
  contactPerson: z.string().min(2),
  mobile: z.string().min(10).optional().nullable(),
  alternateMobile: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address1: z.string().min(5).optional().nullable(),
  address2: z.string().optional().nullable(),
  city: z.string().min(2).optional().nullable(),
  district: z.string().min(2).optional().nullable(),
  state: z.string().min(2).optional().nullable(),
  country: z.string().min(2).optional().nullable(),
  pincode: z.string().min(4).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  source: z.string().min(2),
  website: z.string().url().optional().nullable(),
  industry: z.string().min(2),
  leadStatusId: z.string().uuid().optional().nullable(),
  leadScore: z.number().int().nonnegative().optional(),
  remarks: z.string().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  teamId: z.string().uuid().optional().nullable(),
  zoneId: z.string().uuid().optional().nullable(),
  regionId: z.string().uuid().optional().nullable(),
  expectedValue: z.number().nonnegative().optional().nullable(),
  expectedClosingDate: z.string().datetime().optional().nullable(),
  products: z.array(LeadProductSchema).optional(),
});

export const LeadUpdateSchema = LeadCreateSchema.partial();

export class LeadProductDto {
  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a001' })
  productId!: string;

  @ApiProperty({ example: 10 })
  quantity!: number;

  @ApiProperty({ example: 150.00 })
  unitPrice!: number;
}

export class LeadCreateDto {
  @ApiProperty({ example: 'Acme Corp' })
  companyName!: string;

  @ApiProperty({ example: 'John Smith' })
  contactPerson!: string;

  @ApiProperty({ example: '+1234567890' })
  mobile!: string;

  @ApiProperty({ example: '+1098765432', required: false })
  alternateMobile?: string;

  @ApiProperty({ example: 'john@acme.com' })
  email!: string;

  @ApiProperty({ example: '123 Business Rd' })
  address1!: string;

  @ApiProperty({ example: 'Suite 400', required: false })
  address2?: string;

  @ApiProperty({ example: 'Chicago' })
  city!: string;

  @ApiProperty({ example: 'Cook' })
  district!: string;

  @ApiProperty({ example: 'Illinois' })
  state!: string;

  @ApiProperty({ example: 'USA' })
  country!: string;

  @ApiProperty({ example: '60601' })
  pincode!: string;

  @ApiProperty({ example: 41.878113, required: false })
  latitude?: number;

  @ApiProperty({ example: -87.629799, required: false })
  longitude?: number;

  @ApiProperty({ example: 'Website' })
  source!: string;

  @ApiProperty({ example: 'https://acme.com', required: false })
  website?: string;

  @ApiProperty({ example: 'Manufacturing' })
  industry!: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a002', required: false })
  leadStatusId?: string;

  @ApiProperty({ example: 85, required: false })
  leadScore?: number;

  @ApiProperty({ example: 'Looks promising', required: false })
  remarks?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a003', required: false })
  assignedTo?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a004', required: false })
  teamId?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a005', required: false })
  zoneId?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a006', required: false })
  regionId?: string;

  @ApiProperty({ example: 5000.00, required: false })
  expectedValue?: number;

  @ApiProperty({ example: '2026-12-31T23:59:59Z', required: false })
  expectedClosingDate?: string;

  @ApiProperty({ type: [LeadProductDto], required: false })
  products?: LeadProductDto[];
}

export class LeadUpdateDto extends LeadCreateDto {}
