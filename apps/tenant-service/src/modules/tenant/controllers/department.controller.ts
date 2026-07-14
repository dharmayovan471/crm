import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { DepartmentCreateDto, DepartmentCreateSchema } from '../dto/user.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Departments')
@Controller('departments')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class DepartmentController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN')
  @Permissions('user:create')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({ status: 201, description: MESSAGES.DEPARTMENT_CREATE_SUCCESS })
  async create(@Body(new ZodValidationPipe(DepartmentCreateSchema)) dto: DepartmentCreateDto) {
    return this.userService.createDepartment(dto);
  }

  @Get()
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200, description: MESSAGES.DEPARTMENT_RETRIEVE_SUCCESS })
  async findAll() {
    return this.userService.findAllDepartments();
  }

  @Get(':id')
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiResponse({ status: 200, description: MESSAGES.DEPARTMENT_RETRIEVE_SUCCESS })
  async findOne(@Param('id') id: string) {
    return this.userService.findDepartmentById(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, description: MESSAGES.DEPARTMENT_UPDATE_SUCCESS })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DepartmentCreateSchema)) dto: DepartmentCreateDto,
  ) {
    return this.userService.updateDepartment(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions('user:delete')
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({ status: 200, description: MESSAGES.DEPARTMENT_DELETE_SUCCESS })
  async remove(@Param('id') id: string) {
    return this.userService.deleteDepartment(id);
  }
}
