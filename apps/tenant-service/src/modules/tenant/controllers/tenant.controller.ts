import { Controller, Post, Get, Body, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { TenantService } from '../services/tenant.service';
import { TenantRegisterDto, TenantLoginDto, UpdateTenantDto, TenantRegisterSchema, TenantLoginSchema, UpdateTenantSchema } from '../dto/tenant.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { JwtRefreshGuard } from '../../auth/guards/jwt-refresh.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Tenant Management')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant company and admin account' })
  @ApiResponse({ status: 201, description: MESSAGES.TENANT_REGISTER_SUCCESS })
  async register(@Body(new ZodValidationPipe(TenantRegisterSchema)) dto: TenantRegisterDto) {
    return this.tenantService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user for a tenant company' })
  @ApiResponse({ status: 200, description: MESSAGES.LOGIN_SUCCESS })
  async login(@Body(new ZodValidationPipe(TenantLoginSchema)) dto: TenantLoginDto) {
    return this.tenantService.login(dto);
  }

  @Public()
  @Get('code/:code')
  @ApiOperation({ summary: 'Resolve/validate a tenant by its code' })
  async findByCode(@Param('code') code: string) {
    const tenant = await this.tenantService.findByCode(code.trim().toLowerCase());
    if (!tenant) {
      throw new NotFoundException(`Tenant with code '${code}' not found`);
    }
    return tenant;
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT Access Token using Refresh Token' })
  async refreshToken(@CurrentUser() user: any) {
    return this.tenantService.refreshToken(user);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-Tenant-Code', required: false, description: 'Tenant code identifier' })
  @ApiOperation({ summary: 'Get current user profile and tenant information' })
  async getProfile(@CurrentUser() user: any) {
    return this.tenantService.getProfile(user.userId, user.tenantCode);
  }

  @Post('update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant company contact metadata' })
  @ApiResponse({ status: 200, description: MESSAGES.TENANT_UPDATE_SUCCESS })
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Body(new ZodValidationPipe(UpdateTenantSchema)) dto: UpdateTenantDto,
  ) {
    return this.tenantService.update(tenantId, dto);
  }
}
