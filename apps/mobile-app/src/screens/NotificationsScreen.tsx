import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotificationStore, NotificationItem } from '../store/notification.store';

export default function NotificationsScreen({ navigation }: any) {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotificationStore();

  const handleNotificationPress = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.leadId) {
      navigation.navigate('LeadDetails', { id: item.leadId });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LEAD_CREATE':
        return { name: 'person-add', color: '#1A73E8', bg: '#E8F0FE' };
      case 'LEAD_EDIT':
        return { name: 'edit', color: '#E37400', bg: '#FEF3D6' };
      case 'STATUS_CHANGE':
        return { name: 'sync', color: '#137333', bg: '#E6F4EA' };
      case 'HOT_CALL':
        return { name: 'whatshot', color: '#C5221F', bg: '#FCE8E6' };
      case 'FOLLOWUP_DUE':
        return { name: 'event-note', color: '#7627B5', bg: '#F3E8FD' };
      default:
        return { name: 'notifications', color: '#5F6368', bg: '#F1F3F4' };
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const iconConfig = getIcon(item.type);
    
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
          <MaterialIcons name={iconConfig.name as any} size={22} color={iconConfig.color} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.cardHeader}>
            <Text style={[styles.titleText, !item.isRead && styles.titleTextUnread]}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.messageText}>{item.message}</Text>
          <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Actions Toolbar */}
      {notifications.length > 0 && (
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarBtn} onPress={markAllAsRead}>
            <MaterialIcons name="done-all" size={16} color="#FF6B81" style={styles.toolbarIcon} />
            <Text style={styles.toolbarBtnText}>Mark all read</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolbarBtn} onPress={clearNotifications}>
            <MaterialIcons name="delete-sweep" size={16} color="#e53e3e" style={styles.toolbarIcon} />
            <Text style={[styles.toolbarBtnText, { color: '#e53e3e' }]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="notifications-none" size={48} color="#A0AEC0" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You don't have any notifications right now.</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4FF',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  toolbarIcon: {
    marginRight: 6,
  },
  toolbarBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B81',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardUnread: {
    borderColor: '#CCE0FF',
    backgroundColor: '#F9FBFF',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  titleTextUnread: {
    fontWeight: '700',
    color: '#1A202C',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B81',
  },
  messageText: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
