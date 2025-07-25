// services/apiService.ts

import { User } from '../types';

/**
 * ===================================================================================
 * NOTE: This is a PRODUCTION-READY API service.
 * It is configured to make calls to a backend server.
 * ===================================================================================
 */

// Use environment variable for API URL
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://192.168.1.18:5001';

// A helper function to handle fetch requests and responses
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error('Could not parse server response.');
        }

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        return data;
    } catch (error) {
        // Improved error message for network issues
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Could not connect to backend API. Check your API URL and CORS settings.');
        }
        console.error(`API call to ${endpoint} failed:`, error);
        throw error;
    }
}

interface AuthSuccessResponse {
  success: true;
  user: User;
}

interface AuthFailureResponse {
  success: false;
  message: string;
}

type AuthResponse = AuthSuccessResponse | AuthFailureResponse;

export const loginAPI = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const response = await fetchAPI<{ success: boolean, user: User, token: string }>('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        // Store the token in localStorage
        if (response.token) {
            localStorage.setItem('authToken', response.token);
        }
        
        return { success: true, user: response.user };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Login failed' };
    }
};

export const signupAPI = async (name: string, email: string, password: string): Promise<AuthResponse> => {
     try {
        const response = await fetchAPI<{ success: boolean, user: User, token: string }>('/api/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        
        // Store the token in localStorage
        if (response.token) {
            localStorage.setItem('authToken', response.token);
        }
        
        return { success: true, user: response.user };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Signup failed' };
    }
};

// Scan management endpoints
export const getScansAPI = async (): Promise<{ success: boolean, scans: any[] }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, scans: any[] }>('/api/scans', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        console.error('Failed to get scans:', error);
        return { success: false, scans: [] };
    }
};

export const createScanAPI = async (scanData: any): Promise<{ success: boolean, scan: any }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, scan: any }>('/api/scans', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(scanData)
        });
        return response;
    } catch (error) {
        console.error('Failed to create scan:', error);
        return { success: false, scan: null };
    }
};

export const deleteScanAPI = async (scanId: string): Promise<{ success: boolean, message: string }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, message: string }>(`/api/scans/${scanId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        console.error('Failed to delete scan:', error);
        return { success: false, message: 'Failed to delete scan' };
    }
};

// Admin endpoints
export const getAllUsersAPI = async (): Promise<{ success: boolean, users: any[] }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, users: any[] }>('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        console.error('Failed to get users:', error);
        return { success: false, users: [] };
    }
};

export const deleteUserAPI = async (userId: string): Promise<{ success: boolean, message: string }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, message: string }>(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        console.error('Failed to delete user:', error);
        return { success: false, message: 'Failed to delete user' };
    }
};

// Admin bulk operations
export const clearAllHistoryAPI = async (): Promise<{ success: boolean, message: string }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, message: string }>('/api/admin/clear-all-history', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        console.error('Failed to clear all history:', error);
        return { success: false, message: 'Failed to clear all history' };
    }
};

export const clearUserHistoryAPI = async (userId: string): Promise<{ success: boolean, message: string }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, message: string }>(`/api/admin/users/${userId}/history`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        console.error('Failed to clear user history:', error);
        return { success: false, message: 'Failed to clear user history' };
    }
};

// AI Model Learning Endpoints
export const submitAIFeedbackAPI = async (scanId: string, feedback: {
    corrected_prediction: string;
    notes?: string;
    feedback_type?: string;
    new_confidence?: number;
    analysis_details?: any;
}): Promise<{ success: boolean, message: string, data?: any }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, message: string, data?: any }>(`/api/scans/${scanId}/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(feedback)
        });
        return response;
    } catch (error) {
        console.error('Failed to submit AI feedback:', error);
        return { success: false, message: 'Failed to submit feedback' };
    }
};

export const getAIFeedbackAPI = async (): Promise<{ success: boolean, data?: any }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, data?: any }>('/api/admin/ai-feedback', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        console.error('Failed to get AI feedback:', error);
        return { success: false, data: null };
    }
};

export const getAIModelStatsAPI = async (): Promise<{ success: boolean, data?: any }> => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetchAPI<{ success: boolean, data?: any }>('/api/admin/ai-model-stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response;
    } catch (error) {
        console.error('Failed to get AI model stats:', error);
        return { success: false, data: null };
    }
};

// Logout function
export const logoutAPI = (): void => {
    localStorage.removeItem('authToken');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('authToken');
};

// Get auth token
export const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

export const requestPasswordResetAPI = async (email: string): Promise<{ success: boolean; message: string; data?: { maskedEmail: string; userName: string; code?: string } }> => {
    try {
        const response = await fetchAPI<{ success: boolean; message: string; data?: { maskedEmail: string; userName: string; code?: string } }>('/api/request-reset', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
        return response;
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Password reset failed' };
    }
};

export const verifyResetCodeAPI = async (email: string, code: string): Promise<{ success: boolean; message: string; }> => {
    try {
        const response = await fetchAPI<{ success: boolean; message: string }>('/api/verify-reset', {
            method: 'POST',
            body: JSON.stringify({ email, code }),
        });
        return response;
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Code verification failed' };
    }
};

export const finalizePasswordResetAPI = async (email: string, newPassword: string, code: string): Promise<{ success: boolean; message: string; }> => {
    try {
        const response = await fetchAPI<{ success: boolean; message: string }>('/api/finalize-reset', {
            method: 'POST',
            body: JSON.stringify({ email, newPassword, code }),
        });
        return response;
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Password reset failed' };
    }
};
