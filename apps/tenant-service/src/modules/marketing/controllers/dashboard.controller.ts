import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Executive CRM Dashboard & Reports')
@Controller()
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard/summary')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get KPI summary cards count and valuations' })
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('dashboard/pipeline')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get active pipeline stages values distribution' })
  async getPipeline() {
    return this.dashboardService.getPipeline();
  }

  @Get('dashboard/target-vs-actual')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get monthly targets vs actual achievements' })
  async getTargetVsActual(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.dashboardService.getTargetVsActual(
      year ? parseInt(year.toString(), 10) : undefined,
      month ? parseInt(month.toString(), 10) : undefined,
    );
  }

  @Get('dashboard/team-performance')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get top 10 sales teams performance and conversions' })
  async getTeamPerformance() {
    return this.dashboardService.getTeamPerformance();
  }

  @Get('dashboard/salesperson-performance')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get Top and Bottom performing sales person details' })
  async getSalesPersonPerformance() {
    return this.dashboardService.getSalesPersonPerformance();
  }

  @Get('dashboard/hot-leads')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get hot leads score counts and urgent followups metrics' })
  async getHotLeads() {
    return this.dashboardService.getHotLeads();
  }

  @Get('dashboard/trends')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get last 12 months trends data' })
  async getTrends() {
    return this.dashboardService.getTrends();
  }

  @Get('dashboard/products')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get top 10 / bottom 10 selling products matrices' })
  async getProductPerformance() {
    return this.dashboardService.getProductPerformance();
  }

  @Get('dashboard/regions')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get sales details grouped by region' })
  async getRegionalPerformance() {
    return this.dashboardService.getRegionalPerformance();
  }

  @Get('dashboard/customers')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get customer lifetime value CLV analytics' })
  async getCustomerAnalytics() {
    return this.dashboardService.getCustomerAnalytics();
  }

  @Get('dashboard/followups')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get overdue, today, and upcoming open followups' })
  async getFollowups() {
    return this.dashboardService.getFollowups();
  }

  @Get('dashboard/forecast')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Get pipeline expected monthly/quarterly weighted revenue forecast' })
  async getForecast() {
    return this.dashboardService.getForecast();
  }

  // ==========================================
  // Report Center APIs
  // ==========================================

  @Get('reports/leads')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Export leads detail fields data log' })
  async getLeadsReport() {
    return this.dashboardService.getLeadsReport();
  }

  @Get('reports/customers')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Export customer details list data log' })
  async getCustomersReport() {
    return this.dashboardService.getCustomersReport();
  }

  @Get('reports/quotations')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Export quotations transactions data log' })
  async getQuotationsReport() {
    return this.dashboardService.getQuotationsReport();
  }

  @Get('reports/pipeline')
  @Permissions('dashboard:view')
  @ApiOperation({ summary: 'Export pipeline structure configuration log' })
  async getPipelineReport() {
    return this.dashboardService.getPipeline();
  }
}
