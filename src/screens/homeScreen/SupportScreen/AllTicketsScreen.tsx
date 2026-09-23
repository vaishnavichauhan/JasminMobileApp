import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from '../../../components/Header/Header';
import { colors, fontFamily } from '../../../styles/variables';
import { useAuth } from '../../../context/AuthContext';
import { BASE_URL } from '../../../api/config';
import Images from '../../../assets/images';
import {
  getTicketsListApi,
  getTicketDetailsApi,
  addTicketRemarkApi,
  completeTicketApi,
  getTicketStatsApi,
  getSubTicketTypesApi,
  TicketTypeItem,
  TicketItem,
  RemarkThreadItem,
} from '../../../api/ticketsApi';

export interface AllTicketsScreenProps {
  navigation?: any;
  route?: any;
}

export const AllTicketsScreen: React.FC<AllTicketsScreenProps> = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  // Tabs & Tickets List State
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Ticket Counts for Tabs (Active & History)
  const [ticketCounts, setTicketCounts] = useState<{ active: number; history: number }>({
    active: 0,
    history: 0,
  });

  // Filter States
  const [ticketTypes, setTicketTypes] = useState<TicketTypeItem[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);
  const [selectedTicketType, setSelectedTicketType] = useState<string>('all'); // 'all' or ticket_type_id
  const [selectedVisibility, setSelectedVisibility] = useState<'all' | 'raised_by_me' | 'assigned_to_me'>('all');

  // Temp Filter States inside Modal
  const [tempTicketType, setTempTicketType] = useState<string>('all');
  const [tempVisibility, setTempVisibility] = useState<'all' | 'raised_by_me' | 'assigned_to_me'>('all');
  const [ticketTypeDropdownOpen, setTicketTypeDropdownOpen] = useState<boolean>(false);
  const [visibilityDropdownOpen, setVisibilityDropdownOpen] = useState<boolean>(false);

  // Image Preview Modal State (Shows ONLY Image on click)
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);

  // Reply / Add Remark State for Card Inputs (Active Tickets)
  const [cardReplyTexts, setCardReplyTexts] = useState<{ [ticketId: number]: string }>({});
  const [cardSubmitting, setCardSubmitting] = useState<{ [ticketId: number]: boolean }>({});
  const [cardReplyErrors, setCardReplyErrors] = useState<{ [ticketId: number]: string }>({});

  // Mark as Completed Modal State (PUT /v1/api/tickets/complete/:id)
  const [ticketToComplete, setTicketToComplete] = useState<TicketItem | null>(null);
  const [resolutionRemark, setResolutionRemark] = useState<string>('');
  const [completingLoading, setCompletingLoading] = useState<boolean>(false);
  const [completeError, setCompleteError] = useState<string>('');

  // Collapsible Remarks & Activity Logs (closed by default)
  const [expandedRemarks, setExpandedRemarks] = useState<{ [ticketId: number]: boolean }>({});

  const toggleRemarks = (ticketId: number) => {
    setExpandedRemarks((prev) => ({
      ...prev,
      [ticketId]: !prev[ticketId],
    }));
  };

  // Logged-in user information for resolver and visibility checks
  const currentUserId = (user as any)?.id || (user as any)?.userId || (user as any)?._id;
  const currentUserName = ((user as any)?.name || (user as any)?.username || '').trim().toLowerCase();

  // Load ticket types on mount for the filter dropdown
  useEffect(() => {
    let isMounted = true;
    const loadTicketTypes = async () => {
      try {
        const res = await getSubTicketTypesApi();
        if (isMounted && res && Array.isArray(res.ticket_types)) {
          setTicketTypes(res.ticket_types);
        }
      } catch (err) {
        console.warn('[AllTickets] Failed to load ticket types for filter:', err);
      }
    };
    loadTicketTypes();
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected Ticket Type Name for labels/chips
  const selectedTicketTypeName = useMemo(() => {
    if (selectedTicketType === 'all') return 'All';
    const found = ticketTypes.find((t) => String(t.id) === String(selectedTicketType));
    return found?.name || 'All';
  }, [selectedTicketType, ticketTypes]);

  // Check if any filter is active
  const hasActiveFilter = selectedTicketType !== 'all' || selectedVisibility !== 'all';

  // Filtered tickets based on Ticket Type and Visibility
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // 1. Ticket Type filter
      if (selectedTicketType !== 'all') {
        const matchId = String(ticket.ticket_type_id) === String(selectedTicketType);
        const matchName =
          ticket.ticket_type_name &&
          selectedTicketTypeName &&
          ticket.ticket_type_name.toLowerCase().trim() === selectedTicketTypeName.toLowerCase().trim();
        if (!matchId && !matchName) return false;
      }

      // 2. Visibility filter ("all", "raised by me", "Assign to me")
      if (selectedVisibility === 'raised_by_me') {
        const isCreatorId = currentUserId != null && String(ticket.created_by) === String(currentUserId);
        const isCreatorName =
          currentUserName &&
          ticket.creator_name &&
          ticket.creator_name.toLowerCase().trim() === currentUserName;
        if (!isCreatorId && !isCreatorName) return false;
      } else if (selectedVisibility === 'assigned_to_me') {
        const isAssignedId =
          (Array.isArray(ticket.assigned_to) &&
            currentUserId != null &&
            ticket.assigned_to.some((aid: any) => String(aid) === String(currentUserId))) ||
          (Array.isArray(ticket.assigned_users) &&
            currentUserId != null &&
            ticket.assigned_users.some((u: any) => String(u.id) === String(currentUserId)));

        const isAssignedName =
          currentUserName &&
          ticket.assigned_user_names &&
          ticket.assigned_user_names
            .toLowerCase()
            .split(',')
            .map((s) => s.trim())
            .includes(currentUserName);

        if (!isAssignedId && !isAssignedName) return false;
      }

      return true;
    });
  }, [tickets, selectedTicketType, selectedTicketTypeName, selectedVisibility, currentUserId, currentUserName]);

  // Open Filter Modal
  const openFilterModal = () => {
    setTempTicketType(selectedTicketType);
    setTempVisibility(selectedVisibility);
    setTicketTypeDropdownOpen(false);
    setVisibilityDropdownOpen(false);
    setIsFilterModalVisible(true);
  };

  // Apply Filter
  const handleApplyFilter = () => {
    const changedType = tempTicketType !== selectedTicketType;
    setSelectedTicketType(tempTicketType);
    setSelectedVisibility(tempVisibility);
    setIsFilterModalVisible(false);
    if (changedType) {
      fetchTickets(false, tempTicketType);
    }
  };

  // Reset Filter
  const handleResetFilter = () => {
    const hadType = selectedTicketType !== 'all';
    setTempTicketType('all');
    setTempVisibility('all');
    setSelectedTicketType('all');
    setSelectedVisibility('all');
    setTicketTypeDropdownOpen(false);
    setVisibilityDropdownOpen(false);
    setIsFilterModalVisible(false);
    if (hadType) {
      fetchTickets(false, 'all');
    }
  };

  // Remove individual filter chip
  const handleRemoveFilter = (filterKey: 'type' | 'visibility') => {
    if (filterKey === 'type') {
      setSelectedTicketType('all');
      setTempTicketType('all');
      fetchTickets(false, 'all');
    } else {
      setSelectedVisibility('all');
      setTempVisibility('all');
    }
  };

  /**
   * Helper to verify if the currently logged-in user is an assigned resolver or admin
   */
  const isAssignedResolver = (ticket: TicketItem): boolean => {
    if (ticket.permissions?.canComplete) return true;
    if (!user) return false;

    const currentRole = ((user as any).role || '').toLowerCase();
    const isAdmin = currentRole === 'admin' || currentRole === 'super admin';
    if (isAdmin) return true;

    // Check if currentUserId is inside assigned_to array [9, ...]
    if (Array.isArray(ticket.assigned_to) && currentUserId != null) {
      if (ticket.assigned_to.some((aid: any) => String(aid) === String(currentUserId))) {
        return true;
      }
    }

    // Check if current user is in assigned_users array
    if (Array.isArray(ticket.assigned_users) && currentUserId != null) {
      if (ticket.assigned_users.some((u: any) => String(u.id) === String(currentUserId))) {
        return true;
      }
    }

    // Check if user's name is in assigned_user_names string (e.g. "neha")
    if (currentUserName && ticket.assigned_user_names) {
      const names = ticket.assigned_user_names.toLowerCase().split(',').map((s) => s.trim());
      if (names.includes(currentUserName)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Fetches ticket counts for Active and History tabs
   */
  const fetchCounts = async () => {
    try {
      const statsRes = await getTicketStatsApi();
      if (statsRes && statsRes.success && statsRes.data) {
        setTicketCounts({
          active: Number(statsRes.data.active_count) || 0,
          history: Number(statsRes.data.history_count) || 0,
        });
      }
    } catch (err) {
      console.warn('[AllTickets] Error fetching ticket counts:', err);
    }
  };

  /**
   * Fetches tickets list and details for each ticket using GET /v1/api/tickets/details/:id
   */
  const fetchTickets = async (isRefresh = false, overrideTicketTypeId?: string) => {
    if (!isRefresh) setLoading(true);
    fetchCounts();
    try {
      const typeId = overrideTicketTypeId !== undefined ? overrideTicketTypeId : selectedTicketType;
      // 1. Fetch tickets list
      const response = await getTicketsListApi({
        tab: activeTab,
        search: searchQuery.trim() || undefined,
        ticket_type_id: typeId !== 'all' ? typeId : undefined,
      });

      let rawList: TicketItem[] = [];
      if (response && response.success && Array.isArray(response.data)) {
        rawList = response.data;
      } else if (Array.isArray(response as any)) {
        rawList = response as any;
      }

      if (rawList.length > 0) {
        // 2. Fetch full details for each ticket using GET /v1/api/tickets/details/:id
        const detailedTickets = await Promise.all(
          rawList.map(async (item) => {
            try {
              const detailsRes = await getTicketDetailsApi(item.id);
              if (detailsRes && detailsRes.success && detailsRes.data) {
                return {
                  ...item,
                  ...detailsRes.data,
                };
              }
            } catch (err) {
              console.warn(`[AllTickets] Failed to fetch details for ticket ${item.id}:`, err);
            }
            return item;
          })
        );
        setTickets(detailedTickets);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.warn('Error fetching tickets:', err);
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when tab or screen focus changes
  useFocusEffect(
    useCallback(() => {
      fetchTickets();
    }, [activeTab])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets(true);
  };

  const handleSearch = () => {
    fetchTickets();
  };

  const handleBack = () => {
    if (navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation && navigation.navigate) {
      try {
        navigation.navigate('Support');
      } catch (e) {
        navigation.navigate('Home', { screen: 'Dashboard' });
      }
    }
  };

  const handleGoToRaise = () => {
    try {
      navigation.navigate('RaiseTicketScreen');
    } catch (e) {
      navigation.navigate('RaiseTicket');
    }
  };

  /**
   * Submits a reply / message / remark to POST /v1/api/tickets/remark/:id
   */
  const handleSendRemark = async (ticketId: number) => {
    const text = (cardReplyTexts[ticketId] || '').trim();

    if (!text) {
      setCardReplyErrors((prev) => ({ ...prev, [ticketId]: 'Please enter a remark or message.' }));
      return;
    }

    setCardSubmitting((prev) => ({ ...prev, [ticketId]: true }));
    setCardReplyErrors((prev) => ({ ...prev, [ticketId]: '' }));

    try {
      const res = await addTicketRemarkApi(ticketId, text);
      if (res && res.success) {
        // Clear input text
        setCardReplyTexts((prev) => ({ ...prev, [ticketId]: '' }));

        // Updated thread from response or by refetching details
        let updatedThread = res.data;
        if (!updatedThread) {
          const freshDetails = await getTicketDetailsApi(ticketId);
          if (freshDetails && freshDetails.data) {
            updatedThread = freshDetails.data.remarks_thread;
          }
        }

        // Update tickets in state
        setTickets((prevTickets) =>
          prevTickets.map((t) => {
            if (t.id === ticketId) {
              return {
                ...t,
                remarks_thread: updatedThread || t.remarks_thread,
              };
            }
            return t;
          })
        );
      } else {
        const errMsg = res?.message || 'Failed to submit remark.';
        setCardReplyErrors((prev) => ({ ...prev, [ticketId]: errMsg }));
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Network error while adding remark.';
      setCardReplyErrors((prev) => ({ ...prev, [ticketId]: errMsg }));
    } finally {
      setCardSubmitting((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  /**
   * Submits ticket completion to PUT /v1/api/tickets/complete/:id
   */
  const handleConfirmComplete = async () => {
    if (!ticketToComplete) return;

    setCompletingLoading(true);
    setCompleteError('');

    try {
      const res = await completeTicketApi(ticketToComplete.id, resolutionRemark);
      if (res && res.success) {
        setTicketToComplete(null);
        setResolutionRemark('');

        // Re-fetch tickets so completed ticket moves to History
        fetchTickets(true);
      } else {
        setCompleteError(res?.message || 'Failed to complete ticket.');
      }
    } catch (err: any) {
      setCompleteError(err?.message || 'Network error while completing ticket.');
    } finally {
      setCompletingLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const resolveImageUrl = (url: string) => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (!trimmed) return '';

    // Determine local development backend base URL
    const defaultHost = Platform.OS === 'android' ? 'http://10.0.2.2:5005' : 'http://localhost:5005';
    const apiHost = BASE_URL ? BASE_URL.replace(/\/v1\/api\/?$/, '') : defaultHost;
    const isLocalDev =
      BASE_URL.includes('10.0.2.2') ||
      BASE_URL.includes('localhost') ||
      BASE_URL.includes('127.0.0.1');

    // 1. If in local dev and URL points to remote interlink domain, rewrite to local backend
    if (isLocalDev && trimmed.includes('interlink.jasminmobile.com/uploads/')) {
      const filename = trimmed.split('/uploads/').pop();
      return `${apiHost}/uploads/${filename}`;
    }

    // 2. If Android emulator and URL points to localhost or 127.0.0.1, rewrite to 10.0.2.2
    if (Platform.OS === 'android') {
      if (trimmed.includes('localhost:5005')) {
        return trimmed.replace('localhost:5005', '10.0.2.2:5005');
      }
      if (trimmed.includes('127.0.0.1:5005')) {
        return trimmed.replace('127.0.0.1:5005', '10.0.2.2:5005');
      }
    }

    // 3. If it's already a full valid HTTP/HTTPS URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    // 4. If it's a relative path starting with /uploads
    if (trimmed.startsWith('/uploads/')) {
      return `${apiHost}${trimmed}`;
    }

    if (trimmed.startsWith('/')) {
      return `${apiHost}/uploads${trimmed}`;
    }

    // 5. If raw filename like "images-1790160386271-845712404.webp"
    return `${apiHost}/uploads/${trimmed}`;
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || 'OPEN').toUpperCase();
    switch (s) {
      case 'COMPLETED':
        return { bg: '#DCFCE7', text: '#15803D', label: 'Completed' };
      case 'IN_PROGRESS':
        return { bg: '#E0F2FE', text: '#0369A1', label: 'In Progress' };
      case 'OPEN':
      default:
        return { bg: '#FEF3C7', text: '#B45309', label: 'Open' };
    }
  };

  const renderTicketCard = ({ item }: { item: TicketItem }) => {
    const statusInfo = getStatusBadge(item.status);
    const isActive = (item.status || 'OPEN').toUpperCase() !== 'COMPLETED';
    const canComplete = isActive && isAssignedResolver(item);

    // Extract attached images (from GET /v1/api/tickets/details/:id or item.images)
    const ticketImages: string[] = (
      item.image_urls && item.image_urls.length > 0
        ? item.image_urls
        : Array.isArray(item.images)
        ? item.images
        : []
    )
      .map((url) => resolveImageUrl(String(url)))
      .filter((url) => Boolean(url));

    // Extract remarks
    const initialRemark =
      item.remarks || (item as any).remark || (item as any).resolution_remark;
    const thread = item.remarks_thread || [];

    // Resolvers list text
    const resolversText =
      item.assigned_user_names ||
      (item.assigned_users && item.assigned_users.length > 0
        ? item.assigned_users.map((u) => u.name).join(', ')
        : 'Unassigned');

    return (
      <View style={styles.card}>
        {/* Top Header: Ticket Number & Status Pill */}
        <View style={styles.cardHeader}>
          <View style={styles.ticketNoBadge}>
            <Text style={styles.ticketNoText}>{item.ticket_no || `#TK-${item.id}`}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.text }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Category: Ticket Type > Sub Ticket Type */}
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>
            {item.ticket_type_name || 'General'}
            {item.sub_ticket_type_name ? ` › ${item.sub_ticket_type_name}` : ''}
          </Text>
        </View>

        {/* Raised By and Assign Resolvers */}
        <View style={styles.peopleMetaContainer}>
          <View style={styles.peopleMetaRow}>
            <Text style={styles.peopleMetaLabel}>Raised by:</Text>
            <Text style={styles.peopleMetaValue} numberOfLines={1}>
              {item.creator_name || 'Admin User'}
            </Text>
          </View>
          <View style={styles.peopleMetaRow}>
            <Text style={styles.peopleMetaLabel}>Assign resolvers:</Text>
            <Text
              style={[
                styles.peopleMetaValue,
                resolversText === 'Unassigned' && styles.unassignedText,
              ]}
              numberOfLines={1}
            >
              {resolversText}
            </Text>
          </View>
          <View style={styles.peopleMetaRow}>
            <Text style={styles.peopleMetaLabel}>Created Date:</Text>
            <Text style={styles.peopleMetaDate}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>

        {/* Subject */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Subject:</Text>
          <Text style={styles.fieldValueSubject} selectable={true}>
            {item.title}
          </Text>
        </View>

        {/* Description */}
        {item.description ? (
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Description:</Text>
            <Text style={styles.fieldValueDesc} selectable={true}>
              {item.description}
            </Text>
          </View>
        ) : null}

        {/* Attached Images (Small Thumbnails - click shows image only full screen) */}
        {ticketImages.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.fieldLabel}>Attached Images ({ticketImages.length}):</Text>
            <View style={styles.imagesRow}>
              {ticketImages.map((uri, idx) => (
                <TouchableOpacity
                  key={`${item.id}_img_${idx}`}
                  style={styles.imageThumbContainer}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPreviewImage(uri)}
                >
                  <Image
                    source={{ uri }}
                    style={styles.cardImageThumb}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Remarks & Active Logs Collapsible Section */}
        {(isActive || (!isActive && initialRemark) || thread.length > 0) && (
          <View style={styles.remarksContainer}>
            <TouchableOpacity
              style={styles.remarksToggleHeader}
              activeOpacity={0.7}
              onPress={() => toggleRemarks(item.id)}
            >
              <Text style={styles.remarksToggleLabel}>
                Remarks & Activity Logs ({thread.length})
              </Text>
              <View style={styles.collapseArrowBtn}>
                <Text style={styles.collapseArrowText}>
                  {expandedRemarks[item.id] ? '▲' : '▼'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Content shown only when arrow is clicked / open */}
            {expandedRemarks[item.id] && (
              <View style={styles.remarksExpandedContent}>
                {/* In History tab, show final / resolution remark if present */}
                {!isActive && initialRemark ? (
                  <View style={styles.initialRemarkBox}>
                    <View style={styles.remarkBoxHeader}>
                      <Text style={styles.initialRemarkTitle}>Resolution Remark</Text>
                    </View>
                    <Text style={styles.initialRemarkText} selectable={true}>
                      {initialRemark}
                    </Text>
                  </View>
                ) : null}

                {/* ALL Activity / Remarks Thread Entries */}
                {thread.map((rt: RemarkThreadItem, rtIdx: number) => (
                  <View key={`card_rt_${rt.id || rtIdx}`} style={styles.threadItemCard}>
                    <View style={styles.threadItemHeader}>
                      <View style={styles.threadItemAuthorRow}>
                        <Text style={styles.threadItemUser}>{rt.user_name || 'User'}</Text>
                        {/* {rt.action_type && (
                          <View style={styles.actionTypeBadge}>
                            <Text style={styles.actionTypeText}>{rt.action_type}</Text>
                          </View>
                        )} */}
                      </View>
                      <Text style={styles.threadItemTime}>{formatDate(rt.created_at)}</Text>
                    </View>
                    <Text style={styles.threadItemRemark} selectable={true}>
                      {rt.remark}
                    </Text>
                  </View>
                ))}

                {/* Reply / Add Remark TextInput - inside remarks & active logs */}
                {isActive && (
                  <View style={styles.cardReplyBox}>
                    <Text style={styles.replyInnerLabel}>Reply / Add Remark:</Text>
                    <View style={styles.cardReplyInputRow}>
                      <TextInput
                        style={styles.cardReplyInput}
                        placeholder="Reply / Add message / remark..."
                        placeholderTextColor="#94A3B8"
                        value={cardReplyTexts[item.id] || ''}
                        onChangeText={(val) => {
                          setCardReplyTexts((prev) => ({ ...prev, [item.id]: val }));
                          if (cardReplyErrors[item.id]) {
                            setCardReplyErrors((prev) => ({ ...prev, [item.id]: '' }));
                          }
                        }}
                      />
                      <TouchableOpacity
                        style={[
                          styles.cardReplySendBtn,
                          !(cardReplyTexts[item.id] || '').trim() && styles.replySendBtnDisabled,
                        ]}
                        activeOpacity={0.8}
                        disabled={cardSubmitting[item.id]}
                        onPress={() => handleSendRemark(item.id)}
                      >
                        {cardSubmitting[item.id] ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <Text style={styles.cardReplySendBtnText}>Send</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    {cardReplyErrors[item.id] ? (
                      <Text style={styles.replyErrorText}>{cardReplyErrors[item.id]}</Text>
                    ) : null}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Mark as Completed Button if available for assigned resolver */}
        {canComplete && (
          <TouchableOpacity
            style={styles.markCompletedBtn}
            activeOpacity={0.85}
            onPress={() => {
              setTicketToComplete(item);
              setResolutionRemark('');
              setCompleteError('');
            }}
          >
            <Text style={styles.markCompletedBtnText}>✓ Mark as Completed</Text>
          </TouchableOpacity>
        )}

        {/* Completed Status Banner for History Tickets */}
        {!isActive && (
          <View style={styles.completedBadgeBox}>
            <Text style={styles.completedBadgeText}>
              ✅ Ticket Completed
              {item.completed_at ? ` on ${formatDate(item.completed_at)}` : ''}
              {item.completed_by_name ? ` by ${item.completed_by_name}` : ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
      <Header
        title="All Tickets"
        showBack={true}
        onBackPress={handleBack}
        style={styles.headerStyle}
        titleStyle={styles.headerTitleStyle}
        iconColor={colors.white}
        rightComponent={
          <TouchableOpacity
            style={styles.raiseHeaderBtn}
            activeOpacity={0.8}
            onPress={handleGoToRaise}
          >
            <Text style={styles.raiseHeaderBtnText}>+ Raise</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.mainContainer}>
        {/* Tab Buttons (Active / History) */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
            activeOpacity={0.75}
            onPress={() => setActiveTab('active')}
          >
            <View style={styles.tabContentRow}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'active' && styles.tabBtnTextActive,
                ]}
              >
                Active Tickets
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  activeTab === 'active'
                    ? styles.tabCountBadgeActive
                    : styles.tabCountBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    activeTab === 'active'
                      ? styles.tabCountTextActive
                      : styles.tabCountTextInactive,
                  ]}
                >
                  {ticketCounts.active}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
            activeOpacity={0.75}
            onPress={() => setActiveTab('history')}
          >
            <View style={styles.tabContentRow}>
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'history' && styles.tabBtnTextActive,
                ]}
              >
                History
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  activeTab === 'history'
                    ? styles.tabCountBadgeActive
                    : styles.tabCountBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    activeTab === 'history'
                      ? styles.tabCountTextActive
                      : styles.tabCountTextInactive,
                  ]}
                >
                  {ticketCounts.history}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Input Bar & Filter Icon */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ticket no, title..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => {
                  setSearchQuery('');
                  setTimeout(() => fetchTickets(), 50);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.searchActionBtn}
            activeOpacity={0.8}
            onPress={handleSearch}
          >
            <Text style={styles.searchActionBtnText}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterActionBtn,
              hasActiveFilter && styles.filterActionBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={openFilterModal}
          >
            <Image
              source={Images.filter}
              style={[
                styles.filterActionIcon,
                hasActiveFilter && styles.filterActionIconActive,
              ]}
              resizeMode="contain"
            />
            {hasActiveFilter && <View style={styles.filterDotBadge} />}
          </TouchableOpacity>
        </View>

        {/* Active Filter Badges / Chips */}
        {hasActiveFilter && (
          <View style={styles.activeFiltersContainer}>
            {selectedTicketType !== 'all' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipLabel}>Type:</Text>
                <Text style={styles.filterChipValue} numberOfLines={1}>
                  {selectedTicketTypeName}
                </Text>
                <TouchableOpacity
                  style={styles.filterChipClose}
                  onPress={() => handleRemoveFilter('type')}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.filterChipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedVisibility !== 'all' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipLabel}>Visible:</Text>
                <Text style={styles.filterChipValue}>
                  {selectedVisibility === 'raised_by_me' ? 'Raised by me' : 'Assign to me'}
                </Text>
                <TouchableOpacity
                  style={styles.filterChipClose}
                  onPress={() => handleRemoveFilter('visibility')}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.filterChipCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.resetChipsBtn}
              onPress={handleResetFilter}
              activeOpacity={0.7}
            >
              <Text style={styles.resetChipsText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tickets List */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading tickets...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTickets}
            keyExtractor={(item) => String(item.id || item.ticket_no)}
            renderItem={renderTicketCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No Tickets Found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery || hasActiveFilter
                    ? `No tickets match your search or filter criteria in ${activeTab}.`
                    : `There are currently no ${activeTab} support tickets.`}
                </Text>
                {hasActiveFilter ? (
                  <TouchableOpacity
                    style={styles.emptyRaiseBtn}
                    activeOpacity={0.8}
                    onPress={handleResetFilter}
                  >
                    <Text style={styles.emptyRaiseBtnText}>Reset Filters</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.emptyRaiseBtn}
                    activeOpacity={0.8}
                    onPress={handleGoToRaise}
                  >
                    <Text style={styles.emptyRaiseBtnText}>+ Raise New Ticket</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* Mark as Completed Dialog Modal (PUT /v1/api/tickets/complete/:id) */}
      <Modal
        visible={!!ticketToComplete}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!completingLoading) setTicketToComplete(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.completeModalOverlay}
        >
          <View style={styles.completeModalBox}>
            {/* Header */}
            <View style={styles.completeModalHeader}>
              <View style={styles.completeModalTitleRow}>
                <Text style={styles.completeModalIcon}>✅</Text>
                <Text style={styles.completeModalTitle}>Mark as Completed</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!completingLoading) setTicketToComplete(null);
                }}
                disabled={completingLoading}
              >
                <Text style={styles.completeCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.completeTicketSubtitle}>
              Ticket: <Text style={styles.completeTicketBold}>{ticketToComplete?.ticket_no || `#TK-${ticketToComplete?.id}`}</Text>
            </Text>
            <Text style={styles.completeTicketTitleText} numberOfLines={2}>
              {ticketToComplete?.title}
            </Text>

            {/* Resolution Remark (Optional) TextInput */}
            <View style={styles.completeInputGroup}>
              <Text style={styles.completeInputLabel}>
                Resolution Remark <Text style={styles.optionalText}>(Optional)</Text>
              </Text>
              <TextInput
                style={styles.completeTextInput}
                placeholder="Port reconfigured and test slip printed successfully."
                placeholderTextColor="#94A3B8"
                value={resolutionRemark}
                onChangeText={setResolutionRemark}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {completeError ? (
              <Text style={styles.completeErrorText}>{completeError}</Text>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.completeModalActions}>
              <TouchableOpacity
                style={styles.completeCancelBtn}
                activeOpacity={0.8}
                disabled={completingLoading}
                onPress={() => setTicketToComplete(null)}
              >
                <Text style={styles.completeCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.completeConfirmBtn}
                activeOpacity={0.8}
                disabled={completingLoading}
                onPress={handleConfirmComplete}
              >
                {completingLoading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.completeConfirmBtnText}>Mark as Completed</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full-Screen Image Viewer Modal (Shows ONLY the clicked Image) */}
      <Modal
        visible={!!selectedPreviewImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPreviewImage(null)}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={styles.fullScreenModalOverlay}>
          {/* Close button in top-right corner */}
          <TouchableOpacity
            style={styles.fullScreenCloseBtn}
            activeOpacity={0.8}
            onPress={() => setSelectedPreviewImage(null)}
          >
            <Text style={styles.fullScreenCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Full Screen Image Only */}
          {selectedPreviewImage ? (
            <TouchableOpacity
              activeOpacity={1}
              style={styles.fullScreenImageTouch}
              onPress={() => setSelectedPreviewImage(null)}
            >
              <Image
                source={{ uri: selectedPreviewImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </Modal>

      {/* Filter Modal with Ticket Types & Visibility Dropdowns */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterModalVisible(false)}
        >
          <View
            style={styles.filterModalBox}
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.filterModalHeader}>
              <View style={styles.filterModalTitleRow}>
                <Image
                  source={Images.filter}
                  style={styles.filterModalHeaderIcon}
                  resizeMode="contain"
                />
                <Text style={styles.filterModalTitle}>Filter Tickets</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.filterModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.filterModalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* 1. Ticket Types Dropdown (default "all") */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>Ticket Type</Text>
                <TouchableOpacity
                  style={[
                    styles.filterDropdownSelector,
                    ticketTypeDropdownOpen && styles.filterDropdownSelectorOpen,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setTicketTypeDropdownOpen(!ticketTypeDropdownOpen);
                    setVisibilityDropdownOpen(false);
                  }}
                >
                  <Text style={styles.filterDropdownSelectedText}>
                    {tempTicketType === 'all'
                      ? 'All'
                      : ticketTypes.find((t) => String(t.id) === String(tempTicketType))?.name || 'All'}
                  </Text>
                  <Text style={styles.filterDropdownArrow}>
                    {ticketTypeDropdownOpen ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {ticketTypeDropdownOpen && (
                  <View style={styles.filterDropdownMenu}>
                    <ScrollView
                      style={styles.filterDropdownScroll}
                      nestedScrollEnabled={true}
                    >
                      {/* Default "all" option */}
                      <TouchableOpacity
                        style={[
                          styles.filterDropdownItem,
                          tempTicketType === 'all' && styles.filterDropdownItemSelected,
                        ]}
                        onPress={() => {
                          setTempTicketType('all');
                          setTicketTypeDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.filterDropdownItemText,
                            tempTicketType === 'all' && styles.filterDropdownItemTextSelected,
                          ]}
                        >
                          All
                        </Text>
                        {tempTicketType === 'all' && (
                          <Text style={styles.filterDropdownItemCheck}>✓</Text>
                        )}
                      </TouchableOpacity>

                      {/* Ticket types options from API */}
                      {ticketTypes.map((item) => {
                        const isSelected = String(tempTicketType) === String(item.id);
                        return (
                          <TouchableOpacity
                            key={String(item.id)}
                            style={[
                              styles.filterDropdownItem,
                              isSelected && styles.filterDropdownItemSelected,
                            ]}
                            onPress={() => {
                              setTempTicketType(String(item.id));
                              setTicketTypeDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.filterDropdownItemText,
                                isSelected && styles.filterDropdownItemTextSelected,
                              ]}
                            >
                              {item.name}
                            </Text>
                            {isSelected && (
                              <Text style={styles.filterDropdownItemCheck}>✓</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* 2. Visibility Dropdown (default "all", "raised by me", "Assign to me") */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>Visibility</Text>
                <TouchableOpacity
                  style={[
                    styles.filterDropdownSelector,
                    visibilityDropdownOpen && styles.filterDropdownSelectorOpen,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setVisibilityDropdownOpen(!visibilityDropdownOpen);
                    setTicketTypeDropdownOpen(false);
                  }}
                >
                  <Text style={styles.filterDropdownSelectedText}>
                    {tempVisibility === 'all'
                      ? 'All'
                      : tempVisibility === 'raised_by_me'
                      ? 'Raised by me'
                      : 'Assign to me'}
                  </Text>
                  <Text style={styles.filterDropdownArrow}>
                    {visibilityDropdownOpen ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {visibilityDropdownOpen && (
                  <View style={styles.filterDropdownMenu}>
                    {/* Option: all */}
                    <TouchableOpacity
                      style={[
                        styles.filterDropdownItem,
                        tempVisibility === 'all' && styles.filterDropdownItemSelected,
                      ]}
                      onPress={() => {
                        setTempVisibility('all');
                        setVisibilityDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterDropdownItemText,
                          tempVisibility === 'all' && styles.filterDropdownItemTextSelected,
                        ]}
                      >
                        All
                      </Text>
                      {tempVisibility === 'all' && (
                        <Text style={styles.filterDropdownItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>

                    {/* Option: raised by me */}
                    <TouchableOpacity
                      style={[
                        styles.filterDropdownItem,
                        tempVisibility === 'raised_by_me' && styles.filterDropdownItemSelected,
                      ]}
                      onPress={() => {
                        setTempVisibility('raised_by_me');
                        setVisibilityDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterDropdownItemText,
                          tempVisibility === 'raised_by_me' && styles.filterDropdownItemTextSelected,
                        ]}
                      >
                        Raised by me
                      </Text>
                      {tempVisibility === 'raised_by_me' && (
                        <Text style={styles.filterDropdownItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>

                    {/* Option: Assign to me */}
                    <TouchableOpacity
                      style={[
                        styles.filterDropdownItem,
                        tempVisibility === 'assigned_to_me' && styles.filterDropdownItemSelected,
                      ]}
                      onPress={() => {
                        setTempVisibility('assigned_to_me');
                        setVisibilityDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.filterDropdownItemText,
                          tempVisibility === 'assigned_to_me' && styles.filterDropdownItemTextSelected,
                        ]}
                      >
                        Assign to me
                      </Text>
                      {tempVisibility === 'assigned_to_me' && (
                        <Text style={styles.filterDropdownItemCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.filterResetBtn}
                onPress={handleResetFilter}
                activeOpacity={0.7}
              >
                <Text style={styles.filterResetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={handleApplyFilter}
                activeOpacity={0.8}
              >
                <Text style={styles.filterApplyBtnText}>Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  headerStyle: {
    backgroundColor: colors.primary,
    borderBottomWidth: 0,
  },
  headerTitleStyle: {
    color: colors.white,
    fontSize: 18,
    fontFamily: fontFamily.bold,
  },
  raiseHeaderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    marginRight: 6,
  },
  raiseHeaderBtnText: {
    color: colors.white,
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
  },

  /* Main Container */
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    overflow: 'hidden',
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
  },
  tabBtnTextActive: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  tabCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountBadgeActive: {
    backgroundColor: '#EDE9FE',
  },
  tabCountBadgeInactive: {
    backgroundColor: '#CBD5E1',
  },
  tabCountText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  tabCountTextActive: {
    color: '#7C3AED',
  },
  tabCountTextInactive: {
    color: '#475569',
  },

  /* Search Bar & Filter */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchInputWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingLeft: 12,
    paddingRight: 32,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 8,
    padding: 6,
    zIndex: 1,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  searchActionBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchActionBtnText: {
    color: colors.white,
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
  },
  filterActionBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    width: 38,
    height: 38,
    borderRadius: 10,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterActionBtnActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#7C3AED',
  },
  filterActionIcon: {
    width: 17,
    height: 17,
    tintColor: '#475569',
  },
  filterActionIconActive: {
    tintColor: '#7C3AED',
  },
  filterDotBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },

  /* Active Filters Badges */
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  filterChipLabel: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
  },
  filterChipValue: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: '#5B21B6',
    maxWidth: 120,
  },
  filterChipClose: {
    marginLeft: 2,
    padding: 1,
  },
  filterChipCloseText: {
    fontSize: 10,
    color: '#7C3AED',
    fontFamily: fontFamily.bold,
  },
  resetChipsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resetChipsText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#EF4444',
  },

  /* List & Cards */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketNoBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ticketNoText: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
  categoryRow: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  /* Raised By & Assign Resolvers */
  peopleMetaContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 4,
  },
  peopleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peopleMetaLabel: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#475569',
    width: 125,
  },
  peopleMetaValue: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    flex: 1,
  },
  peopleMetaDate: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    flex: 1,
  },
  unassignedText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  /* Subject & Description Sections */
  fieldSection: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#475569',
    marginBottom: 3,
  },
  fieldValueSubject: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
    lineHeight: 19,
  },
  fieldValueDesc: {
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#334155',
    lineHeight: 18,
  },

  /* Attached Images - Small Size */
  imagesSection: {
    marginBottom: 12,
  },
  imagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  imageThumbContainer: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  cardImageThumb: {
    width: '100%',
    height: '100%',
  },

  /* Remarks & Activity Logs Section */
  remarksContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  remarksToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remarksToggleLabel: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },
  collapseArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapseArrowText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
  },
  remarksExpandedContent: {
    marginTop: 8,
  },
  initialRemarkBox: {
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  remarkBoxHeader: {
    marginBottom: 2,
  },
  initialRemarkTitle: {
    fontSize: 10.5,
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
    textTransform: 'uppercase',
  },
  initialRemarkText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#1E293B',
    lineHeight: 16,
  },
  threadItemCard: {
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  threadItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  threadItemAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  threadItemUser: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#334155',
  },
  actionTypeBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  actionTypeText: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    color: '#0284C7',
  },
  threadItemTime: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
  },
  threadItemRemark: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: '#1E293B',
    lineHeight: 16,
  },

  /* Card Reply Box (Inside remarks & logs) */
  cardReplyBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  replyInnerLabel: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#475569',
    marginBottom: 4,
  },
  cardReplyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardReplyInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
  },
  cardReplySendBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 58,
  },
  cardReplySendBtnText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fontFamily.bold,
  },
  replySendBtnDisabled: {
    opacity: 0.5,
  },
  replyErrorText: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: fontFamily.regular,
    marginTop: 4,
  },

  /* Mark as Completed Button */
  markCompletedBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  markCompletedBtnText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: fontFamily.bold,
  },

  /* Completed Status Badge for History */
  completedBadgeBox: {
    backgroundColor: '#DCFCE7',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  completedBadgeText: {
    fontSize: 11.5,
    fontFamily: fontFamily.bold,
    color: '#15803D',
  },

  /* Mark as Completed Dialog Modal */
  completeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeModalBox: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  completeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  completeModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completeModalIcon: {
    fontSize: 18,
  },
  completeModalTitle: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: '#0F172A',
  },
  completeCloseText: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: '#64748B',
    padding: 4,
  },
  completeTicketSubtitle: {
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    marginBottom: 2,
  },
  completeTicketBold: {
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
  },
  completeTicketTitleText: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginBottom: 14,
  },
  completeInputGroup: {
    marginBottom: 14,
  },
  completeInputLabel: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: '#475569',
    marginBottom: 6,
  },
  optionalText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: '#94A3B8',
  },
  completeTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#0F172A',
    minHeight: 80,
  },
  completeErrorText: {
    fontSize: 11.5,
    color: '#EF4444',
    fontFamily: fontFamily.regular,
    marginBottom: 12,
  },
  completeModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  completeCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeCancelBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: '#475569',
  },
  completeConfirmBtn: {
    flex: 1.5,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeConfirmBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },

  /* Full Screen Image Modal (ONLY Image is shown) */
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 25,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fullScreenCloseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: fontFamily.bold,
  },
  fullScreenImageTouch: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '90%',
  },

  /* Empty & Loading States */
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyRaiseBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyRaiseBtnText: {
    color: colors.white,
    fontSize: 13.5,
    fontFamily: fontFamily.bold,
  },

  /* Filter Modal */
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterModalBox: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterModalHeaderIcon: {
    width: 18,
    height: 18,
    tintColor: '#7C3AED',
  },
  filterModalTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: '#1E293B',
  },
  filterModalCloseText: {
    fontSize: 16,
    color: '#94A3B8',
    fontFamily: fontFamily.bold,
    padding: 4,
  },
  filterModalBody: {
    marginVertical: 14,
  },
  filterSection: {
    marginBottom: 14,
  },
  filterSectionLabel: {
    fontSize: 12.5,
    fontFamily: fontFamily.bold,
    color: '#475569',
    marginBottom: 6,
  },
  filterDropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterDropdownSelectorOpen: {
    borderColor: '#7C3AED',
    backgroundColor: colors.white,
  },
  filterDropdownSelectedText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#1E293B',
  },
  filterDropdownArrow: {
    fontSize: 11,
    color: '#7C3AED',
    fontFamily: fontFamily.bold,
  },
  filterDropdownMenu: {
    marginTop: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filterDropdownScroll: {
    maxHeight: 160,
  },
  filterDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  filterDropdownItemSelected: {
    backgroundColor: '#F5F3FF',
  },
  filterDropdownItemText: {
    fontSize: 12.5,
    fontFamily: fontFamily.regular,
    color: '#334155',
  },
  filterDropdownItemTextSelected: {
    fontFamily: fontFamily.bold,
    color: '#7C3AED',
  },
  filterDropdownItemCheck: {
    fontSize: 13,
    color: '#7C3AED',
    fontFamily: fontFamily.bold,
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  filterResetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterResetBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: '#475569',
  },
  filterApplyBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterApplyBtnText: {
    fontSize: 13,
    fontFamily: fontFamily.bold,
    color: colors.white,
  },
});

export default AllTicketsScreen;
