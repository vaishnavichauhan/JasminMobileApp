import { API_ENDPOINTS } from './config';
import { fetchWithAuth } from './apiClient';

export interface TicketTypeItem {
  id: number;
  name: string;
}

export interface SubTicketTypeItem {
  id: number;
  ticket_type_id: number;
  name: string;
  ticket_type_name?: string;
  assigned_to?: number[];
  assigned_names?: string;
  remark?: string;
}

export interface TicketFormOptionsResponse {
  ticket_types: TicketTypeItem[];
  sub_ticket_types: SubTicketTypeItem[];
}

/**
 * Fetches sub ticket types and ticket types for dropdown selection.
 * Primary endpoint requested: GET /v1/api/sub-ticket-types/all
 * Also enriches / falls back with form-options or ticket-types if available.
 */
export const getSubTicketTypesApi = async (): Promise<TicketFormOptionsResponse> => {
  let subTypes: SubTicketTypeItem[] = [];
  let types: TicketTypeItem[] = [];

  try {
    // 1. Primary: GET /v1/api/sub-ticket-types/all
    const response = await fetchWithAuth(API_ENDPOINTS.TICKETS.SUB_TICKET_TYPES_ALL);
    if (response.ok) {
      const json = await response.json();
      const rawData = json?.data || json;
      if (Array.isArray(rawData)) {
        subTypes = rawData.map((item: any) => ({
          id: Number(item.id),
          ticket_type_id: Number(item.ticket_type_id),
          name: String(item.name || ''),
          ticket_type_name: item.ticket_type_name || item.ticket_type?.name || '',
          assigned_to: Array.isArray(item.assigned_to) ? item.assigned_to : [],
          assigned_names: item.assigned_names || item.assigned_to_name || '',
          remark: item.remark !== undefined && item.remark !== null ? String(item.remark) : (item.remarks ? String(item.remarks) : ''),
        }));

        // Derive unique ticket types from sub-ticket types if provided with names
        const typeMap = new Map<number, string>();
        subTypes.forEach((st) => {
          if (st.ticket_type_id && !typeMap.has(st.ticket_type_id)) {
            typeMap.set(st.ticket_type_id, st.ticket_type_name || `Ticket Type ${st.ticket_type_id}`);
          }
        });

        types = Array.from(typeMap.entries()).map(([id, name]) => ({
          id,
          name,
        }));
      }
    }
  } catch (err) {
    console.warn('[TicketsApi] Failed to fetch sub-ticket-types/all:', err);
  }

  // 2. If ticket types are missing or empty, fetch from /tickets/form-options or /ticket-types/all
  if (types.length === 0 || subTypes.length === 0) {
    try {
      const formOptionsRes = await fetchWithAuth(API_ENDPOINTS.TICKETS.FORM_OPTIONS);
      if (formOptionsRes.ok) {
        const json = await formOptionsRes.json();
        if (json?.data) {
          if (types.length === 0 && Array.isArray(json.data.ticket_types)) {
            types = json.data.ticket_types.map((t: any) => ({
              id: Number(t.id),
              name: String(t.name || ''),
            }));
          }
          if (subTypes.length === 0 && Array.isArray(json.data.sub_ticket_types)) {
            subTypes = json.data.sub_ticket_types.map((st: any) => ({
              id: Number(st.id),
              ticket_type_id: Number(st.ticket_type_id),
              name: String(st.name || ''),
              ticket_type_name: st.ticket_type_name || '',
              assigned_to: st.assigned_to || [],
              assigned_names: st.assigned_names || '',
              remark: st.remark !== undefined && st.remark !== null ? String(st.remark) : (st.remarks ? String(st.remarks) : ''),
            }));
          }
        }
      }
    } catch (err) {
      console.warn('[TicketsApi] Failed to fetch form-options fallback:', err);
    }
  }

  // 3. If ticket types are still empty, try GET /ticket-types/all
  if (types.length === 0) {
    try {
      const typesRes = await fetchWithAuth(API_ENDPOINTS.TICKETS.TICKET_TYPES_ALL);
      if (typesRes.ok) {
        const json = await typesRes.json();
        const rawTypes = json?.data || json;
        if (Array.isArray(rawTypes)) {
          types = rawTypes.map((t: any) => ({
            id: Number(t.id),
            name: String(t.name || ''),
          }));
        }
      }
    } catch (err) {
      console.warn('[TicketsApi] Failed to fetch ticket-types/all:', err);
    }
  }

  // Re-map ticket type names onto subTypes if missing
  if (types.length > 0) {
    const typeNameMap = new Map<number, string>(types.map((t) => [t.id, t.name]));
    subTypes = subTypes.map((st) => ({
      ...st,
      ticket_type_name: st.ticket_type_name || typeNameMap.get(st.ticket_type_id) || '',
    }));
  }

  return {
    ticket_types: types,
    sub_ticket_types: subTypes,
  };
};

export interface CreateTicketResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Creates a support ticket with optional image attachments (up to 5 files).
 * Method: POST /v1/api/tickets/add
 * Content-Type: multipart/form-data
 */
export const createTicketApi = async (formData: FormData): Promise<CreateTicketResponse> => {
  try {
    const response = await fetchWithAuth(API_ENDPOINTS.TICKETS.ADD, {
      method: 'POST',
      body: formData,
    });

    const json = await response.json();
    return json;
  } catch (error: any) {
    console.error('[TicketsApi] Error creating ticket:', error);
    return {
      success: false,
      message: error?.message || 'Network error while submitting ticket.',
    };
  }
};

