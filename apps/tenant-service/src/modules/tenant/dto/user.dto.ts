import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const DepartmentCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const DesignationCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const EmployeeCreateSchema = z.object({
  employeeCode: z.string().min(2, 'Employee code must be at least 2 characters'),
});

export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  designationId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  employeeId: z.string().uuid().optional().nullable(),
  phone: z.string().optional().nullable(),
  roleIds: z.array(z.string().uuid()).optional(),
});

export const UserUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  designationId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  employeeId: z.string().uuid().optional().nullable(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});

export class DepartmentCreateDto {
  @ApiProperty({ example: 'Engineering' })
  name!: string;
}

export class DesignationCreateDto {
  @ApiProperty({ example: 'Software Engineer' })
  name!: string;
}

export class EmployeeCreateDto {
  @ApiProperty({ example: 'EMP1001' })
  employeeCode!: string;
}

export class UserCreateDto {
  @ApiProperty({ example: 'john.doe@company.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a001', required: false })
  designationId?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a002', required: false })
  departmentId?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a003', required: false })
  employeeId?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  phone?: string;

  @ApiProperty({ example: ['d290f1d6-2e4b-4b2a-89a1-77884a29a004'], type: [String], required: false })
  roleIds?: string[];
}

export class UserUpdateDto {
  @ApiProperty({ example: 'john.doe@company.com', required: false })
  email?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a001', required: false })
  designationId?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a002', required: false })
  departmentId?: string;

  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a003', required: false })
  employeeId?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  phone?: string;

  @ApiProperty({ example: true, required: false })
  isActive?: boolean;

  @ApiProperty({ example: ['d290f1d6-2e4b-4b2a-89a1-77884a29a004'], type: [String], required: false })
  roleIds?: string[];
}
