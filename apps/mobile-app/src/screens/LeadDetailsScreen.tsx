import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../services/api';

export default function LeadDetailsScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'INFO' | 'TIMELINE'>('INFO');
  
  // Status Picker State
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchLeadDetails = async () => {
    try {
      const res = await api.get(`/leads/${id}`);
      setLead(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load lead details.');
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await api.get('/leads/statuses');
      setStatuses(res.data || []);
    } catch (err) {
      console.warn('Failed to load available statuses:', err);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
    fetchStatuses();

    if (Platform.OS === 'web') {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap';
      document.head.appendChild(fontLink);
    }

    const unsubscribe = navigation.addListener('focus', () => {
      fetchLeadDetails();
      fetchStatuses();
    });

    return unsubscribe;
  }, [navigation, id]);

  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert('No Number', 'No phone number provided for this lead.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate call on this device.');
    });
  };

  const handleEmail = (email: string) => {
    if (!email) {
      Alert.alert('No Email', 'No email address provided for this lead.');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Mail Failed', 'Unable to open mail client on this device.');
    });
  };

  const handleUpdateStatus = async (statusId: string, statusName: string) => {
    setUpdatingStatus(true);
    try {
      await api.put(`/leads/${id}`, {
        leadStatusId: statusId,
      });
      setUpdatingStatus(false);
      setStatusModalVisible(false);
      
      if (Platform.OS === 'web') {
        alert(`Lead status updated to ${statusName} successfully.`);
      } else {
        Alert.alert('Success', `Lead status updated to ${statusName} successfully.`);
      }
      
      fetchLeadDetails();
    } catch (err: any) {
      setUpdatingStatus(false);
      Alert.alert('Update Failed', err.response?.data?.message || 'Failed to update lead status.');
    }
  };

  const getActivityIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('CALL')) return { name: 'call', color: '#FF6B81', bg: '#FFF0F2' };
    if (t.includes('MEETING')) return { name: 'groups', color: '#5854D6', bg: '#EEFFAF' };
    if (t.includes('EMAIL')) return { name: 'email', color: '#FFB020', bg: '#FFF7E6' };
    return { name: 'event-note', color: '#718096', bg: '#F8FAFD' };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B81" />
      </View>
    );
  }

  const activitiesCount = lead?.activities?.length || 0;

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hrStr = String(hours).padStart(2, '0');
    return `${day}-${month}-${year} ${hrStr}:${minutes} ${ampm}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        {/* Premium Header Curved Box */}
        <View style={styles.header}>
          {/* Top Header Row with Lead Number & Status */}
          <View style={styles.headerTopRow}>
            <Text style={styles.leadNo}>{lead.leadNo}</Text>
            
            <TouchableOpacity 
              style={styles.statusBadgeBtn}
              onPress={() => setStatusModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{lead.status?.name || 'NEW'}</Text>
              </View>
              <View style={styles.editStatusIconCircle}>
                <MaterialIcons name="edit" size={10} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Lead/Company Title */}
          <Text style={styles.company}>
            {lead.companyName || lead.contactPerson || 'No Company Name'}
          </Text>

          {/* Value Row */}
          <View style={styles.valueRow}>
            <MaterialIcons name="monetization-on" size={18} color="#FF6B81" style={styles.valIcon} />
            <Text style={styles.valueLabel}>Expected Closing Value: </Text>
            <Text style={styles.valueText}>₹{parseFloat(lead.expectedValue || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Pill Segment Tab controls */}
        <View style={styles.tabOuter}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'INFO' && styles.activeTab]}
              onPress={() => setActiveTab('INFO')}
            >
              <MaterialIcons name="info-outline" size={18} color={activeTab === 'INFO' ? '#ffffff' : '#8A99AD'} style={styles.tabIcon} />
              <Text style={[styles.tabText, activeTab === 'INFO' && styles.activeTabText]}>Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'TIMELINE' && styles.activeTab]}
              onPress={() => setActiveTab('TIMELINE')}
            >
              <MaterialIcons name="history" size={18} color={activeTab === 'TIMELINE' ? '#ffffff' : '#8A99AD'} style={styles.tabIcon} />
              <Text style={[styles.tabText, activeTab === 'TIMELINE' && styles.activeTabText]}>Timeline</Text>
              {activitiesCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{activitiesCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'INFO' ? (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            {/* Contact Details Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="contacts" size={20} color="#5854D6" />
                <Text style={styles.sectionTitle}>Contact Details</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.infoLabel}>Contact Person</Text>
                <Text style={styles.infoVal}>{lead.contactPerson || '-'}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.infoLabel}>Mobile Number</Text>
                {lead.mobile ? (
                  <TouchableOpacity onPress={() => handleCall(lead.mobile)} style={styles.linkRow}>
                    <MaterialIcons name="phone" size={16} color="#FF6B81" />
                    <Text style={styles.linkText}>{lead.mobile}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoVal}>-</Text>
                )}
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.infoLabel}>Email Address</Text>
                {lead.email ? (
                  <TouchableOpacity onPress={() => handleEmail(lead.email)} style={styles.linkRow}>
                    <MaterialIcons name="mail-outline" size={16} color="#FF6B81" />
                    <Text style={styles.linkText}>{lead.email}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.infoVal}>-</Text>
                )}
              </View>
            </View>

            {/* Classification Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="label-important" size={20} color="#FFB020" />
                <Text style={styles.sectionTitle}>Classifications</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.infoLabel}>Industry</Text>
                <Text style={styles.infoVal}>{lead.industry || 'Not Classified'}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.infoLabel}>Lead Source</Text>
                <Text style={styles.infoVal}>{lead.source || 'Not Classified'}</Text>
              </View>

              {lead.latitude && lead.longitude && (
                <View style={styles.detailItem}>
                  <Text style={styles.infoLabel}>Office Coordinates</Text>
                  <View style={styles.coordBox}>
                    <MaterialIcons name="pin-drop" size={16} color="#FF6B81" />
                    <Text style={styles.coordVal}>Lat: {lead.latitude}, Lng: {lead.longitude}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Products Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="shopping-bag" size={20} color="#FF6B81" />
                <Text style={styles.sectionTitle}>Mapped Products</Text>
              </View>
              {!lead.products || lead.products.length === 0 ? (
                <Text style={styles.empty}>No products mapped to this lead.</Text>
              ) : (
                <View>
                  {lead.products.map((p: any, idx: number) => {
                    const priceType = p.pricingType || 'UNIT';
                    const qty = p.quantity || 0;
                    const amount = parseFloat(p.amount || '0');
                    let rateLabel = '';
                    if (priceType === 'FIXED') {
                      rateLabel = `₹${amount.toLocaleString('en-IN')} (Fixed Range)`;
                    } else {
                      const unitPrice = parseFloat(p.slabUnitPrice || p.unitPrice || '0');
                      rateLabel = `₹${unitPrice.toLocaleString('en-IN')} / unit`;
                    }

                    return (
                      <View key={p.productId || idx} style={styles.productRowDetail}>
                        <Text style={styles.productDetailName}>{p.productName}</Text>
                        <View style={styles.productDetailMetaRow}>
                          <Text style={styles.productDetailMetaLabel}>Pricing Type:</Text>
                          <Text style={styles.productDetailMetaVal}>{priceType === 'FIXED' ? 'Fixed Range Price' : 'Unit Price'}</Text>
                        </View>
                        <View style={styles.productDetailMetaRow}>
                          <Text style={styles.productDetailMetaLabel}>Estimated Count:</Text>
                          <Text style={styles.productDetailMetaVal}>{qty.toLocaleString('en-IN')}</Text>
                        </View>
                        <View style={styles.productDetailMetaRow}>
                          <Text style={styles.productDetailMetaLabel}>Rate Applied:</Text>
                          <Text style={styles.productDetailMetaVal}>{rateLabel}</Text>
                        </View>
                        <View style={styles.productDetailMetaRow}>
                          <Text style={styles.productDetailMetaLabel}>Line Total:</Text>
                          <Text style={styles.productDetailMetaValTotal}>₹{parseFloat(p.amount || 0).toLocaleString('en-IN')}</Text>
                        </View>
                        {idx < lead.products.length - 1 && <View style={styles.productRowDivider} />}
                      </View>
                    );
                  })}
                  
                  <View style={styles.grandTotalDivider} />
                  <View style={styles.grandTotalContainer}>
                    <Text style={styles.grandTotalLabel}>Overall Expected Value</Text>
                    <Text style={styles.grandTotalVal}>₹{parseFloat(lead.expectedValue || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            {/* Activities Timeline Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="pending-actions" size={20} color="#FF6B81" />
                <Text style={styles.sectionTitle}>Activity History</Text>
              </View>
              {!lead.activities || lead.activities.length === 0 ? (
                <View style={styles.emptyTimeline}>
                  <MaterialIcons name="event-busy" size={40} color="#8A99AD" />
                  <Text style={[styles.empty, { marginTop: 8 }]}>No activities logged yet.</Text>
                </View>
              ) : (
                lead.activities.map((act: any, index: number) => {
                  const icon = getActivityIcon(act.type);
                  return (
                    <View key={act.id} style={styles.timelineRow}>
                      <View style={[
                        styles.timelineLine, 
                        index === lead.activities.length - 1 && { height: 0 }
                      ]} />
                      <View style={[styles.timelineDotCircle, { backgroundColor: icon.bg }]}>
                        <MaterialIcons name={icon.name as any} size={14} color={icon.color} />
                      </View>
                      <View style={styles.timelineContent}>
                        <View style={styles.timelineHeader}>
                          <Text style={[styles.timelineType, { color: icon.color }]}>{act.type.toUpperCase()}</Text>
                          <Text style={styles.timelineDate}>
                            {new Date(act.activityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                        {act.creator && (
                          <Text style={styles.timelineUser}>Logged by {act.creator.name || act.creator.email}</Text>
                        )}
                        <Text style={styles.timelineRemarks}>{act.remarks}</Text>
                        
                        {act.nextFollowupDate && (
                          <View style={styles.nextFollowupBox}>
                            <MaterialIcons name="alarm" size={12} color="#718096" />
                            <Text style={styles.nextFollowupText}>
                              Next follow-up: {formatDateTime(act.nextFollowupDate)}
                            </Text>
                          </View>
                        )}

                        {/* Attachments Section */}
                        {act.attachments && act.attachments.length > 0 && (
                          <View style={styles.attachmentsContainer}>
                            <Text style={styles.attachmentsHeader}>Attachments ({act.attachments.length})</Text>
                            <View style={styles.attachmentsList}>
                              {act.attachments.map((file: any) => {
                                const isImage = file.contentType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.fileName);
                                return (
                                  <TouchableOpacity 
                                    key={file.id} 
                                    style={styles.attachmentRow}
                                    onPress={() => Linking.openURL(file.fileUrl)}
                                  >
                                    <MaterialIcons 
                                      name={isImage ? 'image' : 'insert-drive-file'} 
                                      size={16} 
                                      color={isImage ? '#FF6B81' : '#5854D6'} 
                                    />
                                    <Text style={styles.attachmentName} numberOfLines={1}>
                                      {file.fileName}
                                    </Text>
                                    <MaterialIcons name="file-download" size={14} color="#8A99AD" />
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Status Picker Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Lead Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  style={styles.modalItem}
                  onPress={() => handleUpdateStatus(status.id, status.name)}
                >
                  <Text style={[styles.modalItemText, lead.leadStatusId === status.id && styles.modalItemTextActive]}>
                    {status.name}
                  </Text>
                  {lead.leadStatusId === status.id && (
                    <MaterialIcons name="check" size={20} color="#FF6B81" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#1E1B3A' }]}
          onPress={() => navigation.navigate('ActivityLogger', { leadId: lead.id })}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add-call" size={18} color="#FFFFFF" style={styles.btnIcon} />
          <Text style={styles.actionBtnText}>LOG ACTIVITY</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#FF6B81' }]}
          onPress={() => navigation.navigate('LeadForm', { leadId: lead.id })}
          activeOpacity={0.8}
        >
          <MaterialIcons name="edit" size={18} color="#FFFFFF" style={styles.btnIcon} />
          <Text style={styles.actionBtnText}>EDIT LEAD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4FF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F4FF',
  },
  header: {
    backgroundColor: '#1E1B3A', // Dark Navy Curved Header
    padding: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerNameBlock: {
    marginBottom: 16,
  },
  contactPersonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8A99AD',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  leadNo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF6B81', // Coral Red Accent
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 107, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 129, 0.3)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF6B81',
  },
  editStatusIconCircle: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B81',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1E1B3A',
  },
  company: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 4,
    flexWrap: 'wrap',
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valIcon: {
    marginRight: 6,
  },
  valueLabel: {
    fontSize: 13,
    color: '#8A99AD',
    fontWeight: '600',
  },
  valueText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '800',
  },
  tabOuter: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2D2A55', // Pill Selector
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FF6B81', // Coral Red Active selector
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A99AD',
  },
  activeTabText: {
    color: '#ffffff',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1E1B3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B3A',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.select({
      web: '"Poppins", sans-serif',
      default: 'System',
    }),
  },
  detailItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A99AD',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoVal: {
    fontSize: 15,
    color: '#1E1B3A',
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  linkText: {
    fontSize: 15,
    color: '#FF6B81',
    fontWeight: '700',
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  coordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFD',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 2,
  },
  coordVal: {
    fontSize: 14,
    color: '#1E1B3A',
    fontWeight: '700',
    marginLeft: 6,
  },
  empty: {
    fontStyle: 'italic',
    color: '#8A99AD',
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 12,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  productLeft: {
    flex: 1,
  },
  productName: {
    fontWeight: '700',
    color: '#1E1B3A',
    fontSize: 14,
    marginBottom: 2,
  },
  productPricing: {
    color: '#8A99AD',
    fontWeight: '600',
    fontSize: 12,
  },
  productTotal: {
    fontWeight: '800',
    color: '#1E1B3A',
    fontSize: 14,
    marginLeft: 16,
  },
  emptyTimeline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 17,
    top: 26,
    bottom: -32,
    width: 2,
    backgroundColor: '#EDF2F7',
  },
  timelineDotCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#F8FAFD',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timelineType: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineDate: {
    fontSize: 11,
    color: '#8A99AD',
    fontWeight: '600',
  },
  timelineRemarks: {
    fontSize: 13,
    color: '#1E1B3A',
    fontWeight: '500',
    lineHeight: 18,
  },
  nextFollowupBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  nextFollowupText: {
    fontSize: 11,
    color: '#1E1B3A',
    fontWeight: '700',
    marginLeft: 4,
  },
  
  // Modal Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 58, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#F0F4F8',
    paddingBottom: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B3A',
  },
  modalScroll: {
    maxHeight: 250,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#718096',
  },
  modalItemTextActive: {
    color: '#FF6B81',
  },
  timelineUser: {
    fontSize: 11,
    color: '#8A99AD',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  attachmentsContainer: {
    marginTop: 10,
    backgroundColor: '#F8FAFD',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A99AD',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  attachmentsList: {
    gap: 6,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    color: '#1E1B3A',
    fontWeight: '600',
    marginLeft: 8,
  },
  productRowDetail: {
    paddingVertical: 10,
  },
  productDetailName: {
    fontWeight: '800',
    color: '#1E1B3A',
    fontSize: 14,
    marginBottom: 6,
  },
  productDetailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  productDetailMetaLabel: {
    fontSize: 12,
    color: '#8A99AD',
    fontWeight: '600',
  },
  productDetailMetaVal: {
    fontSize: 12,
    color: '#1E1B3A',
    fontWeight: '700',
  },
  productDetailMetaValTotal: {
    fontSize: 12,
    color: '#FF6B81',
    fontWeight: '800',
  },
  productRowDivider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginTop: 10,
  },
  grandTotalDivider: {
    height: 2,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  grandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B3A',
    textTransform: 'uppercase',
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B81',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '48%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  btnIcon: {
    marginRight: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
