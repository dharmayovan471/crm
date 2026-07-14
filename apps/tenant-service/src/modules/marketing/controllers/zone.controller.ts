import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeamService } from '../services/team.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const ZoneCreateSchema = z.object({
  zoneCode: z.string().min(2),
  zoneName: z.string().min(2),
  description: z.string().optional().nullable(),
});

export const RegionCreateSchema = z.object({
  zoneId: z.string().uuid(),
  regionCode: z.string().min(2),
  regionName: z.string().min(2),
  description: z.string().optional().nullable(),
});

export class ZoneCreateDto {
  @ApiProperty({ example: 'NORTH' })
  zoneCode!: string;

  @ApiProperty({ example: 'North Zone' })
  zoneName!: string;

  @ApiProperty({ example: 'North division offices', required: false })
  description?: string;
}

export class RegionCreateDto {
  @ApiProperty({ example: 'd290f1d6-2e4b-4b2a-89a1-77884a29a001' })
  zoneId!: string;

  @ApiProperty({ example: 'TN' })
  regionCode!: string;

  @ApiProperty({ example: 'Tamil Nadu' })
  regionName!: string;

  @ApiProperty({ example: 'Tamil Nadu sales region', required: false })
  description?: string;
}

@ApiTags('Zone & Region Management')
@Controller()
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class ZoneController {
  constructor(private readonly teamService: TeamService) {}

  @Post('zones')
  @Permissions('lead:create')
  @ApiOperation({ summary: 'Create a new Zone' })
  async createZone(@Body(new ZodValidationPipe(ZoneCreateSchema)) dto: ZoneCreateDto) {
    return this.teamService.createZone(dto);
  }

  @Get('zones')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all Zones' })
  async findAllZones() {
    return this.teamService.findAllZones();
  }

  @Post('regions')
  @Permissions('lead:create')
  @ApiOperation({ summary: 'Create a new Region linked to a Zone' })
  async createRegion(@Body(new ZodValidationPipe(RegionCreateSchema)) dto: RegionCreateDto) {
    return this.teamService.createRegion(dto);
  }

  @Get('regions')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all Regions' })
  async findAllRegions() {
    return this.teamService.findAllRegions();
  }
}
