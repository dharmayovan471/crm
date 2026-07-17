import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { LeadService } from '../services/lead.service';
import { LeadCreateDto, LeadUpdateDto, LeadCreateSchema, LeadUpdateSchema } from '../dto/lead.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Lead Management')
@Controller('leads')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @Permissions('lead:create')
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: MESSAGES.LEAD_CREATE_SUCCESS })
  async create(
    @Body(new ZodValidationPipe(LeadCreateSchema)) dto: LeadCreateDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.leadService.create(dto, userId);
  }

  @Get()
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all leads with search and filter' })
  @ApiResponse({ status: 200, description: MESSAGES.LEAD_RETRIEVE_SUCCESS })
  async findAll(
    @Query('query') query?: string,
    @Query('statusId') statusId?: string,
  ) {
    return this.leadService.findAll(query, statusId);
  }

  @Get('map')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get lead coordinates map data' })
  async getMap() {
    return this.leadService.getMap();
  }

  @Get('statuses')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all available lead statuses' })
  async getStatuses() {
    return this.leadService.getStatuses();
  }

  @Get(':id')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get lead details by ID' })
  @ApiResponse({ status: 200, description: MESSAGES.LEAD_RETRIEVE_SUCCESS })
  async findOne(@Param('id') id: string) {
    return this.leadService.findOne(id);
  }

  @Put(':id')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiResponse({ status: 200, description: MESSAGES.LEAD_UPDATE_SUCCESS })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(LeadUpdateSchema)) dto: LeadUpdateDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.leadService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiResponse({ status: 200, description: MESSAGES.LEAD_DELETE_SUCCESS })
  async remove(@Param('id') id: string) {
    return this.leadService.remove(id);
  }
}