export interface RemarkThreadItem {
  id: number;
  user_id: number;
  user_name: string;
  remark: string;
  action_type: 'REMARK' | 'SHIFT' | 'COMPLETED' | string;
  created_at: string;
}

export interface TicketItem {
  id: number;
  ticket_no: string;
  ticket_type_id: number;
  ticket_type_name: string;
  sub_ticket_type_id: number;
  sub_ticket_type_name: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | string;
  assigned_to?: number[];
  assigned_users?: Array<{ id: number; name: string; username?: string; role_name?: string }>;
  assigned_user_names?: string;
  created_by?: number;
  creator_name?: string;
  images?: string[];
  image_urls?: string[];
  remarks?: string;
  remarks_thread?: RemarkThreadItem[];
  permissions?: {
    canAddRemark?: boolean;
    canShift?: boolean;
    canComplete?: boolean;
    isLocked?: boolean;
  };
  created_at: string;
  completed_at?: string;
  completed_by?: number;
  completed_by_name?: string;
}

export interface TicketListResponse {
  success: boolean;
  data: TicketItem[];
  userMeta?: {
    currentUserId?: number;
    isAdmin?: boolean;
    hasTicketManagement?: boolean;
  };
  message?: string;
}

/**
 * Fetches tickets list for active or history tabs.
 * Method: GET /v1/api/tickets/list
 */
export const getTicketsListApi = async (params?: {
  tab?: 'active' | 'history';
  search?: string;
  ticket_type_id?: number | string;
}): Promise<TicketListResponse> => {
  try {
    const query = new URLSearchParams();
    if (params?.tab) query.append('tab', params.tab);
    if (params?.search) query.append('search', params.search);
    if (params?.ticket_type_id) query.append('ticket_type_id', String(params.ticket_type_id));

    const url = `${API_ENDPOINTS.TICKETS.LIST}?${query.toString()}`;
    const response = await fetchWithAuth(url);
    const json = await response.json();
    console.log("jsonTicket", json);
    
    return json;
  } catch (error: any) {
    console.error('[TicketsApi] Error fetching tickets list:', error);
    return {
      success: false,
      data: [],
      message: error?.message || 'Failed to fetch tickets list',
    };
  }
};

export interface TicketDetailsResponse {
  success: boolean;
  data?: TicketItem & {
    remarks_thread?: RemarkThreadItem[];
    permissions?: {
      canAddRemark?: boolean;
      canShift?: boolean;
      canComplete?: boolean;
      isLocked?: boolean;
    };
  };
  message?: string;
}

/**
 * Fetches complete details, remarks thread, and image URLs for a specific ticket.
 * Method: GET /v1/api/tickets/details/:id
 */
export const getTicketDetailsApi = async (id: number | string): Promise<TicketDetailsResponse> => {
  try {
    const url = `${API_ENDPOINTS.TICKETS.DETAILS(id)}`;
    const response = await fetchWithAuth(url);
    const json = await response.json();
    return json;
  } catch (error: any) {
    console.error(`[TicketsApi] Error fetching ticket details for ID ${id}:`, error);
    return {
      success: false,
      message: error?.message || 'Failed to fetch ticket details',
    };
  }
};

export interface AddRemarkResponse {
  success: boolean;
  message?: string;
  data?: RemarkThreadItem[];
}

/**
 * Adds a remark / reply / message to an active ticket.
 * Method: POST /v1/api/tickets/remark/:id
 * Content-Type: application/json
 * Body: { remark: string }
 */
export const addTicketRemarkApi = async (
  ticketId: number | string,
  remark: string
): Promise<AddRemarkResponse> => {
  try {
    const url = API_ENDPOINTS.TICKETS.REMARK(ticketId);
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ remark: remark.trim() }),
    });

    const json = await response.json();
    return json;
  } catch (error: any) {
    console.error(`[TicketsApi] Error adding remark to ticket ${ticketId}:`, error);
    return {
      success: false,
      message: error?.message || 'Failed to submit remark.',
    };
  }
};

export interface CompleteTicketResponse {
  success: boolean;
  message?: string;
}

/**
 * Marks an active ticket as completed.
 * Method: PUT /v1/api/tickets/complete/:id
 * Content-Type: application/json
 * Body: { resolution_remark?: string }
 */
export const completeTicketApi = async (
  ticketId: number | string,
  resolutionRemark?: string
): Promise<CompleteTicketResponse> => {
  try {
    const url = API_ENDPOINTS.TICKETS.COMPLETE(ticketId);
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resolution_remark: resolutionRemark ? resolutionRemark.trim() : '',
      }),
    });

    const json = await response.json();
    return json;
  } catch (error: any) {
    console.error(`[TicketsApi] Error completing ticket ${ticketId}:`, error);
    return {
      success: false,
      message: error?.message || 'Failed to complete ticket.',
    };
  }
};

export interface TicketStatsData {
  total: number;
  active_count: number;
  history_count: number;
  assigned_to_me_active?: number;
}

export interface TicketStatsResponse {
  success: boolean;
  data?: TicketStatsData;
  message?: string;
}

/**
 * Fetches ticket stats (active count, history count, assigned to me count)
 * Method: GET /v1/api/tickets/stats
 */
export const getTicketStatsApi = async (): Promise<TicketStatsResponse> => {
  try {
    const url = API_ENDPOINTS.TICKETS.STATS;
    const response = await fetchWithAuth(url);
    if (!response.ok) {
      return {
        success: false,
        message: `Server returned status ${response.status}`,
      };
    }
    const json = await response.json();
    return json;
  } catch (error: any) {
    console.error('[TicketsApi] Error fetching ticket stats:', error);
    return {
      success: false,
      message: error?.message || 'Failed to fetch ticket stats',
    };
  }
};





