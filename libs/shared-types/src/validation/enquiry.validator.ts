import { z } from 'zod';

export const CreateEnquirySchema = z.object({
  leadId: z.string().uuid('Lead ID must be a valid UUIDv4'),
  subject: z.string().min(5, 'Subject must be at least 5 characters long'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
});

export const UpdateEnquirySchema = CreateEnquirySchema.partial().extend({
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedToUserId: z.string().uuid('Assigned User ID must be a valid UUIDv4').optional()
});

export type CreateEnquiryDto = z.infer<typeof CreateEnquirySchema>;
export type UpdateEnquiryDto = z.infer<typeof UpdateEnquirySchema>;
