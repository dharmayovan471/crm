import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MasterService } from '../services/master.service';
import { LeadSourceDto, LeadSourceSchema, IndustryDto, IndustrySchema, CompanyDto, CompanySchema } from '../dto/master.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Master Configuration')
@Controller('masters')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  // ==========================================
  // Lead Source Master Endpoints
  // ==========================================
  @Post('lead-sources')
  @Permissions('lead:create') // Map to general lead permission or specific if created
  @ApiOperation({ summary: 'Create a new lead source' })
  async createLeadSource(@Body(new ZodValidationPipe(LeadSourceSchema)) dto: LeadSourceDto) {
    return this.masterService.createLeadSource(dto);
  }

  @Get('lead-sources')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all lead sources' })
  async findAllLeadSources(@Query('query') query?: string) {
    return this.masterService.findAllLeadSources(query);
  }

  @Put('lead-sources/:id')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Update a lead source' })
  async updateLeadSource(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(LeadSourceSchema)) dto: LeadSourceDto,
  ) {
    return this.masterService.updateLeadSource(id, dto);
  }

  @Delete('lead-sources/:id')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Delete a lead source' })
  async deleteLeadSource(@Param('id') id: string) {
    return this.masterService.deleteLeadSource(id);
  }

  // ==========================================
  // Industry Master Endpoints
  // ==========================================
  @Post('industries')
  @Permissions('lead:create')
  @ApiOperation({ summary: 'Create a new industry type' })
  async createIndustry(@Body(new ZodValidationPipe(IndustrySchema)) dto: IndustryDto) {
    return this.masterService.createIndustry(dto);
  }

  @Get('industries')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all industries' })
  async findAllIndustries(@Query('query') query?: string) {
    return this.masterService.findAllIndustries(query);
  }

  @Put('industries/:id')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Update an industry type' })
  async updateIndustry(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(IndustrySchema)) dto: IndustryDto,
  ) {
    return this.masterService.updateIndustry(id, dto);
  }

  @Delete('industries/:id')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Delete an industry type' })
  async deleteIndustry(@Param('id') id: string) {
    return this.masterService.deleteIndustry(id);
  }

  // ==========================================
  // Company Master Endpoints
  // ==========================================
  @Post('companies')
  @Permissions('lead:create')
  @ApiOperation({ summary: 'Create a new tenant company division' })
  async createCompany(@Body(new ZodValidationPipe(CompanySchema)) dto: CompanyDto) {
    return this.masterService.createCompany(dto);
  }

  @Get('companies')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all company divisions' })
  async findAllCompanies(@Query('query') query?: string) {
    return this.masterService.findAllCompanies(query);
  }

  @Put('companies/:id')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Update a company division' })
  async updateCompany(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CompanySchema)) dto: CompanyDto,
  ) {
    return this.masterService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Delete a company division' })
  async deleteCompany(@Param('id') id: string) {
    return this.masterService.deleteCompany(id);
  }
}
