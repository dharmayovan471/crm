import { z } from 'zod';

export const CreateLeadSchema = z.object({
  firstName: z.string().min(2, 'First name must contain at least 2 characters'),
  lastName: z.string().min(2, 'Last name must contain at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format (E.164)'),
  source: z.enum(['WEBSITE', 'CAMPAIGN', 'PARTNER', 'REFERRAL']),
  enquiryNotes: z.string().optional()
});

export const UpdateLeadSchema = CreateLeadSchema.partial().extend({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']).optional()
});

export type CreateLeadDto = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadDto = z.infer<typeof UpdateLeadSchema>;
