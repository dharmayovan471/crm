import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/auth.store';

export default function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((state) => state.user);
  const tenantCode = useAuthStore((state) => state.tenantCode);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Splash' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        
        <Text style={styles.name}>{user?.name || 'CRM Operator'}</Text>
        <Text style={styles.email}>{user?.email || 'operator@company.com'}</Text>
        
        <View style={styles.tenantBadge}>
          <Text style={styles.tenantBadgeText}>WORKSPACE: {tenantCode?.toUpperCase()}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Designation Role</Text>
          <Text style={styles.value}>{user?.designation || 'Sales Representative'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Department Division</Text>
          <Text style={styles.value}>{user?.department || 'Field Marketing Services'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>LOG OUT SESSION</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4FF',
    padding: 24,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF0F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 129, 0.3)',
  },
  avatarText: {
    fontSize: 44,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
    marginBottom: 14,
  },
  tenantBadge: {
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 129, 0.3)',
    overflow: 'hidden',
  },
  tenantBadgeText: {
    color: '#FF6B81',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    width: '100%',
    height: 1.5,
    backgroundColor: '#EDF2F7',
    marginVertical: 24,
  },
  infoRow: {
    width: '100%',
    marginBottom: 18,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0AEC0',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
  },
  logoutBtn: {
    height: 52,
    backgroundColor: '#e53e3e',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e53e3e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
