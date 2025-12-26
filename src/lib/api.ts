// API client for communicating with the self-hosted backend
// Configure API_BASE_URL in your environment

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface RequestOptions extends RequestInit {
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { timeout = 30000, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...fetchOptions.headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        const errorMessage = error.detail || error.message || `HTTP ${response.status}`;

        // Create error object with status and message for better handling
        const apiError: any = new Error(errorMessage);
        apiError.status = response.status;
        apiError.response = { data: error };
        throw apiError;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: (email: string, password: string, userType: "doctor" | "patient" = "doctor") =>
    api.post<{ token: string; user: import('@/types').User }>('/auth/login', { email, password, userType }),

  registerDoctor: (data: import('@/types').RegisterData) =>
    api.post<{ token: string; user: import('@/types').User }>('/auth/register/doctor', data),

  registerPatient: (data: import('@/types').RegisterData) =>
    api.post<{ token: string; user: import('@/types').User }>('/auth/register/patient', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<import('@/types').User>('/auth/me'),
};

// Triage API
export const triageApi = {
  submit: (data: import('@/types').TriageInput) =>
    api.post<import('@/types').TriageResult>('/triage', data),

  getAll: (page = 1, limit = 20) =>
    api.get<import('@/types').PaginatedResponse<import('@/types').TriageResult>>(
      `/triage?page=${page}&limit=${limit}`
    ),

  getById: (id: string) =>
    api.get<import('@/types').TriageResult>(`/triage/${id}`),

  getByPatient: (patientId: string) =>
    api.get<import('@/types').TriageResult[]>(`/triage/patient/${patientId}`),
};

// Patients API
export const patientsApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<import('@/types').PaginatedResponse<import('@/types').Patient>>(
      `/patients?page=${page}&limit=${limit}`
    ),

  getById: (id: string) =>
    api.get<import('@/types').Patient>(`/patients/${id}`),

  create: (data: Omit<import('@/types').Patient, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<import('@/types').Patient>('/patients', data),

  update: (id: string, data: Partial<import('@/types').Patient>) =>
    api.put<import('@/types').Patient>(`/patients/${id}`, data),
};

// Prescriptions API
export const prescriptionsApi = {
  create: (data: Omit<import('@/types').Prescription, 'id' | 'createdAt'>) =>
    api.post<import('@/types').Prescription>('/prescriptions', data),

  getAll: () =>
    api.get<import('@/types').Prescription[]>('/prescriptions'),

  getByPatient: (patientId: string) =>
    api.get<import('@/types').Prescription[]>(`/prescriptions/patient/${patientId}`),

  getById: (id: string) =>
    api.get<import('@/types').Prescription>(`/prescriptions/${id}`),

  verify: (hash: string) =>
    api.get<import('@/types').Prescription>(`/prescriptions/verify/${hash}`),

  delete: (id: string) =>
    api.delete(`/prescriptions/${id}`),
};

// Chatbot API
export const chatbotApi = {
  query: (message: string, history: any[] = []) =>
    api.post<{ response: string }>('/chatbot/query', { message, history }),
};

// Drug Verification API
export const drugVerificationApi = {
  verify: (data: import('@/types').DrugVerificationInput) => {
    if (data.imageFile) {
      return api.uploadFile<import('@/types').DrugVerificationResult>(
        '/drug-verify',
        data.imageFile,
        {
          ...(data.drugName && { drugName: data.drugName }),
          ...(data.batchNumber && { batchNumber: data.batchNumber }),
        }
      );
    }
    return api.post<import('@/types').DrugVerificationResult>('/drug-verify', data);
  },

  getHistory: (page = 1, limit = 20) =>
    api.get<import('@/types').PaginatedResponse<import('@/types').DrugVerificationResult>>(
      `/drug-verify/history?page=${page}&limit=${limit}`
    ),
};