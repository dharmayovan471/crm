import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { salesTeams, salesTeamMembers, salesTargets, users, zones, regions } from '../../database/schemas/tenant.schema';

@Injectable()
export class TeamRepository {
  async createTeam(teamData: any) {
    const db = TenantContext.getDb();
    const result = await db.insert(salesTeams).values(teamData).returning();
    return result[0];
  }

  async findAllTeams() {
    const db = TenantContext.getDb();
    return db.select().from(salesTeams);
  }

  async findTeamById(id: string) {
    const db = TenantContext.getDb();
    const result = await db.select().from(salesTeams).where(eq(salesTeams.id, id)).limit(1);
    const team = result[0];
    if (!team) {
      throw new NotFoundException(`Sales team with ID '${id}' not found`);
    }
    return team;
  }

  async addMemberToTeam(teamId: string, memberData: any) {
    const db = TenantContext.getDb();
    await this.findTeamById(teamId);
    
    // Check if user is already a member
    const existing = await db
      .select()
      .from(salesTeamMembers)
      .where(and(eq(salesTeamMembers.teamId, teamId), eq(salesTeamMembers.userId, memberData.userId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(salesTeamMembers)
        .set({ designation: memberData.designation })
        .where(and(eq(salesTeamMembers.teamId, teamId), eq(salesTeamMembers.userId, memberData.userId)));
      return { teamId, userId: memberData.userId, designation: memberData.designation };
    }

    const result = await db
      .insert(salesTeamMembers)
      .values({
        teamId,
        userId: memberData.userId,
        designation: memberData.designation,
      })
      .returning();
    return result[0];
  }

  async findMembersOfTeam(teamId: string) {
    const db = TenantContext.getDb();
    await this.findTeamById(teamId);
    return db
      .select({
        teamId: salesTeamMembers.teamId,
        userId: salesTeamMembers.userId,
        designation: salesTeamMembers.designation,
        email: users.email,
      })
      .from(salesTeamMembers)
      .leftJoin(users, eq(salesTeamMembers.userId, users.id))
      .where(eq(salesTeamMembers.teamId, teamId));
  }

  async createTarget(teamId: string, targetData: any) {
    const db = TenantContext.getDb();
    await this.findTeamById(teamId);
    const result = await db
      .insert(salesTargets)
      .values({
        teamId,
        userId: targetData.userId,
        targetValue: targetData.targetValue.toString(),
        month: targetData.month,
        year: targetData.year,
      })
      .returning();
    return result[0];
  }

  async findTargetsOfTeam(teamId: string) {
    const db = TenantContext.getDb();
    await this.findTeamById(teamId);
    return db
      .select()
      .from(salesTargets)
      .where(eq(salesTargets.teamId, teamId));
  }

  // ==========================================
  // Zone & Region Operations
  // ==========================================

  async createZone(zoneData: any) {
    const db = TenantContext.getDb();
    const result = await db.insert(zones).values(zoneData).returning();
    return result[0];
  }

  async findAllZones() {
    const db = TenantContext.getDb();
    return db.select().from(zones);
  }

  async createRegion(regionData: any) {
    const db = TenantContext.getDb();
    const result = await db.insert(regions).values(regionData).returning();
    return result[0];
  }

  async findAllRegions() {
    const db = TenantContext.getDb();
    return db.select().from(regions);
  }
}
