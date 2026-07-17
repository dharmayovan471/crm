import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../services/api';

export default function ActivityLoggerScreen({ route, navigation }: any) {
  const { leadId, customerId } = route.params || {};
  const [type, setType] = useState('Call');
  const [remarks, setRemarks] = useState('');
  const [followupDate, setFollowupDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (Platform.OS === 'web') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(fontLink);
    }
  }, []);

  const handleCaptureImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture images.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
        const newFile = {
          uri: asset.uri,
          name: fileName,
          type: 'image/jpeg',
        };
        setSelectedFiles((prev) => [...prev, newFile]);
      }
    } catch (e) {
      console.warn('Camera launch failed:', e);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newFile = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
        };
        setSelectedFiles((prev) => [...prev, newFile]);
      }
    } catch (e) {
      console.warn('Document picking failed:', e);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUploadAllSelectedFiles = async (entityType: string, entityId: string) => {
    if (selectedFiles.length === 0) return [];
    
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    const res = await api.post('/attachments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  };

  const validateForm = () => {
    const errs: any = {};
    if (!remarks.trim()) {
      errs.remarks = 'Remarks / description is required';
    } else if (remarks.length > 500) {
      errs.remarks = 'Remarks cannot exceed 500 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogActivity = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please complete remarks field correctly.');
      return;
    }
    setLoading(true);
    try {
      // 1. Create logged activity
      const activityRes = await api.post('/activities', {
        leadId,
        customerId,
        type: type.toUpperCase(),
        remarks: remarks.trim(),
        nextFollowupDate: followupDate ? followupDate.toISOString() : undefined,
      });
      const newActivity = activityRes.data;

      // 2. Upload attachments
      if (selectedFiles.length > 0) {
        await handleUploadAllSelectedFiles('ACTIVITY', newActivity.id);
      }

      setLoading(false);
      if (Platform.OS === 'web') {
        alert('Activity logged successfully.');
      } else {
        Alert.alert('Success', 'Activity logged successfully.');
      }
      navigation.goBack();
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.message || 'Failed to log activity.');
    }
  };

  const types = [
    { label: 'Call', icon: 'call' },
    { label: 'Meeting', icon: 'groups' },
    { label: 'Email', icon: 'email' },
  ];

  const getStyleForFocusedInput = (fieldName: string) => [
    styles.input,
    focusedField === fieldName && styles.inputFocused,
    !!errors[fieldName] && styles.inputError,
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>📞 Log Activity</Text>
      <Text style={styles.subtitle}>Record client interactions, follow-ups, and attachments.</Text>

      {/* Segment Selector tabs styled like Modychat tabs */}
      <View style={styles.card}>
        <Text style={styles.label}>Interaction Type *</Text>
        <View style={styles.segmentContainer}>
          {types.map((t) => {
            const isSelected = type === t.label;
            return (
              <TouchableOpacity
                key={t.label}
                style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                onPress={() => setType(t.label)}
                activeOpacity={0.8}
              >
                <MaterialIcons name={t.icon as any} size={18} color={isSelected ? '#FFFFFF' : '#8A99AD'} style={styles.segmentIcon} />
                <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                  {t.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        {/* Remarks Input */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Remarks & Description *</Text>
            <Text style={[styles.charCount, remarks.length > 500 && styles.charCountOver]}>
              {500 - remarks.length} characters remaining
            </Text>
          </View>
          <TextInput
            style={[
              ...getStyleForFocusedInput('remarks'),
              styles.textArea
            ]}
            multiline
            numberOfLines={5}
            value={remarks}
            onChangeText={(text) => {
              setRemarks(text);
              if (errors.remarks) setErrors({ ...errors, remarks: null });
            }}
            placeholder="Discussed pricing terms, mapped catalog products, and set regional targets..."
            placeholderTextColor="#8A99AD"
            onFocus={() => setFocusedField('remarks')}
            onBlur={() => setFocusedField(null)}
          />
          {!!errors.remarks && <Text style={styles.errorText}>⚠️ {errors.remarks}</Text>}
        </View>

        {/* Date Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Next Follow-up Date & Time (Optional)</Text>
          {Platform.OS === 'web' ? (
            <TextInput
              {...(Platform.OS === 'web' ? { type: 'datetime-local' } : {}) as any}
              style={getStyleForFocusedInput('nextFollowup')}
              value={followupDate ? followupDate.toISOString().slice(0, 16) : ''}
              onChangeText={(text) => {
                setFollowupDate(text ? new Date(text) : null);
              }}
              onFocus={() => setFocusedField('nextFollowup')}
              onBlur={() => setFocusedField(null)}
            />
          ) : (
            <TouchableOpacity 
              style={getStyleForFocusedInput('nextFollowup')} 
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                <Text style={followupDate ? styles.inputText : styles.inputPlaceholder}>
                  {followupDate ? followupDate.toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Tap to set follow-up date & time'}
                </Text>
                <MaterialIcons name="event" size={20} color="#8A99AD" />
              </View>
            </TouchableOpacity>
          )}
          {showDatePicker && (
            <DateTimePicker
              value={followupDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setFollowupDate(selectedDate);
                  setTimeout(() => setShowTimePicker(true), 100);
                }
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={followupDate || new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) {
                  setFollowupDate(selectedDate);
                }
              }}
            />
          )}
          {!!errors.nextFollowup && <Text style={styles.errorText}>⚠️ {errors.nextFollowup}</Text>}
        </View>

        {/* Attachment Upload Box */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Attachments or Photos</Text>
          <View style={styles.attachmentBox}>
            {selectedFiles.length > 0 ? (
              <View style={styles.pickedFilesList}>
                {selectedFiles.map((file, idx) => (
                  <View key={idx} style={styles.pickedFileRow}>
                    <MaterialIcons 
                      name={file.type.startsWith('image/') ? 'image' : 'insert-drive-file'} 
                      size={18} 
                      color="#FF6B81" 
                    />
                    <Text style={styles.pickedFileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveFile(idx)}>
                      <MaterialIcons name="delete" size={18} color="#FF6B81" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.attachmentPlaceholder}>No files attached to this activity.</Text>
            )}
          </View>
          
          <View style={styles.uploadBtnRow}>
            <TouchableOpacity style={styles.uploadBtnHalf} onPress={handleCaptureImage} disabled={loading} activeOpacity={0.8}>
              <MaterialIcons name="photo-camera" size={18} color="#FF6B81" style={{ marginRight: 6 }} />
              <Text style={styles.uploadBtnText}>TAKE PHOTO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtnHalf} onPress={handlePickDocument} disabled={loading} activeOpacity={0.8}>
              <MaterialIcons name="attach-file" size={18} color="#FF6B81" style={{ marginRight: 6 }} />
              <Text style={styles.uploadBtnText}>ADD FILE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Transaction Button in Coral Red */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleLogActivity} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={styles.saveBtnContent}>
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>LOG TRANSACTION</Text>
            </View>
          )}
        </TouchableOpacity>
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
    padding: 24,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B3A',
    letterSpacing: -0.5,
    marginBottom: 6,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  subtitle: {
    fontSize: 13,
    color: '#718096',
    lineHeight: 18,
    marginBottom: 24,
    fontWeight: '500',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A99AD',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#2D2A55', // Pill Selector background
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FF6B81', // Coral Red Active button
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A99AD',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    height: 52,
    backgroundColor: '#F8FAFD',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1E1B3A',
    fontWeight: '500',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  textArea: {
    height: 100,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: '#FF6B81',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF6B81',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF6B81',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  attachmentBox: {
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  attachmentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentDisplay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B81',
    marginLeft: 8,
  },
  attachmentPlaceholder: {
    fontSize: 13,
    color: '#8A99AD',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  charCount: {
    fontSize: 11,
    color: '#8A99AD',
    fontWeight: '600',
  },
  charCountOver: {
    color: '#FF6B81',
  },
  inputText: {
    fontSize: 14,
    color: '#1E1B3A',
    fontWeight: '600',
  },
  inputPlaceholder: {
    fontSize: 14,
    color: '#8A99AD',
    fontWeight: '500',
  },
  pickedFilesList: {
    gap: 8,
  },
  pickedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  pickedFileName: {
    flex: 1,
    fontSize: 12,
    color: '#1E1B3A',
    fontWeight: '600',
    marginLeft: 8,
    paddingRight: 10,
  },
  uploadBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  uploadBtnHalf: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FF6B81',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  uploadBtnText: {
    color: '#FF6B81',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  saveBtn: {
    height: 52,
    backgroundColor: '#FF6B81', // Coral Red Log Button
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#FF6B81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
});
