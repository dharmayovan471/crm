import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const ActivityCreateSchema = z.object({
  leadId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  type: z.enum(['CALL', 'HOT_CALL', 'VISIT', 'FOLLOWUP', 'EMAIL', 'MEETING']),
  activityDate: z.string().datetime().optional(),
  nextFollowupDate: z.string().datetime().optional().nullable(),
  remarks: z.string().optional().nullable(),
  status: z.enum(['OPEN', 'COMPLETED']).default('OPEN'),
});

export class ActivityCreateDto {
  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a001', required: false })
  leadId?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a002', required: false })
  customerId?: string;

  @ApiProperty({ example: 'HOT_CALL', enum: ['CALL', 'HOT_CALL', 'VISIT', 'FOLLOWUP', 'EMAIL', 'MEETING'] })
  type!: string;

  @ApiProperty({ example: '2026-07-11T12:00:00Z', required: false })
  activityDate?: string;

  @ApiProperty({ example: '2026-07-18T12:00:00Z', required: false })
  nextFollowupDate?: string;

  @ApiProperty({ example: 'Discussed pricing and options', required: false })
  remarks?: string;

  @ApiProperty({ example: 'OPEN', enum: ['OPEN', 'COMPLETED'], default: 'OPEN' })
  status!: string;
}
