import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

// ==========================================
// Zod Schemas
// ==========================================

export const TenantRegisterSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  tenantCode: z
    .string()
    .min(3, 'Tenant code must be at least 3 characters')
    .max(50, 'Tenant code cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Tenant code must be lowercase, alphanumeric, and may contain hyphens'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  adminEmail: z.string().email('Invalid admin email').optional(),
  adminPassword: z.string().min(8, 'Admin password must be at least 8 characters long'),
});

export const TenantLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantCode: z.string().min(3, 'Tenant code is required'),
});

export const UpdateTenantSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
});

// ==========================================
// Swagger DTO Classes (TypeScript & OpenAPI)
// ==========================================

export class TenantRegisterDto {
  @ApiProperty({ example: 'Apex Manufacturing Co.' })
  companyName!: string;

  @ApiProperty({ example: 'apex-mfg' })
  tenantCode!: string;

  @ApiProperty({ example: 'info@apex-mfg.com' })
  email!: string;

  @ApiProperty({ example: '+15550199', required: false })
  phone?: string;

  @ApiProperty({ example: 'GST27AAACA1234F1Z0', required: false })
  gstNumber?: string;

  @ApiProperty({ example: 'admin@apex-mfg.com', required: false })
  adminEmail?: string;

  @ApiProperty({ example: 'P@ssw0rd123!' })
  adminPassword!: string;
}

export class TenantLoginDto {
  @ApiProperty({ example: 'admin@apex-mfg.com' })
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd123!' })
  password!: string;

  @ApiProperty({ example: 'apex-mfg' })
  tenantCode!: string;
}

export class UpdateTenantDto {
  @ApiProperty({ example: 'Apex Manufacturing Limited', required: false })
  companyName?: string;

  @ApiProperty({ example: '+15559999', required: false })
  phone?: string;

  @ApiProperty({ example: 'GST27AAACA1234F1Z1', required: false })
  gstNumber?: string;
}
