// This file will hold all the common data structures for your app.

// For the main student list and forms
export interface Student {
  id: string; // This is the _id from MongoDB
  student_id: string;
  name: string;
  email: string;
  department: string;
  photo_url?: string;
  embedding?: number[];
}

// For the dashboard statistics cards
export interface StatData {
  total: number;
  present: number;
  absent: number;
  late: number;
}

// For the attendance logs
export interface LogEntry {
  student_id: string;
  name: string;
  photo_url?: string;
  status: 'present' | 'absent' | 'late';
  check_in_time?: string;
  timestamp?: string;
}

// --- FIX: The complete User interface ---
// This now matches the data your backend sends for a user profile.
export interface User {
  id: string; // Corresponds to MongoDB's _id
  username: string;
  name: string;
  email: string;
  department: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_phone_verified: boolean;
}