import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'LEAD_CREATE' | 'LEAD_EDIT' | 'STATUS_CHANGE' | 'FOLLOWUP_DUE' | 'HOT_CALL';
  timestamp: Date;
  isRead: boolean;
  leadId?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  previousLeads: Record<string, any>; // cached leads by id to diff against
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  generateDynamicNotifications: (leads: any[], activities?: any[]) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  previousLeads: {},
  
  addNotification: (notification) => {
    // Generate unique ID based on type and leadId to prevent duplicate alerts on the same day
    const id = notification.leadId 
      ? `${notification.type}_${notification.leadId}_${new Date().toDateString().replace(/\s/g, '_')}` 
      : `notif_${Date.now()}`;
      
    // Prevent duplicates
    const exists = get().notifications.some((n) => n.id === id);
    if (exists) return;

    const newItem: NotificationItem = {
      ...notification,
      id,
      timestamp: new Date(),
      isRead: false,
    };
    set((state) => ({
      notifications: [newItem, ...state.notifications],
    }));
  },

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) => n.id === id ? { ...n, isRead: true } : n)
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
  })),

  clearNotifications: () => set({ notifications: [] }),

  generateDynamicNotifications: (leads, activities = []) => {
    const prevLeads = get().previousLeads;
    const hasPrevious = Object.keys(prevLeads).length > 0;
    const currentLeadsMap: Record<string, any> = {};

    leads.forEach((l) => {
      currentLeadsMap[l.id] = l;
      
      // If we already have a previous snapshot, check for diffs
      if (hasPrevious) {
        const prev = prevLeads[l.id];
        if (!prev) {
          // 1. New Lead Created
          get().addNotification({
            title: '🆕 New Lead Registered',
            message: `Lead ${l.leadNo} for ${l.companyName || 'No Company'} has been created.`,
            type: 'LEAD_CREATE',
            leadId: l.id,
          });
        } else {
          // 2. Status Changed
          if (l.statusName !== prev.statusName) {
            get().addNotification({
              title: '🔄 Lead Status Updated',
              message: `Lead ${l.leadNo} (${l.companyName}) changed from ${prev.statusName || 'No Status'} to ${l.statusName || 'No Status'}.`,
              type: 'STATUS_CHANGE',
              leadId: l.id,
            });
          }
          // 3. Lead Details Edited
          else if (
            l.companyName !== prev.companyName ||
            l.contactName !== prev.contactName ||
            l.expectedValue !== prev.expectedValue
          ) {
            get().addNotification({
              title: '✏️ Lead Profile Edited',
              message: `Lead profile fields for ${l.leadNo} (${l.companyName}) have been updated.`,
              type: 'LEAD_EDIT',
              leadId: l.id,
            });
          }
        }
      }

      // 4. Hot Calls Alerts
      const score = Number(l.leadScore || 0);
      if (score > 70) {
        get().addNotification({
          title: '🔥 Today\'s Hot Call Alert',
          message: `Lead ${l.leadNo} (${l.companyName || 'No Company'}) has high lead score ${score}. Contact them today!`,
          type: 'HOT_CALL',
          leadId: l.id,
        });
      }
    });

    // 5. Follow-ups Due Today
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    activities.forEach((act) => {
      if (act.nextFollowupDate && act.status === 'OPEN') {
        const actDateStr = new Date(act.nextFollowupDate).toISOString().split('T')[0];
        if (actDateStr === todayStr) {
          get().addNotification({
            title: '📅 Follow-up Due Today',
            message: `Activity follow-up scheduled for lead ${act.leadNo || 'lead'} today. Remarks: ${act.remarks}`,
            type: 'FOLLOWUP_DUE',
            leadId: act.leadId,
          });
        }
      }
    });

    // Cache the current leads list
    set({ previousLeads: currentLeadsMap });
  }
}));
