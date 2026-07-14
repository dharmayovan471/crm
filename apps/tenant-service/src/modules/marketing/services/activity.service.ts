import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { TenantContext } from '../../common/context/tenant.context';
import { activities, leads, salesTeamMembers, users } from '../../database/schemas/tenant.schema';
import { ActivityCreateDto } from '../dto/activity.dto';

@Injectable()
export class ActivityService {
  async create(dto: ActivityCreateDto, currentUserId: string) {
    const db = TenantContext.getDb();
    
    const insertData = {
      ...dto,
      activityDate: dto.activityDate ? new Date(dto.activityDate) : new Date(),
      nextFollowupDate: dto.nextFollowupDate ? new Date(dto.nextFollowupDate) : null,
      createdBy: currentUserId,
    };

    const result = await db.insert(activities).values(insertData).returning();
    const newActivity = result[0];

    // Trigger simulated push notification hierarchy alert
    if (dto.leadId) {
      this.dispatchSimulatedPushNotifications(dto.leadId, newActivity, currentUserId).catch((err) => {
        console.error('Failed dispatching notifications:', err);
      });
    }

    return newActivity;
  }

  async findAll() {
    const db = TenantContext.getDb();
    return db.select().from(activities);
  }

  private async dispatchSimulatedPushNotifications(leadId: string, activity: any, actorUserId: string) {
    try {
      const db = TenantContext.getDb();
      
      // 1. Fetch Lead
      const leadResult = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
      const lead = leadResult[0];
      if (!lead || !lead.teamId) return;

      // 2. Fetch Team Members & designations
      const members = await db
        .select({
          userId: salesTeamMembers.userId,
          designation: salesTeamMembers.designation,
          email: users.email,
        })
        .from(salesTeamMembers)
        .leftJoin(users, eq(salesTeamMembers.userId, users.id))
        .where(eq(salesTeamMembers.teamId, lead.teamId));

      console.log(`\n🔔 --- SIMULATED PUSH NOTIFICATIONS BROADCAST ---`);
      console.log(`[Actor]: User ID ${actorUserId} logged a new activity: ${activity.type}`);
      console.log(`[Target Lead]: No: ${lead.leadNo}, Company: ${lead.companyName}`);

      for (const member of members) {
        console.log(`📡 [PUSH] Sent to ${member.email} (${member.designation}):`);
        console.log(`   "New activity (${activity.type}) logged for Lead ${lead.leadNo}. Remarks: ${activity.remarks || 'None'}"`);

        // Highlight Hot Calls specifically
        if (activity.type === 'HOT_CALL') {
          console.log(`   🔥 [HOT CALL HIGHLIGHT] High priority warning sent to ${member.designation} (${member.email})!`);
        }
      }
      console.log(`🔔 ---------------------------------------------\n`);
    } catch (err) {
      console.error('Error during push notification simulation:', err);
    }
  }
}
