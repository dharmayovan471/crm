import { Controller, Post, Get, Req, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { TenantService } from '../../tenant/services/tenant.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { Request } from 'express';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Authentication')
@Controller('auth')
@ApiBearerAuth()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user for a tenant company' })
  @ApiResponse({ status: 200, description: MESSAGES.LOGIN_SUCCESS })
  async login(@Req() req: Request, @Body() body: any) {
    const tenantCode = (req.headers['x-tenant-code'] as string) || body.tenantCode;
    if (!tenantCode) {
      throw new BadRequestException('Tenant code is required');
    }
    return this.tenantService.login({
      email: body.email,
      password: body.password,
      tenantCode,
    });
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out current user' })
  @ApiResponse({ status: 200, description: MESSAGES.LOGOUT_SUCCESS })
  async logout(@CurrentUser() user: any, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    return this.authService.logout(user, token || '');
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current logged in user details' })
  @ApiResponse({ status: 200, description: 'Profile details retrieved successfully' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user);
  }
}
