import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const CustomerCreateSchema = z.object({
  customerCode: z.string().min(2),
  companyName: z.string().min(2),
  contactPerson: z.string().min(2).optional().nullable(),
  mobile: z.string().min(10).optional().nullable(),
  email: z.string().email().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  city: z.string().min(2).optional().nullable(),
  district: z.string().min(2).optional().nullable(),
  state: z.string().min(2).optional().nullable(),
  country: z.string().min(2).optional().nullable(),
  pincode: z.string().min(4).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  gstNo: z.string().optional().nullable(),
  panNo: z.string().optional().nullable(),
  creditLimit: z.number().nonnegative().optional().nullable(),
  remarks: z.string().optional().nullable(),
  customerType: z.string().min(2).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const CustomerUpdateSchema = CustomerCreateSchema.partial();

export class CustomerCreateDto {
  @ApiProperty({ example: 'CUST-001' })
  customerCode!: string;

  @ApiProperty({ example: 'Beta Corp' })
  companyName!: string;

  @ApiProperty({ example: 'Jane Doe', required: false })
  contactPerson?: string;

  @ApiProperty({ example: '+1987654321', required: false })
  mobile?: string;

  @ApiProperty({ example: 'jane@betacorp.com', required: false })
  email?: string;

  @ApiProperty({ example: '456 Business Lane', required: false })
  billingAddress?: string;

  @ApiProperty({ example: '456 Business Lane', required: false })
  shippingAddress?: string;

  @ApiProperty({ example: 'Detroit', required: false })
  city?: string;

  @ApiProperty({ example: 'Wayne', required: false })
  district?: string;

  @ApiProperty({ example: 'Michigan', required: false })
  state?: string;

  @ApiProperty({ example: 'USA', required: false })
  country?: string;

  @ApiProperty({ example: '48201', required: false })
  pincode?: string;

  @ApiProperty({ example: 42.331427, required: false })
  latitude?: number;

  @ApiProperty({ example: -83.045753, required: false })
  longitude?: number;

  @ApiProperty({ example: 'GST123456789', required: false })
  gstNo?: string;

  @ApiProperty({ example: 'PAN123456', required: false })
  panNo?: string;

  @ApiProperty({ example: 50000.00, required: false })
  creditLimit?: number;

  @ApiProperty({ example: 'Reliable customer', required: false })
  remarks?: string;

  @ApiProperty({ example: 'Wholesaler', required: false })
  customerType?: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  status!: string;
}

export class CustomerUpdateDto extends CustomerCreateDto {}
