import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TeamService } from '../services/team.service';
import { TeamCreateDto, MemberAddDto, TargetCreateDto, TeamCreateSchema, MemberAddSchema, TargetCreateSchema } from '../dto/team.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { MESSAGES } from '../../common/constants/messages.constants';

@ApiTags('Team & Target Management')
@Controller('teams')
@ApiBearerAuth()
@UseGuards(RolesGuard, PermissionsGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @Permissions('lead:create')
  @ApiOperation({ summary: 'Create a new sales team' })
  @ApiResponse({ status: 201, description: MESSAGES.TEAM_CREATE_SUCCESS })
  async createTeam(@Body(new ZodValidationPipe(TeamCreateSchema)) dto: TeamCreateDto) {
    return this.teamService.createTeam(dto);
  }

  @Get()
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get all sales teams' })
  @ApiResponse({ status: 200, description: MESSAGES.TEAM_RETRIEVE_SUCCESS })
  async findAllTeams() {
    return this.teamService.findAllTeams();
  }

  @Post(':id/members')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Add a user to a sales team' })
  @ApiResponse({ status: 201, description: MESSAGES.MEMBER_ADD_SUCCESS })
  async addMember(
    @Param('id') teamId: string,
    @Body(new ZodValidationPipe(MemberAddSchema)) dto: MemberAddDto,
  ) {
    return this.teamService.addMember(teamId, dto);
  }

  @Get(':id/members')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get members of a sales team' })
  @ApiResponse({ status: 200, description: MESSAGES.MEMBER_RETRIEVE_SUCCESS })
  async getMembers(@Param('id') teamId: string) {
    return this.teamService.getMembers(teamId);
  }

  @Post(':id/targets')
  @Permissions('lead:update')
  @ApiOperation({ summary: 'Create monthly/yearly target for a sales team' })
  async createTarget(
    @Param('id') teamId: string,
    @Body(new ZodValidationPipe(TargetCreateSchema)) dto: TargetCreateDto,
  ) {
    return this.teamService.createTarget(teamId, dto);
  }

  @Get(':id/targets')
  @Permissions('lead:view')
  @ApiOperation({ summary: 'Get targets set for a sales team' })
  async getTargets(@Param('id') teamId: string) {
    return this.teamService.getTargets(teamId);
  }
}
