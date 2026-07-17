import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Switch, ActivityIndicator, Platform } from 'react-native';
import { api } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';

export default function ConfigsScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'ZONES' | 'STATUSES' | 'SOURCES' | 'INDUSTRIES'>('ZONES');

  // Zones & Regions
  const [zones, setZones] = useState<any[]>([]);
  const [zoneCode, setZoneCode] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [regionCode, setRegionCode] = useState('');
  const [regionName, setRegionName] = useState('');
  const [regions, setRegions] = useState<any[]>([]);

  // Lead Statuses
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusCode, setStatusCode] = useState('');
  const [statusName, setStatusName] = useState('');
  const [statusOrder, setStatusOrder] = useState('');
  const [isWon, setIsWon] = useState(false);
  const [isDrop, setIsDrop] = useState(false);

  // Lead Sources
  const [sources, setSources] = useState<any[]>([]);
  const [sourceCode, setSourceCode] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [loadingSources, setLoadingSources] = useState(false);

  // Industries
  const [industries, setIndustries] = useState<any[]>([]);
  const [industryCode, setIndustryCode] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Validation errors
  const [zoneErrors, setZoneErrors] = useState<any>({});
  const [regionErrors, setRegionErrors] = useState<any>({});
  const [statusErrors, setStatusErrors] = useState<any>({});
  const [sourceErrors, setSourceErrors] = useState<any>({});
  const [industryErrors, setIndustryErrors] = useState<any>({});

  const fetchZones = async () => {
    setLoadingZones(true);
    try {
      const res = await api.get('/zones');
      const data = res.data || [];
      setZones(data);
      if (data.length > 0) {
        setSelectedZoneId(data[0].id);
        fetchRegions();
      }
    } catch (err) {
      console.warn('Failed to load zones', err);
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const res = await api.get('/regions');
      setRegions(res.data || []);
    } catch (err) {
      console.warn('Failed to load regions', err);
    }
  };

  const validateZone = () => {
    const errs: any = {};
    if (!zoneCode.trim()) errs.zoneCode = 'Zone code is required';
    if (!zoneName.trim()) errs.zoneName = 'Zone name is required';
    setZoneErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createZone = async () => {
    if (!validateZone()) {
      Alert.alert('Validation Error', 'Please check all required fields.');
      return;
    }
    try {
      await api.post('/zones', { zoneCode: zoneCode.trim().toUpperCase(), zoneName: zoneName.trim() });
      setZoneCode('');
      setZoneName('');
      setZoneErrors({});
      fetchZones();
      Alert.alert('Success', 'Geographic Zone created.');
    } catch (err) {
      Alert.alert('Error', 'Failed to create zone.');
    }
  };

  const validateRegion = () => {
    const errs: any = {};
    if (!regionCode.trim()) errs.regionCode = 'Region code is required';
    if (!regionName.trim()) errs.regionName = 'Region name is required';
    setRegionErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createRegion = async () => {
    if (!selectedZoneId) {
      Alert.alert('Error', 'Please select a parent Geographic Zone.');
      return;
    }
    if (!validateRegion()) {
      Alert.alert('Validation Error', 'Please check all required fields.');
      return;
    }
    try {
      await api.post('/regions', {
        zoneId: selectedZoneId,
        regionCode: regionCode.trim().toUpperCase(),
        regionName: regionName.trim(),
      });
      setRegionCode('');
      setRegionName('');
      setRegionErrors({});
      fetchRegions();
      Alert.alert('Success', 'Sub-region division added.');
    } catch (err) {
      Alert.alert('Error', 'Failed to add sub-region.');
    }
  };

  // Pipeline stages
  const fetchStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const res = await api.get('/leads/statuses');
      setStatuses(res.data || []);
    } catch (err) {
      console.warn('Failed to load statuses', err);
    } finally {
      setLoadingStatuses(false);
    }
  };

  const validateStatus = () => {
    const errs: any = {};
    if (!statusCode.trim()) errs.statusCode = 'Status code is required';
    if (!statusName.trim()) errs.statusName = 'Status name is required';
    if (!statusOrder.trim()) {
      errs.statusOrder = 'Pipeline order index is required';
    } else {
      const ord = parseInt(statusOrder);
      if (isNaN(ord) || ord <= 0) {
        errs.statusOrder = 'Must be positive integer';
      }
    }
    setStatusErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createStatus = async () => {
    if (!validateStatus()) {
      Alert.alert('Validation Error', 'Please check all required fields.');
      return;
    }
    try {
      await api.post('/leads/status', {
        code: statusCode.trim().toUpperCase(),
        name: statusName.trim(),
        statusOrder: parseInt(statusOrder),
        isWon,
        isDrop,
      });
      setStatusCode('');
      setStatusName('');
      setStatusOrder('');
      setIsWon(false);
      setIsDrop(false);
      setStatusErrors({});
      fetchStatuses();
      Alert.alert('Success', 'Lead Status pipeline stage created.');
    } catch (err) {
      Alert.alert('Error', 'Failed to create lead status.');
    }
  };

  // Lead Sources Master
  const fetchSources = async () => {
    setLoadingSources(true);
    try {
      const res = await api.get('/masters/lead-sources');
      setSources(res.data || []);
    } catch (err) {
      console.warn('Failed to load lead sources', err);
    } finally {
      setLoadingSources(false);
    }
  };

  const validateSource = () => {
    const errs: any = {};
    if (!sourceCode.trim()) errs.sourceCode = 'Source code is required';
    if (!sourceName.trim()) errs.sourceName = 'Source name is required';
    setSourceErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createSource = async () => {
    if (!validateSource()) return;
    try {
      await api.post('/masters/lead-sources', { code: sourceCode.trim(), name: sourceName.trim() });
      setSourceCode('');
      setSourceName('');
      setSourceErrors({});
      fetchSources();
      Alert.alert('Success', 'Lead source created.');
    } catch (err) {
      Alert.alert('Error', 'Failed to create lead source.');
    }
  };

  const deleteSource = async (id: string) => {
    try {
      await api.delete(`/masters/lead-sources/${id}`);
      fetchSources();
      Alert.alert('Deleted', 'Lead source removed.');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete lead source.');
    }
  };

  // Industries Master
  const fetchIndustries = async () => {
    setLoadingIndustries(true);
    try {
      const res = await api.get('/masters/industries');
      setIndustries(res.data || []);
    } catch (err) {
      console.warn('Failed to load industries', err);
    } finally {
      setLoadingIndustries(false);
    }
  };

  const validateIndustry = () => {
    const errs: any = {};
    if (!industryCode.trim()) errs.industryCode = 'Industry code is required';
    if (!industryName.trim()) errs.industryName = 'Industry name is required';
    setIndustryErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const createIndustry = async () => {
    if (!validateIndustry()) return;
    try {
      await api.post('/masters/industries', { code: industryCode.trim(), name: industryName.trim() });
      setIndustryCode('');
      setIndustryName('');
      setIndustryErrors({});
      fetchIndustries();
      Alert.alert('Success', 'Industry type added.');
    } catch (err) {
      Alert.alert('Error', 'Failed to add industry type.');
    }
  };

  const deleteIndustry = async (id: string) => {
    try {
      await api.delete(`/masters/industries/${id}`);
      fetchIndustries();
      Alert.alert('Deleted', 'Industry type removed.');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete industry.');
    }
  };

  useEffect(() => {
    fetchZones();
    fetchStatuses();
    fetchSources();
    fetchIndustries();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>⚙️ Configurations Master</Text>

      {/* Sub tabs selectors */}
      <View style={styles.subTabContainer}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'ZONES' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('ZONES')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'ZONES' && styles.subTabTextActive]}>ZONES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'STATUSES' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('STATUSES')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'STATUSES' && styles.subTabTextActive]}>STATUSES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'SOURCES' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('SOURCES')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'SOURCES' && styles.subTabTextActive]}>SOURCES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'INDUSTRIES' && styles.subTabBtnActive]}
          onPress={() => setActiveSubTab('INDUSTRIES')}
        >
          <Text style={[styles.subTabText, activeSubTab === 'INDUSTRIES' && styles.subTabTextActive]}>INDUSTRIES</Text>
        </TouchableOpacity>
      </View>

      {activeSubTab === 'ZONES' && (
        <View>
          {/* Create Zone */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Geographic Zone</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Zone Code *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'zoneCode' && styles.inputFocused,
                  !!zoneErrors.zoneCode && styles.inputError
                ]} 
                value={zoneCode} 
                onChangeText={(text) => {
                  setZoneCode(text);
                  if (zoneErrors.zoneCode) setZoneErrors({ ...zoneErrors, zoneCode: null });
                }} 
                placeholder="e.g. WEST" 
                placeholderTextColor="#A0AEC0"
                autoCapitalize="characters"
                onFocus={() => setFocusedField('zoneCode')}
                onBlur={() => setFocusedField(null)}
              />
              {!!zoneErrors.zoneCode && <Text style={styles.errorText}>⚠️ {zoneErrors.zoneCode}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Zone Name *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'zoneName' && styles.inputFocused,
                  !!zoneErrors.zoneName && styles.inputError
                ]} 
                value={zoneName} 
                onChangeText={(text) => {
                  setZoneName(text);
                  if (zoneErrors.zoneName) setZoneErrors({ ...zoneErrors, zoneName: null });
                }} 
                placeholder="e.g. Western Region Division" 
                placeholderTextColor="#A0AEC0"
                onFocus={() => setFocusedField('zoneName')}
                onBlur={() => setFocusedField(null)}
              />
              {!!zoneErrors.zoneName && <Text style={styles.errorText}>⚠️ {zoneErrors.zoneName}</Text>}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={createZone}>
              <Text style={styles.saveBtnText}>Save Zone</Text>
            </TouchableOpacity>
          </View>

          {/* Zones List */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Geographic Zones List</Text>
            {loadingZones ? (
              <ActivityIndicator color="#FF6B81" />
            ) : zones.length === 0 ? (
              <Text style={styles.empty}>No geographic zones configured.</Text>
            ) : (
              zones.map((z) => (
                <TouchableOpacity 
                  key={z.id} 
                  style={[styles.listItem, selectedZoneId === z.id && styles.listItemSelected]}
                  onPress={() => setSelectedZoneId(z.id)}
                >
                  <Text style={styles.itemTitle}>{z.zoneName} ({z.zoneCode})</Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Create Region */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Sub-Region (District/Area)</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Region Code *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'regionCode' && styles.inputFocused,
                  !!regionErrors.regionCode && styles.inputError
                ]} 
                value={regionCode} 
                onChangeText={(text) => {
                  setRegionCode(text);
                  if (regionErrors.regionCode) setRegionErrors({ ...regionErrors, regionCode: null });
                }} 
                placeholder="e.g. MUM" 
                placeholderTextColor="#A0AEC0"
                autoCapitalize="characters"
                onFocus={() => setFocusedField('regionCode')}
                onBlur={() => setFocusedField(null)}
              />
              {!!regionErrors.regionCode && <Text style={styles.errorText}>⚠️ {regionErrors.regionCode}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Region Name *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'regionName' && styles.inputFocused,
                  !!regionErrors.regionName && styles.inputError
                ]} 
                value={regionName} 
                onChangeText={(text) => {
                  setRegionName(text);
                  if (regionErrors.regionName) setRegionErrors({ ...regionErrors, regionName: null });
                }} 
                placeholder="e.g. Mumbai Corporate Hub" 
                placeholderTextColor="#A0AEC0"
                onFocus={() => setFocusedField('regionName')}
                onBlur={() => setFocusedField(null)}
              />
              {!!regionErrors.regionName && <Text style={styles.errorText}>⚠️ {regionErrors.regionName}</Text>}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={createRegion}>
              <Text style={styles.saveBtnText}>Add Sub-Region</Text>
            </TouchableOpacity>
          </View>

          {/* Regions List */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Regions Division Map</Text>
            {regions.length === 0 ? (
              <Text style={styles.empty}>No regions mapped.</Text>
            ) : (
              regions
                .filter((r) => r.zoneId === selectedZoneId)
                .map((r) => (
                  <View key={r.id} style={styles.listItem}>
                    <Text style={styles.itemTitle}>{r.regionName} ({r.regionCode})</Text>
                  </View>
                ))
            )}
          </View>
        </View>
      )}

      {activeSubTab === 'STATUSES' && (
        <View>
          {/* Create Pipeline status */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Pipeline Stage Status</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pipeline Code Identifier *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'statusCode' && styles.inputFocused,
                  !!statusErrors.statusCode && styles.inputError
                ]} 
                value={statusCode} 
                onChangeText={(text) => {
                  setStatusCode(text);
                  if (statusErrors.statusCode) setStatusErrors({ ...statusErrors, statusCode: null });
                }} 
                placeholder="e.g. LEAD_SENT" 
                placeholderTextColor="#A0AEC0"
                autoCapitalize="characters"
                onFocus={() => setFocusedField('statusCode')}
                onBlur={() => setFocusedField(null)}
              />
              {!!statusErrors.statusCode && <Text style={styles.errorText}>⚠️ {statusErrors.statusCode}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Public Display Label *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'statusName' && styles.inputFocused,
                  !!statusErrors.statusName && styles.inputError
                ]} 
                value={statusName} 
                onChangeText={(text) => {
                  setStatusName(text);
                  if (statusErrors.statusName) setStatusErrors({ ...statusErrors, statusName: null });
                }} 
                placeholder="e.g. Proposal Handover" 
                placeholderTextColor="#A0AEC0"
                onFocus={() => setFocusedField('statusName')}
                onBlur={() => setFocusedField(null)}
              />
              {!!statusErrors.statusName && <Text style={styles.errorText}>⚠️ {statusErrors.statusName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sort Order Index (Index Index) *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'statusOrder' && styles.inputFocused,
                  !!statusErrors.statusOrder && styles.inputError
                ]} 
                value={statusOrder} 
                onChangeText={(text) => {
                  setStatusOrder(text);
                  if (statusErrors.statusOrder) setStatusErrors({ ...statusErrors, statusOrder: null });
                }} 
                placeholder="e.g. 5" 
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                onFocus={() => setFocusedField('statusOrder')}
                onBlur={() => setFocusedField(null)}
              />
              {!!statusErrors.statusOrder && <Text style={styles.errorText}>⚠️ {statusErrors.statusOrder}</Text>}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Mark as Won Conversion Stage</Text>
              <Switch value={isWon} onValueChange={(val) => setIsWon(val)} trackColor={{ true: '#FF6B81' }} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Mark as Lost/Dropped pipeline state</Text>
              <Switch value={isDrop} onValueChange={(val) => setIsDrop(val)} trackColor={{ true: '#FF6B81' }} />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={createStatus}>
              <Text style={styles.saveBtnText}>Save Pipeline Status</Text>
            </TouchableOpacity>
          </View>

          {/* Status Pipeline stage lists */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lead Pipeline Status Flow</Text>
            {loadingStatuses ? (
              <ActivityIndicator color="#FF6B81" />
            ) : statuses.length === 0 ? (
              <Text style={styles.empty}>No lead statuses configured.</Text>
            ) : (
              statuses
                .sort((a, b) => a.statusOrder - b.statusOrder)
                .map((st) => (
                  <View key={st.id} style={styles.listItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.itemOrderBadge}>{st.statusOrder}</Text>
                      <Text style={styles.itemTitle}>{st.name} ({st.code})</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      {st.isWon && <Text style={styles.badgeWon}>WON</Text>}
                      {st.isDrop && <Text style={styles.badgeLost}>DROPPED</Text>}
                    </View>
                  </View>
                ))
            )}
          </View>
        </View>
      )}

      {activeSubTab === 'SOURCES' && (
        <View>
          {/* Create Lead Source */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Lead Source</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Source Code *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'sourceCode' && styles.inputFocused,
                  !!sourceErrors.sourceCode && styles.inputError
                ]} 
                value={sourceCode} 
                onChangeText={(text) => {
                  setSourceCode(text);
                  if (sourceErrors.sourceCode) setSourceErrors({ ...sourceErrors, sourceCode: null });
                }} 
                placeholder="e.g. cold-call" 
                placeholderTextColor="#A0AEC0"
                onFocus={() => setFocusedField('sourceCode')}
                onBlur={() => setFocusedField(null)}
              />
              {!!sourceErrors.sourceCode && <Text style={styles.errorText}>⚠️ {sourceErrors.sourceCode}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'sourceName' && styles.inputFocused,
                  !!sourceErrors.sourceName && styles.inputError
                ]} 
                value={sourceName} 
                onChangeText={(text) => {
                  setSourceName(text);
                  if (sourceErrors.sourceName) setSourceErrors({ ...sourceErrors, sourceName: null });
                }} 
                placeholder="e.g. Cold Call" 
                placeholderTextColor="#A0AEC0"
                onFocus={() => setFocusedField('sourceName')}
                onBlur={() => setFocusedField(null)}
              />
              {!!sourceErrors.sourceName && <Text style={styles.errorText}>⚠️ {sourceErrors.sourceName}</Text>}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={createSource}>
              <Text style={styles.saveBtnText}>Save Lead Source</Text>
            </TouchableOpacity>
          </View>

          {/* Sources List */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Lead Sources List</Text>
            {loadingSources ? (
              <ActivityIndicator color="#FF6B81" />
            ) : sources.length === 0 ? (
              <Text style={styles.empty}>No lead sources configured.</Text>
            ) : (
              sources.map((s) => (
                <View key={s.id} style={styles.listItemActions}>
                  <Text style={styles.itemTitle}>{s.name} ({s.code})</Text>
                  <TouchableOpacity onPress={() => deleteSource(s.id)}>
                    <MaterialIcons name="delete" size={20} color="#E53E3E" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {activeSubTab === 'INDUSTRIES' && (
        <View>
          {/* Create Industry */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Industry Type</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Industry Code *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'industryCode' && styles.inputFocused,
                  !!industryErrors.industryCode && styles.inputError
                ]} 
                value={industryCode} 
                onChangeText={(text) => {
                  setIndustryCode(text);
                  if (industryErrors.industryCode) setIndustryErrors({ ...industryErrors, industryCode: null });
                }} 
                placeholder="e.g. school" 
                placeholderTextColor="#A0AEC0"
                onFocus={() => setFocusedField('industryCode')}
                onBlur={() => setFocusedField(null)}
              />
              {!!industryErrors.industryCode && <Text style={styles.errorText}>⚠️ {industryErrors.industryCode}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name *</Text>
              <TextInput 
                style={[
                  styles.input, 
                  focusedField === 'industryName' && styles.inputFocused,
                  !!industryErrors.industryName && styles.inputError
                ]} 
                value={industryName} 
                onChangeText={(text) => {
                  setIndustryName(text);
                  if (industryErrors.industryName) setIndustryErrors({ ...industryErrors, industryName: null });
                }} 
                placeholder="e.g. School" 
                placeholderTextColor="#A0AEC0"
                onFocus={() => setFocusedField('industryName')}
                onBlur={() => setFocusedField(null)}
              />
              {!!industryErrors.industryName && <Text style={styles.errorText}>⚠️ {industryErrors.industryName}</Text>}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={createIndustry}>
              <Text style={styles.saveBtnText}>Save Industry</Text>
            </TouchableOpacity>
          </View>

          {/* Industries List */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Industries List</Text>
            {loadingIndustries ? (
              <ActivityIndicator color="#FF6B81" />
            ) : industries.length === 0 ? (
              <Text style={styles.empty}>No industry types configured.</Text>
            ) : (
              industries.map((ind) => (
                <View key={ind.id} style={styles.listItemActions}>
                  <Text style={styles.itemTitle}>{ind.name} ({ind.code})</Text>
                  <TouchableOpacity onPress={() => deleteIndustry(ind.id)}>
                    <MaterialIcons name="delete" size={20} color="#E53E3E" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1B3A',
    marginBottom: 20,
    fontFamily: Platform.select({ web: '"Poppins", sans-serif', default: 'System' }),
  },
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E4E9FC',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  subTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#718096',
  },
  subTabTextActive: {
    color: '#FF6B81',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#1D2A68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B3A',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E1B3A',
  },
  inputFocused: {
    borderColor: '#FF6B81',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#FF6B81',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  listItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  listItemSelected: {
    backgroundColor: '#F7FAFC',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  itemOrderBadge: {
    backgroundColor: '#E2E8F0',
    color: '#4A5568',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 10,
    overflow: 'hidden',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '600',
  },
  badgeWon: {
    backgroundColor: '#E6F4EA',
    color: '#137333',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
    overflow: 'hidden',
  },
  badgeLost: {
    backgroundColor: '#FCE8E6',
    color: '#C5221F',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
    overflow: 'hidden',
  },
  empty: {
    fontStyle: 'italic',
    color: '#A0AEC0',
    fontWeight: '500',
    paddingVertical: 8,
  },
});
