import { Injectable } from '@nestjs/common';
import { TeamRepository } from '../repositories/team.repository';
import { TeamCreateDto, MemberAddDto, TargetCreateDto } from '../dto/team.dto';

@Injectable()
export class TeamService {
  constructor(private readonly teamRepository: TeamRepository) {}

  async createTeam(dto: TeamCreateDto) {
    return this.teamRepository.createTeam(dto);
  }

  async findAllTeams() {
    return this.teamRepository.findAllTeams();
  }

  async findTeamById(id: string) {
    return this.teamRepository.findTeamById(id);
  }

  async addMember(teamId: string, dto: MemberAddDto) {
    return this.teamRepository.addMemberToTeam(teamId, dto);
  }

  async getMembers(teamId: string) {
    return this.teamRepository.findMembersOfTeam(teamId);
  }

  async createTarget(teamId: string, dto: TargetCreateDto) {
    return this.teamRepository.createTarget(teamId, dto);
  }

  async getTargets(teamId: string) {
    return this.teamRepository.findTargetsOfTeam(teamId);
  }

  // ==========================================
  // Zone & Region Operations
  // ==========================================

  async createZone(dto: any) {
    return this.teamRepository.createZone(dto);
  }

  async findAllZones() {
    return this.teamRepository.findAllZones();
  }

  async createRegion(dto: any) {
    return this.teamRepository.createRegion(dto);
  }

  async findAllRegions() {
    return this.teamRepository.findAllRegions();
  }
}
