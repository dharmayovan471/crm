import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export default function TeamsScreen() {
  const [teams, setTeams] = useState<any[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberDesignation, setNewMemberDesignation] = useState('MEMBER');
  
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [teamError, setTeamError] = useState('');
  const [memberError, setMemberError] = useState('');

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const res = await api.get('/teams');
      setTeams(res.data || []);
    } catch (err) {
      console.warn('Failed to load teams', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      setTeamError('Team name is required');
      return;
    }
    if (newTeamName.trim().length < 3) {
      setTeamError('Team name must be at least 3 characters');
      return;
    }
    setTeamError('');
    try {
      await api.post('/teams', { teamName: newTeamName.trim() });
      setNewTeamName('');
      fetchTeams();
      Alert.alert('Success', 'Sales team created successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to create sales team.');
    }
  };

  const fetchMembers = async (teamId: string) => {
    setLoadingMembers(true);
    try {
      const res = await api.get(`/teams/${teamId}/members`);
      setMembers(res.data || []);
    } catch (err) {
      console.warn('Failed to load members', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const addMember = async () => {
    if (!selectedTeam) {
      Alert.alert('Error', 'Please select a sales team first.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newMemberEmail.trim()) {
      setMemberError('Email address is required');
      return;
    }
    if (!emailRegex.test(newMemberEmail.trim())) {
      setMemberError('Invalid email format');
      return;
    }
    setMemberError('');

    try {
      await api.post(`/teams/${selectedTeam.id}/members`, {
        email: newMemberEmail.trim(),
        designation: newMemberDesignation,
      });
      setNewMemberEmail('');
      fetchMembers(selectedTeam.id);
      Alert.alert('Success', 'Team member added successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to add team member.');
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const roles = ['HEAD', 'COORDINATOR', 'MANAGER', 'MEMBER'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>👥 Sales Teams & Members</Text>

      {/* Create Team Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create New Sales Team</Text>
        <TextInput 
          style={[
            styles.input,
            focusedInput === 'teamName' && styles.inputFocused,
            !!teamError && styles.inputError
          ]} 
          value={newTeamName} 
          onChangeText={(text) => {
            setNewTeamName(text);
            if (teamError) setTeamError('');
          }} 
          placeholder="e.g. Northeast Regional Team" 
          placeholderTextColor="#A0AEC0"
          onFocus={() => setFocusedInput('teamName')}
          onBlur={() => setFocusedInput(null)}
        />
        {!!teamError && <Text style={styles.errorText}>⚠️ {teamError}</Text>}
        <TouchableOpacity style={styles.button} onPress={createTeam}>
          <Text style={styles.buttonText}>CREATE TEAM</Text>
        </TouchableOpacity>
      </View>

      {/* Teams Grid List */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active Sales Teams</Text>
        {loadingTeams ? (
          <ActivityIndicator color="#FF6B81" style={{ marginVertical: 12 }} />
        ) : teams.length === 0 ? (
          <Text style={styles.empty}>No sales teams created yet.</Text>
        ) : (
          <View style={styles.teamsGrid}>
            {teams.map((t) => (
              <TouchableOpacity 
                key={t.id} 
                style={[styles.teamRow, selectedTeam?.id === t.id && styles.selectedRow]}
                onPress={() => {
                  setSelectedTeam(t);
                  fetchMembers(t.id);
                }}
              >
                <Text style={[styles.teamName, selectedTeam?.id === t.id && styles.selectedText]}>{t.teamName}</Text>
                <Text style={[styles.arrowIcon, selectedTeam?.id === t.id && styles.selectedText]}>➔</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Team Members List Card */}
      {selectedTeam && (
        <View style={styles.card}>
          <Text style={styles.cardTitleSection}>Members of {selectedTeam.teamName}</Text>
          {loadingMembers ? (
            <ActivityIndicator color="#FF6B81" style={{ marginVertical: 12 }} />
          ) : members.length === 0 ? (
            <Text style={styles.empty}>No members registered in this team.</Text>
          ) : (
            members.map((m, idx) => (
              <View key={idx} style={styles.memberRow}>
                <View>
                  <Text style={styles.memberName}>{m.email}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{m.designation}</Text>
                </View>
              </View>
            ))
          )}

          {/* Add Team Member Panel */}
          <Text style={[styles.cardTitle, { marginTop: 24, marginBottom: 12 }]}>Add New Member to Team</Text>
          <TextInput 
            style={[
              styles.input,
              focusedInput === 'memberEmail' && styles.inputFocused,
              !!memberError && styles.inputError
            ]} 
            value={newMemberEmail} 
            onChangeText={(text) => {
              setNewMemberEmail(text);
              if (memberError) setMemberError('');
            }} 
            placeholder="operator.email@company.com" 
            placeholderTextColor="#A0AEC0"
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedInput('memberEmail')}
            onBlur={() => setFocusedInput(null)}
          />
          {!!memberError && <Text style={styles.errorText}>⚠️ {memberError}</Text>}
          
          <Text style={styles.miniLabel}>Select Designation Role</Text>
          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                style={[styles.roleBtn, newMemberDesignation === role && styles.roleBtnActive]}
                onPress={() => setNewMemberDesignation(role)}
              >
                <Text style={[styles.roleText, newMemberDesignation === role && styles.roleTextActive]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#FF6B81' }]} onPress={addMember}>
            <Text style={styles.buttonText}>ADD TEAM MEMBER</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 20,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#718096',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitleSection: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1A202C',
    fontWeight: '500',
    marginBottom: 12,
  },
  inputFocused: {
    borderColor: '#FF6B81',
  },
  inputError: {
    borderColor: '#e53e3e',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -6,
    marginBottom: 12,
  },
  button: {
    height: 48,
    backgroundColor: '#FF6B81',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  empty: {
    fontStyle: 'italic',
    color: '#A0AEC0',
    fontWeight: '500',
    paddingVertical: 8,
  },
  teamsGrid: {
    marginVertical: 4,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedRow: {
    backgroundColor: '#FF6B81',
    borderColor: '#FF6B81',
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D3748',
  },
  arrowIcon: {
    fontSize: 14,
    color: '#A0AEC0',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  memberName: {
    fontWeight: '600',
    color: '#2D3748',
    fontSize: 14,
  },
  roleBadge: {
    backgroundColor: '#E6EEFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#FF6B81',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  roleBtn: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    margin: 4,
    paddingHorizontal: 12,
  },
  roleBtnActive: {
    backgroundColor: '#FF6B81',
    borderColor: '#FF6B81',
  },
  roleText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '800',
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
});
