import { z } from 'zod';

export const CreateTenantSchema = z.object({
  companyCode: z.string().min(2, 'Company Code must contain at least 2 characters').max(50),
  companyName: z.string().min(2, 'Company Name must contain at least 2 characters').max(255),
  legalName: z.string().max(255).optional(),
  organizationType: z.string().max(100).optional(),
  logo: z.string().url('Invalid logo URL format').or(z.string().max(500)).optional(),
  address: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format (E.164)').optional(),
  email: z.string().email('Invalid email address format'),
  website: z.string().url('Invalid website URL format').or(z.string().max(255)).optional(),
  gstVatNumber: z.string().max(50).optional(),
  timeZone: z.string().default('UTC'),
  currency: z.string().default('USD'),
  language: z.string().default('en')
});

export const UpdateTenantSchema = CreateTenantSchema.partial().extend({
  subscriptionPlan: z.enum(['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'ULTIMATE']).optional(),
  licenseType: z.enum(['TRIAL', 'PAID']).optional(),
  storageLimit: z.number().int().positive().optional(),
  userLimit: z.number().int().positive().optional(),
  branchLimit: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED', 'INACTIVE']).optional(),
  expiryDate: z.string().datetime().or(z.date()).optional(),
  isActive: z.boolean().optional()
});

export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;
