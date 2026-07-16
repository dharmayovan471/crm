import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

// Lead Source Validation
export const LeadSourceSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  isActive: z.boolean().optional(),
});
export class LeadSourceDto {
  @ApiProperty({ example: 'website' })
  code!: string;

  @ApiProperty({ example: 'Website' })
  name!: string;

  @ApiProperty({ example: true, required: false })
  isActive?: boolean;
}

// Industry Validation
export const IndustrySchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  isActive: z.boolean().optional(),
});
export class IndustryDto {
  @ApiProperty({ example: 'school' })
  code!: string;

  @ApiProperty({ example: 'School' })
  name!: string;

  @ApiProperty({ example: true, required: false })
  isActive?: boolean;
}

// Company Validation
export const CompanySchema = z.object({
  companyCode: z.string().min(2),
  companyName: z.string().min(2),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});
export class CompanyDto {
  @ApiProperty({ example: 'DIV-01' })
  companyCode!: string;

  @ApiProperty({ example: 'ERP Division' })
  companyName!: string;

  @ApiProperty({ example: 'info@division.com', required: false })
  email?: string;

  @ApiProperty({ example: '1234567890', required: false })
  phone?: string;

  @ApiProperty({ example: 'https://division.com', required: false })
  website?: string;

  @ApiProperty({ example: true, required: false })
  isActive?: boolean;
}
