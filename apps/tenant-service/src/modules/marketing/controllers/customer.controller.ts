import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CustomerService } from '../services/customer.service';
import { CustomerCreateDto, CustomerUpdateDto, CustomerCreateSchema, CustomerUpdateSchema } from '../dto/customer.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Customer Management')
@Controller('customers')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Permissions('customer:create')
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: MESSAGES.CUSTOMER_CREATE_SUCCESS })
  async create(@Body(new ZodValidationPipe(CustomerCreateSchema)) dto: CustomerCreateDto) {
    return this.customerService.create(dto);
  }

  @Get()
  @Permissions('customer:view')
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: MESSAGES.CUSTOMER_RETRIEVE_SUCCESS })
  async findAll() {
    return this.customerService.findAll();
  }

  @Get('map')
  @Permissions('customer:view')
  @ApiOperation({ summary: 'Get customer location mapping details' })
  async getMap() {
    return this.customerService.getMap();
  }

  @Put(':id')
  @Permissions('customer:create')
  @ApiOperation({ summary: 'Update customer details' })
  @ApiResponse({ status: 200, description: MESSAGES.CUSTOMER_UPDATE_SUCCESS })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CustomerUpdateSchema)) dto: CustomerUpdateDto,
  ) {
    return this.customerService.update(id, dto);
  }
}
