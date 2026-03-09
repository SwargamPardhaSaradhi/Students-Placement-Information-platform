// API Configuration - PRODUCTION
import { User, DeleteCompanyResponse, DeleteRoundResponse, CreateStudentPayload, CreateStudentResponse, UploadResponse } from '../types';
const API_BASE_URL = 'https://authentication-for-iare.onrender.com/api';
const AI_API_URL = 'https://ai-to-db-iare.onrender.com';
const EXCEL_API_URL = 'https://excel-to-db-iare.onrender.com';
const DELETE_API_URL = 'https://excel-to-delete-iare.onrender.com';  // Delete microservice



// API Client with auto token refresh
class ApiClient {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      credentials: 'include',  // Automatically sends cookies!
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Try to refresh token
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the original request
        const retryResponse = await fetch(url, {
          ...options,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || 'Request failed after token refresh');
        }

        return retryResponse.json();
      } else {
        // Only redirect if this is not already a login/auth request
        if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/me')) {
          // ✅ SECURITY: Clear cache if auth fails (no cookie/invalid)
          localStorage.clear();
          // console.log('🔒 Auth failed - clearing local storage');
          throw new Error('Authentication required');
        }
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async login(username: string, password: string) {
    // Step 1: Login to auth service
    const response = await this.request<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );

    // ✅ SECURITY: Tokens are stored as httpOnly cookies by the backend
    // They are NOT accessible to JavaScript (prevents XSS attacks)
    // console.log('✅ Login successful - tokens stored as httpOnly cookies (secure)');

    // Step 2: Set cookies on Excel service domain
    try {
      await fetch(`${EXCEL_API_URL}/api/auth/set-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        }),
      });
    } catch (e) {
      // console.warn('Failed to set Excel service cookie:', e);
    }

    // Step 3: Set cookies on AI service domain
    try {
      await fetch(`${AI_API_URL}/api/auth/set-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        }),
      });
    } catch (e) {
      // console.warn('Failed to set AI service cookie:', e);
    }

    // Step 4: Set cookies on Delete service domain
    try {
      await fetch(`${DELETE_API_URL}/api/auth/set-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        }),
      });
    } catch (e) {
      // console.warn('Failed to set Delete service cookie:', e);
    }

    return response;
  }

  async register(username: string, password: string, role: 'admin' | 'student' = 'admin') {
    const response = await this.request<{ user: User; accessToken: string; refreshToken: string }>(
      '/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      }
    );

    // ✅ SECURITY: Tokens are stored as httpOnly cookies by the backend
    // They are NOT accessible to JavaScript (prevents XSS attacks)
    // console.log('✅ Registration successful - tokens stored as httpOnly cookies (secure)');

    // Step 2: Set cookies on Excel service domain
    try {
      await fetch(`${EXCEL_API_URL}/api/auth/set-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        }),
      });
    } catch (e) {
      // console.warn('Failed to set Excel service cookie:', e);
    }

    // Step 3: Set cookies on AI service domain
    try {
      await fetch(`${AI_API_URL}/api/auth/set-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        }),
      });
    } catch (e) {
      // console.warn('Failed to set AI service cookie:', e);
    }

    // Step 4: Set cookies on Delete service domain
    try {
      await fetch(`${DELETE_API_URL}/api/auth/set-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        }),
      });
    } catch (e) {
      // console.warn('Failed to set Delete service cookie:', e);
    }

    return response;
  }

  async logout() {
    // Logout from all four services to clear all cookies
    const logoutPromises = [
      this.request('/auth/logout', { method: 'POST' }),
      fetch(`${EXCEL_API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }),
      fetch(`${AI_API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }),
      fetch(`${DELETE_API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }),
    ];

    await Promise.all(logoutPromises.map(p => p.catch(() => { })));
  }

  async getCurrentUser() {
    return this.request<User>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getUsers() {
    return this.request<User[]>('/users');
  }

  async createUser(username: string, password: string, role: string) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, { method: 'DELETE' });
  }

  async resetPassword(userId: string): Promise<{
    message: string;
    newPassword: string;
  }> {
    return this.request(`/users/${userId}/reset-password`, {
      method: 'POST',
    });
  }

  async deleteCompany(companyYearId: string, companyName: string, year: number) {
    // Use DELETE microservice instead of main API
    const url = `${DELETE_API_URL}/api/companies/${companyYearId}?company_name=${encodeURIComponent(companyName)}&year=${year}`;

    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Delete failed' }));
      throw new Error(error.error || 'Failed to delete company');
    }

    return response.json();
  }

  async deleteRound(companyYearId: string, roundId: string, roundNumber: number) {
    // Use DELETE microservice instead of main API
    const url = `${DELETE_API_URL}/api/companies/${companyYearId}/rounds/${roundId}?round_number=${roundNumber}`;

    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Delete failed' }));
      throw new Error(error.error || 'Failed to delete round');
    }

    return response.json();
  }

  async createStudent(studentData: CreateStudentPayload) {
    return this.request<CreateStudentResponse>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(studentId: string) {
    return this.request(`/students/${studentId}`, {
      method: 'DELETE',
    });
  }

  async queryAI(query: string): Promise<ReadableStream> {
    const response = await fetch(`${AI_API_URL}/api/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // Send cookies to AI service!
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Failed to query AI');
    }

    return response.body!;
  }

  async uploadExcelRound(
    file: File,
    company: string,
    year: number,
    roundNumber: number | undefined,
    roundName: string | undefined,
    isFinal: boolean
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('company', company);
    formData.append('year', year.toString());

    if (roundNumber) {
      formData.append('roundNumber', roundNumber.toString());
    }
    if (roundName) {
      formData.append('roundName', roundName);
    }
    if (isFinal) {
      formData.append('isFinal', 'true');
    }

    // ✅ SECURITY: Use httpOnly cookies - no localStorage access!
    // Cookies are automatically sent via credentials: 'include'
    const response = await fetch(`${EXCEL_API_URL}/api/upload-round`, {
      method: 'POST',
      credentials: 'include',  // Sends httpOnly cookies automatically
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json() as Promise<UploadResponse>;
  }
}



export const api = new ApiClient();
