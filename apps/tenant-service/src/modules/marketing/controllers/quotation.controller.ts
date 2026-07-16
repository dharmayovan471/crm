import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { QuotationService } from '../services/quotation.service';
import { QuotationCreateDto, QuotationCreateSchema } from '../dto/quotation.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Quotation Management')
@Controller('quotations')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Post()
  @Permissions('quotation:create')
  @ApiOperation({ summary: 'Create a new quotation' })
  async create(@Body(new ZodValidationPipe(QuotationCreateSchema)) dto: QuotationCreateDto) {
    return this.quotationService.create(dto);
  }

  @Get()
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all quotations' })
  async findAll() {
    return this.quotationService.findAll();
  }

  @Get(':id')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get quotation details by ID with revisions and audit trail' })
  async findOne(@Param('id') id: string) {
    return this.quotationService.findOne(id);
  }

  @Put(':id')
  @Permissions('quotation:create')
  @ApiOperation({ summary: 'Update a quotation or create a new revision if already finalized' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(QuotationCreateSchema)) dto: QuotationCreateDto,
  ) {
    return this.quotationService.update(id, dto);
  }

  @Post(':id/duplicate')
  @Permissions('quotation:create')
  @ApiOperation({ summary: 'Duplicate an existing quotation' })
  async duplicate(@Param('id') id: string) {
    return this.quotationService.duplicate(id);
  }

  @Delete(':id')
  @Permissions('quotation:create')
  @ApiOperation({ summary: 'Delete a quotation' })
  async remove(@Param('id') id: string) {
    return this.quotationService.remove(id);
  }
}
