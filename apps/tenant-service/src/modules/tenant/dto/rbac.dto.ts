import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const PermissionCreateSchema = z.object({
  code: z.string().min(3, 'Permission code must be at least 3 characters'),
  name: z.string().min(3, 'Permission name must be at least 3 characters'),
  module: z.string().min(2, 'Module name must be at least 2 characters'),
  description: z.string().optional(),
});

export const RolePermissionsAssignSchema = z.object({
  permissionIds: z.array(z.string().uuid('Invalid permission ID')),
});

export const UserRolesAssignSchema = z.object({
  roleIds: z.array(z.string().uuid('Invalid role ID')),
});

export class PermissionCreateDto {
  @ApiProperty({ example: 'user:create' })
  code!: string;

  @ApiProperty({ example: 'Create User' })
  name!: string;

  @ApiProperty({ example: 'user' })
  module!: string;

  @ApiProperty({ example: 'Allows creating system users', required: false })
  description?: string;
}

export class RolePermissionsAssignDto {
  @ApiProperty({ example: ['d290f1d6-2e4b-4b2a-89a1-77884a29a001'], type: [String] })
  permissionIds!: string[];
}

export class UserRolesAssignDto {
  @ApiProperty({ example: ['d290f1d6-2e4b-4b2a-89a1-77884a29a002'], type: [String] })
  roleIds!: string[];
}
