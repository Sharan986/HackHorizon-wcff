/**
 * MedChain API Service
 * Centralized API calls using the base URL from .env
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

// ─── Core Types ─────────────────────────────────────────────

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
};

// ─── Generic Request Helper ─────────────────────────────────

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || `Request failed with status ${response.status}`,
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

/**
 * Multipart upload helper (for file uploads).
 * Does NOT set Content-Type header — lets fetch set boundary automatically.
 */
async function uploadRequest<T = any>(
  endpoint: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type — fetch will set multipart/form-data + boundary
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || `Upload failed with status ${response.status}`,
        data,
      };
    }

    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Network error during upload.',
    };
  }
}


// ═══════════════════════════════════════════════════════════════
// AUTH ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export type LoginPayload = {
  email: string;
  password: string;
  role: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  role: string;
};

export type AuthResponse = {
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  [key: string]: any;
};

export async function loginUser(payload: LoginPayload): Promise<ApiResponse<AuthResponse>> {
  return request<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload: RegisterPayload): Promise<ApiResponse<AuthResponse>> {
  return request<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


// ═══════════════════════════════════════════════════════════════
// WORKER — DASHBOARD
// ═══════════════════════════════════════════════════════════════

export type RiskSummaryItem = {
  label: string;
  score: number;
  status: string; // "High" | "Moderate" | "Low"
};

export type ReportItem = {
  id: string | number;
  name: string;
  date: string;
  status: string; // "Analyzed" | "Pending"
  type?: string;
  values?: Record<string, string> | null;
};

export type DashboardData = {
  user?: { name: string; email: string };
  risks: RiskSummaryItem[];
  recentReports: ReportItem[];
  healthTip?: string;
};

/** GET /worker/dashboard — Fetch home screen data */
export async function getWorkerDashboard(): Promise<ApiResponse<DashboardData>> {
  return request<DashboardData>('/worker/dashboard');
}


// ═══════════════════════════════════════════════════════════════
// WORKER — REPORTS
// ═══════════════════════════════════════════════════════════════

export type ReportsListData = {
  reports: ReportItem[];
  total: number;
};

/** GET /worker/reports — Fetch all reports */
export async function getWorkerReports(): Promise<ApiResponse<ReportsListData>> {
  return request<ReportsListData>('/worker/reports');
}

/** POST /worker/reports/upload — Upload a medical report (image/pdf) */
export async function uploadWorkerReport(fileUri: string, fileName: string): Promise<ApiResponse<ReportItem>> {
  const formData = new FormData();

  // Determine MIME type from extension
  const ext = fileName.split('.').pop()?.toLowerCase();
  let mimeType = 'image/jpeg';
  if (ext === 'png') mimeType = 'image/png';
  else if (ext === 'pdf') mimeType = 'application/pdf';

  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as any);

  return uploadRequest<ReportItem>('/worker/reports/upload', formData);
}


// ═══════════════════════════════════════════════════════════════
// WORKER — RISK ASSESSMENT
// ═══════════════════════════════════════════════════════════════

export type RiskReasonItem = {
  icon?: string;
  text: string;
};

export type RiskDetailItem = {
  id: string;
  label: string;
  icon: string;
  score: number;
  status: string;
  reasons: string[];
  recommendations: RiskReasonItem[];
};

export type RiskAssessmentData = {
  overallScore: number;
  overallStatus: string;
  risks: RiskDetailItem[];
};

/** GET /worker/risk — Fetch full risk assessment */
export async function getWorkerRiskAssessment(): Promise<ApiResponse<RiskAssessmentData>> {
  return request<RiskAssessmentData>('/worker/risk');
}


// ═══════════════════════════════════════════════════════════════
// WORKER — PROFILE
// ═══════════════════════════════════════════════════════════════

export type WorkerProfile = {
  name: string;
  email: string;
  role: string;
  jobRole: string;
  yearsOfExposure: string;
  exposureTypes: string[];
};

/** GET /worker/profile — Get worker profile */
export async function getWorkerProfile(): Promise<ApiResponse<WorkerProfile>> {
  return request<WorkerProfile>('/worker/profile');
}

export type UpdateProfilePayload = {
  jobRole: string;
  yearsOfExposure: string;
  exposureTypes: string[];
};

/** PUT /worker/profile — Update worker profile */
export async function updateWorkerProfile(payload: UpdateProfilePayload): Promise<ApiResponse<WorkerProfile>> {
  return request<WorkerProfile>('/worker/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}


export { API_BASE_URL };
