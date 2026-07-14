import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const TeamCreateSchema = z.object({
  teamName: z.string().min(2),
  description: z.string().optional().nullable(),
});

export const MemberAddSchema = z.object({
  userId: z.string().uuid(),
  designation: z.enum(['HEAD', 'COORDINATOR', 'MANAGER', 'MEMBER']).default('MEMBER'),
});

export const TargetCreateSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  targetValue: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
});

export class TeamCreateDto {
  @ApiProperty({ example: 'Sales North' })
  teamName!: string;

  @ApiProperty({ example: 'Northern region sales team', required: false })
  description?: string;
}

export class MemberAddDto {
  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a001' })
  userId!: string;

  @ApiProperty({ example: 'MEMBER', enum: ['HEAD', 'COORDINATOR', 'MANAGER', 'MEMBER'] })
  designation!: string;
}

export class TargetCreateDto {
  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a001', required: false })
  userId?: string;

  @ApiProperty({ example: 1000000.00 })
  targetValue!: number;

  @ApiProperty({ example: 7 })
  month!: number;

  @ApiProperty({ example: 2026 })
  year!: number;
}
