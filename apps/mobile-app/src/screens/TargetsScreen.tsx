import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { api } from '../services/api';

export default function TargetsScreen() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [targets, setTargets] = useState<any[]>([]);
  const [targetValue, setTargetValue] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [userId, setUserId] = useState('');
  
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<any>({});

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const res = await api.get('/teams');
      setTeams(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedTeamId(res.data[0].id);
        fetchTargets(res.data[0].id);
      }
    } catch (err) {
      console.warn('Failed to load teams', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchTargets = async (teamId: string) => {
    setLoadingTargets(true);
    try {
      const res = await api.get(`/teams/${teamId}/targets`);
      setTargets(res.data || []);
    } catch (err) {
      console.warn('Failed to load targets', err);
    } finally {
      setLoadingTargets(false);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!targetValue.trim()) {
      newErrors.targetValue = 'Target value is required';
    } else {
      const val = parseFloat(targetValue);
      if (isNaN(val) || val <= 0) {
        newErrors.targetValue = 'Must be a positive number';
      }
    }

    if (!month.trim()) {
      newErrors.month = 'Required';
    } else {
      const m = parseInt(month);
      if (isNaN(m) || m < 1 || m > 12) {
        newErrors.month = 'Month 1-12';
      }
    }

    if (!year.trim()) {
      newErrors.year = 'Required';
    } else {
      const y = parseInt(year);
      if (isNaN(y) || y < 2026) {
        newErrors.year = 'Min year 2026';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTarget = async () => {
    if (!selectedTeamId) {
      Alert.alert('Error', 'Please select a sales team.');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check all required fields.');
      return;
    }

    try {
      await api.post(`/teams/${selectedTeamId}/targets`, {
        targetValue: parseFloat(targetValue),
        month: parseInt(month),
        year: parseInt(year),
        userId: userId.trim() || undefined,
      });
      setTargetValue('');
      setMonth('');
      setYear('');
      setUserId('');
      setErrors({});
      fetchTargets(selectedTeamId);
      Alert.alert('Success', 'Sales target successfully set.');
    } catch (err) {
      Alert.alert('Error', 'Failed to create sales target.');
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>🎯 Targets & Achievements</Text>

      {/* Select Team Bar */}
      <Text style={styles.sectionLabel}>Select Active Team</Text>
      <View style={styles.teamContainer}>
        {loadingTeams ? (
          <ActivityIndicator color="#FF6B81" style={{ marginVertical: 6 }} />
        ) : teams.length === 0 ? (
          <Text style={styles.empty}>No teams found.</Text>
        ) : (
          teams.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.teamBtn, selectedTeamId === t.id && styles.teamBtnActive]}
              onPress={() => {
                setSelectedTeamId(t.id);
                fetchTargets(t.id);
              }}
            >
              <Text style={[styles.teamBtnText, selectedTeamId === t.id && styles.teamBtnTextActive]}>{t.teamName}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Target Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Set Target Guideline</Text>
        
        {/* Target Value */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Value ($) *</Text>
          <TextInput
            style={[
              styles.input,
              focusedField === 'targetValue' && styles.inputFocused,
              !!errors.targetValue && styles.inputError
            ]}
            value={targetValue}
            onChangeText={(text) => {
              setTargetValue(text);
              if (errors.targetValue) setErrors({ ...errors, targetValue: null });
            }}
            keyboardType="numeric"
            placeholder="e.g. 50000"
            placeholderTextColor="#A0AEC0"
            onFocus={() => setFocusedField('targetValue')}
            onBlur={() => setFocusedField(null)}
          />
          {!!errors.targetValue && <Text style={styles.errorText}>⚠️ {errors.targetValue}</Text>}
        </View>

        {/* Month and Year */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { width: '48%' }]}>
            <Text style={styles.label}>Month *</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'month' && styles.inputFocused,
                !!errors.month && styles.inputError
              ]}
              value={month}
              onChangeText={(text) => {
                setMonth(text);
                if (errors.month) setErrors({ ...errors, month: null });
              }}
              keyboardType="numeric"
              placeholder="1-12"
              placeholderTextColor="#A0AEC0"
              onFocus={() => setFocusedField('month')}
              onBlur={() => setFocusedField(null)}
            />
            {!!errors.month && <Text style={styles.errorText}>⚠️ {errors.month}</Text>}
          </View>

          <View style={[styles.inputGroup, { width: '48%' }]}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'year' && styles.inputFocused,
                !!errors.year && styles.inputError
              ]}
              value={year}
              onChangeText={(text) => {
                setYear(text);
                if (errors.year) setErrors({ ...errors, year: null });
              }}
              keyboardType="numeric"
              placeholder="e.g. 2026"
              placeholderTextColor="#A0AEC0"
              onFocus={() => setFocusedField('year')}
              onBlur={() => setFocusedField(null)}
            />
            {!!errors.year && <Text style={styles.errorText}>⚠️ {errors.year}</Text>}
          </View>
        </View>

        {/* Optional User ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Individual Operator ID (Optional)</Text>
          <TextInput
            style={[
              styles.input,
              focusedField === 'userId' && styles.inputFocused
            ]}
            value={userId}
            onChangeText={setUserId}
            placeholder="Assign specific operator UUID"
            placeholderTextColor="#A0AEC0"
            onFocus={() => setFocusedField('userId')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleCreateTarget}>
          <Text style={styles.buttonText}>SET TARGET</Text>
        </TouchableOpacity>
      </View>

      {/* Current targets */}
      <View style={styles.card}>
        <Text style={styles.cardTitleSection}>Target Guidelines List</Text>
        {loadingTargets ? (
          <ActivityIndicator color="#FF6B81" style={{ marginVertical: 12 }} />
        ) : targets.length === 0 ? (
          <Text style={styles.empty}>No targets registered for this team.</Text>
        ) : (
          targets.map((t) => (
            <View key={t.id} style={styles.targetRow}>
              <View>
                <Text style={styles.targetHeading}>FY Month {t.month} / {t.year}</Text>
                <Text style={styles.targetMeta}>{t.userId ? `User: ${t.userId.substring(0, 8)}...` : 'Team-wide Target'}</Text>
              </View>
              <Text style={styles.targetValue}>${parseFloat(t.targetValue).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  teamContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    marginHorizontal: -4,
  },
  teamBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 4,
  },
  teamBtnActive: {
    borderColor: '#FF6B81',
    backgroundColor: '#E6EEFF',
  },
  teamBtnText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '700',
  },
  teamBtnTextActive: {
    color: '#FF6B81',
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
    marginBottom: 16,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 8,
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
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    height: 48,
    backgroundColor: '#FF6B81',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
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
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  targetHeading: {
    fontWeight: '700',
    fontSize: 14,
    color: '#2D3748',
  },
  targetMeta: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
    fontWeight: '500',
  },
  targetValue: {
    fontWeight: '800',
    fontSize: 16,
    color: '#FF6B81',
  },
});
