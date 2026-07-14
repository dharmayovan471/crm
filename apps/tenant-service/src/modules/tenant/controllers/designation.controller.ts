import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { DesignationCreateDto, DesignationCreateSchema } from '../dto/user.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Designations')
@Controller('designations')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class DesignationController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN')
  @Permissions('user:create')
  @ApiOperation({ summary: 'Create a new designation' })
  @ApiResponse({ status: 201, description: MESSAGES.DESIGNATION_CREATE_SUCCESS })
  async create(@Body(new ZodValidationPipe(DesignationCreateSchema)) dto: DesignationCreateDto) {
    return this.userService.createDesignation(dto);
  }

  @Get()
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get all designations' })
  @ApiResponse({ status: 200, description: MESSAGES.DESIGNATION_RETRIEVE_SUCCESS })
  async findAll() {
    return this.userService.findAllDesignations();
  }

  @Get(':id')
  @Permissions('user:view')
  @ApiOperation({ summary: 'Get designation by ID' })
  @ApiResponse({ status: 200, description: MESSAGES.DESIGNATION_RETRIEVE_SUCCESS })
  async findOne(@Param('id') id: string) {
    return this.userService.findDesignationById(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Update a designation' })
  @ApiResponse({ status: 200, description: MESSAGES.DESIGNATION_UPDATE_SUCCESS })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DesignationCreateSchema)) dto: DesignationCreateDto,
  ) {
    return this.userService.updateDesignation(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Permissions('user:delete')
  @ApiOperation({ summary: 'Delete a designation' })
  @ApiResponse({ status: 200, description: MESSAGES.DESIGNATION_DELETE_SUCCESS })
  async remove(@Param('id') id: string) {
    return this.userService.deleteDesignation(id);
  }
}
