/**
 * Medora API Service
 * Centralized API calls using the base URL from .env
 */
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const TOKEN_KEY = 'medora_jwt_token';

// ─── Token Management ────────────────────────────────────────

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── Core Types ─────────────────────────────────────────────

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
};

// ─── Generic Request Helper ─────────────────────────────────

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  isMultipart = false
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = await getToken();

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  // Bypass ngrok browser warning which causes CORS/network failed errors
  headers['ngrok-skip-browser-warning'] = '69420';

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.detail || data?.message || `Request failed with status ${response.status}`,
        data,
      };
    }

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Network error. Please check your connection.',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. USER & AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

export type LoginPayload = {
  identifier: string; // username or email
  password: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  is_employee: boolean;
  has_employee_onboarded: boolean;
};

export async function loginUser(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
  return request<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type RegisterPayload = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
};

export async function registerUser(payload: RegisterPayload): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ═══════════════════════════════════════════════════════════════
// 2. WORKER ONBOARDING & PROFILES
// ═══════════════════════════════════════════════════════════════

export type OnboardPayload = {
  job_role: string;
  working_since: string;
  work_location: string;
  allergies: string;
  existing_conditions: string;
};

export async function makeEmployee(): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/make-employee', { method: 'POST' });
}

export async function onboardUser(payload: OnboardPayload): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/onboard', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProfile(payload: Partial<OnboardPayload>): Promise<ApiResponse<{ message: string }>> {
  return request<{ message: string }>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

// ═══════════════════════════════════════════════════════════════
// 4. PATIENT MEDICAL REPORTS CRUD
// ═══════════════════════════════════════════════════════════════

export type PatientReport = {
  id: number;
  report_type: string;
  report_name: string;
  report_date?: string;
  report_description?: string;
  prescription_data?: any;
  has_documents: boolean;
  document_paths?: string;
  tags?: string;
  [key: string]: any;
};

export async function getReports(): Promise<ApiResponse<PatientReport[]>> {
  return request<PatientReport[]>('/reports', { method: 'GET' });
}

type UploadReportParams = {
  report_name: string;
  report_type: string;
  fileUri: string;
  fileName: string;
  mimeType: string;
};

export async function uploadReport(params: UploadReportParams): Promise<ApiResponse<any>> {
  const formData = new FormData();
  formData.append('report_name', params.report_name);
  formData.append('report_type', params.report_type);
  formData.append('has_documents', 'true');
  
  formData.append('documents', {
    uri: params.fileUri,
    name: params.fileName,
    type: params.mimeType,
  } as any);

  return request<any>('/createreport', {
    method: 'POST',
    body: formData,
  }, true); // pass isMultipart = true
}

// ═══════════════════════════════════════════════════════════════
// 6. SECURE SPLIT-KEY REPORT SHARING
// ═══════════════════════════════════════════════════════════════

export type ShareReportPayload = {
  report_ids: number[];
  permanent?: boolean;
  expires_hours?: number;
};

export type ShareReportResponse = {
  share_id: string;
  pin: string;
};

export async function shareReports(payload: ShareReportPayload): Promise<ApiResponse<ShareReportResponse>> {
  return request<ShareReportResponse>('/sharereport', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type GetSharedReportPayload = {
  encrypted_payload: string;
  nonce: string;
  key_part_a: string;
  share_id: string;
};

export async function getSharedReport(share_id: string, pin: string): Promise<ApiResponse<GetSharedReportPayload>> {
  // Public endpoint, use raw fetch bypassing bearer token interceptor if needed
  try {
    const response = await fetch(`${API_BASE_URL}/sharereport/${share_id}?pin=${pin}`);
    const data = await response.json();
    if (!response.ok) return { success: false, message: data.detail || "Error fetching share." };
    return { success: true, data };
  } catch(e: any) {
    return { success: false, message: "Network error fetching shared record." }
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. DIAGNOSTIC HEALTH AI
// ═══════════════════════════════════════════════════════════════

export type HealthScoreResponse = {
  status: "not_calculated" | "calculating" | "ready";
  message?: string;
  score?: number;
  suggestions?: string[];
  last_calculated?: string;
};

export async function getHealthScore(): Promise<ApiResponse<HealthScoreResponse>> {
  return request<HealthScoreResponse>('/health-score', { method: 'GET' });
}

export { API_BASE_URL };
