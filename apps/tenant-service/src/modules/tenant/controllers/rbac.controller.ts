import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RbacService } from '../services/rbac.service';
import { PermissionCreateDto, RolePermissionsAssignDto, UserRolesAssignDto, PermissionCreateSchema, RolePermissionsAssignSchema, UserRolesAssignSchema } from '../dto/rbac.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Role-Based Access Control (RBAC)')
@Controller()
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) { }

  // ==========================================
  // Permissions CRUD
  // ==========================================

  @Post('permissions')
  @Roles('ADMIN')
  @Permissions('user:create')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: MESSAGES.PERMISSION_CREATE_SUCCESS })
  async createPermission(@Body(new ZodValidationPipe(PermissionCreateSchema)) dto: PermissionCreateDto) {
    return this.rbacService.createPermission(dto);
  }

  @Get('permissions')
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: MESSAGES.PERMISSION_RETRIEVE_SUCCESS })
  async getAllPermissions() {
    return this.rbacService.getAllPermissions();
  }

  @Get('permissions/:id')
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get permission by ID' })
  @ApiResponse({ status: 200, description: MESSAGES.PERMISSION_RETRIEVE_SUCCESS })
  async getPermissionById(@Param('id') id: string) {
    return this.rbacService.getPermissionById(id);
  }

  @Put('permissions/:id')
  @Roles('ADMIN')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiResponse({ status: 200, description: MESSAGES.PERMISSION_UPDATE_SUCCESS })
  async updatePermission(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PermissionCreateSchema)) dto: PermissionCreateDto,
  ) {
    return this.rbacService.updatePermission(id, dto);
  }

  @Delete('permissions/:id')
  @Roles('ADMIN')
  @Permissions('user:delete')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiResponse({ status: 200, description: MESSAGES.PERMISSION_DELETE_SUCCESS })
  async deletePermission(@Param('id') id: string) {
    return this.rbacService.deletePermission(id);
  }

  // ==========================================
  // Role Permissions
  // ==========================================

  @Post('roles/:roleId/permissions')
  @Roles('ADMIN')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiResponse({ status: 201, description: MESSAGES.PERMISSION_ASSIGN_SUCCESS })
  async assignPermissionsToRole(
    @Param('roleId') roleId: string,
    @Body(new ZodValidationPipe(RolePermissionsAssignSchema)) dto: RolePermissionsAssignDto,
  ) {
    return this.rbacService.assignPermissionsToRole(roleId, dto.permissionIds);
  }

  @Get('roles/:roleId/permissions')
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get all permissions assigned to a role' })
  @ApiResponse({ status: 200, description: MESSAGES.PERMISSION_RETRIEVE_SUCCESS })
  async getRolePermissions(@Param('roleId') roleId: string) {
    return this.rbacService.getRolePermissions(roleId);
  }

  // ==========================================
  // User Roles
  // ==========================================

  @Post('users/:userId/roles')
  @Roles('ADMIN')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Assign roles to a user' })
  @ApiResponse({ status: 201, description: MESSAGES.ROLE_ASSIGN_SUCCESS })
  async assignRolesToUser(
    @Param('userId') userId: string,
    @Body(new ZodValidationPipe(UserRolesAssignSchema)) dto: UserRolesAssignDto,
  ) {
    return this.rbacService.assignRolesToUser(userId, dto.roleIds);
  }

  @Get('users/:userId/roles')
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get all roles assigned to a user' })
  @ApiResponse({ status: 200, description: MESSAGES.ROLE_ASSIGN_SUCCESS })
  async getUserRoles(@Param('userId') userId: string) {
    return this.rbacService.getUserRoles(userId);
  }
}
