import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { EmployeeCreateDto, EmployeeCreateSchema } from '../dto/user.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Employees')
@Controller('employees')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class EmployeeController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @Roles('ADMIN')
  @Permissions('user:create')
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: MESSAGES.EMPLOYEE_CREATE_SUCCESS })
  async create(@Body(new ZodValidationPipe(EmployeeCreateSchema)) dto: EmployeeCreateDto) {
    return this.userService.createEmployee(dto);
  }

  @Get()
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get all employees' })
  @ApiResponse({ status: 200, description: MESSAGES.EMPLOYEE_RETRIEVE_SUCCESS })
  async findAll() {
    return this.userService.findAllEmployees();
  }

  @Get(':id')
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: 200, description: MESSAGES.EMPLOYEE_RETRIEVE_SUCCESS })
  async findOne(@Param('id') id: string) {
    return this.userService.findEmployeeById(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Update an employee' })
  @ApiResponse({ status: 200, description: MESSAGES.EMPLOYEE_UPDATE_SUCCESS })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(EmployeeCreateSchema)) dto: EmployeeCreateDto,
  ) {
    return this.userService.updateEmployee(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions('user:delete')
  @ApiOperation({ summary: 'Delete an employee' })
  @ApiResponse({ status: 200, description: MESSAGES.EMPLOYEE_DELETE_SUCCESS })
  async remove(@Param('id') id: string) {
    return this.userService.deleteEmployee(id);
  }
}
