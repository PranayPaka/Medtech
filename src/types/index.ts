// Core application types for Med tech system

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'staff' | 'admin' | 'patient';
  userType?: 'doctor' | 'patient';
  department?: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contact?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TriageInput {
  patientId?: string;
  patientName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: string;
  duration: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };
  force_ai?: boolean;
}

export interface TriageResult {
  id: string;
  patientId: string;
  patientName: string;
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  category: 'Emergency' | 'High' | 'Medium' | 'Low' | 'Normal';
  explanation: string;
  confidence: number;
  source: 'ml' | 'rule-based' | 'ai';
  symptoms: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };
  recommendedAction?: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  diagnosis: string;
  medications: Medication[];
  instructions: string;
  verificationHash?: string;
  followUpDate?: string;
  createdAt: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface DrugVerificationInput {
  imageFile?: File;
  qrCode?: string;
  drugName?: string;
  batchNumber?: string;
  manufacturer?: string;
}

export interface DrugVerificationResult {
  id: string;
  drugName: string;
  batchNumber?: string;
  isAuthentic: boolean;
  confidence: number;
  verificationStatus: 'authentic' | 'suspicious' | 'counterfeit' | 'unknown';
  warningMessage?: string;
  source: 'ml' | 'rule-based';
  verifiedAt: string;
  details?: {
    manufacturer?: string;
    expiryDate?: string;
    productionDate?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role?: 'doctor' | 'staff';
  userType?: 'doctor' | 'patient';
  department?: string;
  phone?: string;
  dateOfBirth?: string;
}

// Utility type for urgency colors
export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

export const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; bgColor: string }> = {
  1: { label: 'Emergency', color: 'text-emergency-foreground', bgColor: 'bg-emergency' },
  2: { label: 'High', color: 'text-high-urgency-foreground', bgColor: 'bg-high-urgency' },
  3: { label: 'Medium', color: 'text-medium-urgency-foreground', bgColor: 'bg-medium-urgency' },
  4: { label: 'Low', color: 'text-low-urgency-foreground', bgColor: 'bg-low-urgency' },
  5: { label: 'Normal', color: 'text-normal-foreground', bgColor: 'bg-normal' },
};