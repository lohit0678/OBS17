import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { disconnectSocket } from '../socket';

export type UserRole = 'Admin' | 'HOD' | 'Faculty' | 'Student';

export interface User {
  isAuthenticated: boolean;
  token: string | null;
  role: UserRole | null;
  name: string;
  email: string;
  id: string; // F01, S101, etc.
  profilePic?: string;
}

interface AuthContextType {
  user: User;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (name: string, email: string, password: string, labName: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; error?: string }>;
  updateProfilePic: (profilePic: string) => Promise<{ success: boolean; error?: string }>;
  getAuthHeaders: () => Record<string, string>;
}

const defaultUser: User = {
  isAuthenticated: false,
  token: null,
  role: null,
  name: '',
  email: '',
  id: '',
  profilePic: '',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('erp_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isAuthenticated) {
          setUser(parsed);
        }
      } catch (err) {
        console.error("Failed to parse saved user:", err);
      }
    }
  }, []);

  /** Returns Authorization header object for authenticated API calls */
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }
    return headers;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: typeof defaultUser; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || "Invalid email or password." };
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('erp_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      console.error("Login failed:", err);
      return { success: false, error: "Network error. Please make sure the server is running." };
    }
  };

  const register = async (name: string, email: string, password: string, labName: string): Promise<{ success: boolean; user?: typeof defaultUser; error?: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, labName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || "Registration failed." };
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('erp_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      console.error("Registration failed:", err);
      return { success: false, error: "Network error. Please make sure the server is running." };
    }
  };

  const loginWithGoogle = async (credential: string): Promise<{ success: boolean; user?: typeof defaultUser; error?: string }> => {
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || "Google Authentication failed." };
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('erp_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      console.error("Google authentication failed:", err);
      return { success: false, error: "Google Sign-In failed due to network error." };
    }
  };

  const updateProfilePic = async (profilePic: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/academic/faculty/profile-pic", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ facultyId: user.id, profilePic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || "Failed to save profile picture." };
      }

      const updatedUser = { ...user, profilePic };
      setUser(updatedUser);
      localStorage.setItem('erp_user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (err) {
      console.error("Profile picture update failed:", err);
      return { success: false, error: "Network error updating profile picture." };
    }
  };

  const logout = () => {
    disconnectSocket();
    setUser(defaultUser);
    localStorage.removeItem('erp_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loginWithGoogle, updateProfilePic, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
