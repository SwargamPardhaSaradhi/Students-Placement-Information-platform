export interface RoundData {
  rowData: Record<string, string | number>;
  studentId: string | null;
  status: 'qualified' | 'not_qualified' | 'pending';
}

export interface Round {
  roundId?: string;
  roundNumber: number;
  roundName: string | null;
  rawColumns: string[];
  studentCount: number;
  isFinalRound: boolean;
  timestamp: Date | string;
  data: Record<string, RoundData>;
}

export interface Placement {
  rowData: Record<string, string | number>;
  timestamp: Date | string;
}

export interface Company {
  companyYearId: string;
  companyName: string;
  year: number;
  status: 'running' | 'completed';
  currentRound: number;
  finalRound: number | null;
  totalRounds: number;
  totalPlaced: number;
  totalApplied: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  rounds?: Record<string, Round>;
  placements?: Record<string, Placement>;
}

export interface CompanyStatus {
  status: 'selected' | 'not_selected' | 'in_process';
  roundReached: number;
  finalSelection: boolean | null;
  year: number;
}

export interface Student {
  studentId: string;
  name: string;
  rollNumber: string;
  email: string;
  companyStatus: Record<string, CompanyStatus>;
  selectedCompanies: string[];
  currentStatus: 'placed' | 'not_placed';
  totalOffers: number;
  updatedAt: Date | string;
}

export interface YearAnalytics {
  year: number;
  totalCompanies: number;
  completedCompanies: number;
  runningCompanies: number;
  totalPlaced: number;
  totalStudentsParticipated: number;
  companyWise: Record<string, {
    companyName: string;
    placed: number;
    status: 'running' | 'completed';
  }>;

}

// Chat Types
export interface ThinkingStep {
  type: 'iteration' | 'decision' | 'function' | 'result';
  title: string;
  content: string;
  status?: 'running' | 'success' | 'error';
  iteration?: number;
}

export interface TableData {
  headers: string[];
  rows: unknown[];
  count: number;
  aiSummary: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinkingSteps: ThinkingStep[];
  tableData?: TableData;
  status: 'streaming' | 'complete' | 'error';
  timestamp: Date;
}

// Stats Types
export interface StudentStats {
  total: number;
  placed: number;
  notPlaced: number;
  totalOffers: number;
  avgOffers: number;
}

export interface DashboardSummary {
  counts: {
    years: number;
    companies: number;
    students: number;
  };
  stats: {
    totalCompanies: number;
    completedCompanies: number;
    runningCompanies: number;
    totalPlaced: number;
  };
  latestYear: YearAnalytics | null;
  recentCompanies: Company[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
}

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export interface DeleteCompanyResponse {
  message: string;
  deleted: {
    rounds: number;
    placements: number;
    students_updated: number;
  };
}

export interface DeleteRoundResponse {
  message: string;
  deleted: {
    data_rows: number;
    students_updated: number;
  };
  company_updated: {
    status: string;
  };
}

export interface CreateStudentPayload {
  name: string;
  rollNumber: string;
  email: string;
}

export interface CreateStudentResponse {
  message: string;
  studentId: string;
}

export interface User {
  id: string;
  username: string;
  role: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    companyYearId: string;
    roundId: string;
    totalStudents: number;
    matchedStudents: number;
    newStudents: number;
    placedStudents: number;
    isFinalRound: boolean;
  };
}
