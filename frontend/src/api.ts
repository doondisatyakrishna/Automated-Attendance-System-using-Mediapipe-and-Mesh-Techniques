// Base URL for your FastAPI backend
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

/**
 * A helper function to create the authorization headers for a protected API request.
 * Pass `null` for contentType if the body is FormData.
 */
const getAuthHeaders = (contentType: string | null = 'application/json') => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("Authentication token is missing.");
    }
    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
    };
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    return headers;
};


// --- AUTH FUNCTIONS ---

export async function loginRequest(username: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/auth/token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: formData.toString()
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(errorData.detail);
  }
  return res.json();
}

export async function registerRequest(
    username: string, 
    email: string, 
    password: string,
    phone_number: string
) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, phone_number })
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
    }
    return data;
}

export async function verifyAccountRequest(username: string, code: string) {
    const res = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code })
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.detail || 'Verification failed');
    }
    return data;
}


// --- STUDENT FUNCTIONS ---

export async function listStudents() {
    const res = await fetch(`${API_BASE}/students`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load students');
    return res.json();
}

export async function createStudent(formData: FormData) {
    const res = await fetch(`${API_BASE}/students`, { 
        method: 'POST', 
        body: formData, 
        headers: getAuthHeaders(null) 
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message = (data as any).detail || 'Failed to create student';
        throw new Error(message);
    }
    return data;
}

export async function updateStudentDetailsApi(studentId: string, payload: { name: string; email: string; department: string }) {
    const res = await fetch(`${API_BASE}/students/${studentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message = (data as any).detail || 'Failed to update student';
        throw new Error(message);
    }
    return data;
}

export async function updateStudentPhotoApi(studentId: string, formData: FormData) {
    const res = await fetch(`${API_BASE}/students/${studentId}/photo`, {
        method: 'PUT',
        body: formData,
        headers: getAuthHeaders(null),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message = (data as any).detail || 'Failed to update student photo';
        throw new Error(message);
    }
    return data;
}

export const deleteStudent = async (studentId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/students/${studentId}`, { 
        method: 'DELETE', 
        headers: getAuthHeaders() 
    });
    if (!response.ok) {
        throw new Error(`Failed to delete student. Status: ${response.status}`);
    }
};


// --- RECOGNITION & ATTENDANCE FUNCTIONS ---

export async function recognizeImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/recognition/recognize`, { 
        method: 'POST', 
        body: form,
        headers: getAuthHeaders(null)
    });
    if (!res.ok) throw new Error('Recognition failed');
    return res.json();
}

export const markAttendance = async (studentId: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ student_id: studentId }),
    });
    if (!response.ok) {
        throw new Error('Failed to mark attendance');
    }
    return response.json();
};

export const updateAttendanceStatus = async (studentId: string, date: string, status: string) => {
    const res = await fetch(`${API_BASE}/attendance/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ student_id: studentId, date, status })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
};

export const getTodaysAttendance = async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE}/attendance/today`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error('Failed to fetch today\'s attendance log');
    }
    return response.json();
};


// --- ANALYTICS FUNCTIONS ---

export async function getDashboardSummary() {
    const res = await fetch(`${API_BASE}/analytics/dashboard-summary`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return res.json();
}

export async function getAnalyticsData(period: '7' | '30' | 'all') {
    const res = await fetch(`${API_BASE}/analytics/attendance-by-department?period=${period}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load analytics data');
    return res.json();
}

export async function getTopLateStudents(limit: number = 5) {
    const res = await fetch(`${API_BASE}/analytics/top-late-students?limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        throw new Error('Failed to load top late students');
    }
    return res.json();
}

// --- NEW FUNCTION ADDED HERE ---
export async function getOverallAnalyticsData(period: '7' | '30' | 'all') {
    const res = await fetch(`${API_BASE}/analytics/overall-status?period=${period}`, { 
        headers: getAuthHeaders() 
    });
    if (!res.ok) {
        throw new Error('Failed to load overall status data');
    }
    return res.json();
}


// --- PROFILE & SETTINGS FUNCTIONS ---

export const getMyProfile = async () => {
    const response = await fetch(`${API_BASE}/profile/me`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error('Failed to fetch profile data');
    }
    return response.json();
};

export const updateMyProfile = async (formData: FormData) => {
    const response = await fetch(`${API_BASE}/profile/me`, {
        method: 'PUT',
        body: formData,
        headers: getAuthHeaders(null)
    });
    if (!response.ok) {
        throw new Error('Failed to update profile');
    }
    return response.json();
};

export const getSettings = async () => {
    const response = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error('Failed to fetch settings');
    }
    return response.json();
};

export const updateSettings = async (data: { late_threshold_hour: number }) => {
    const response = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update settings');
    }
    return response.json();
};