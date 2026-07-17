import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, Faculty, calculateDepartmentMetrics } from '../data';
import { useAuth } from './AuthContext';

interface AcademicDataContextType {
  students: Student[];
  faculties: Faculty[];
  updateStudentAttendance: (studentId: string, date: string, status: 'Present' | 'Absent' | 'On Duty') => void;
  submitLabExperiment: (studentId: string, experimentId: string, observationFile?: string, recordFile?: string) => void;
  updateLabSubmissionStatus: (studentId: string, experimentId: string, status: 'Approved' | 'Pending' | 'Rejected' | 'Submitted - Pending', score: number, remarks?: string) => void;
  submitAssignment: (studentId: string, assignmentId: string, filename: string) => void;
  gradeAssignment: (studentId: string, assignmentId: string, score: number, remarks: string) => void;
  createAssignment: (facultyId: string, title: string, description: string, dueDate: string, maxScore: number, batch: string) => void;
  updateInternalMarks: (studentId: string, subject: string, cia1: number, cia2: number, cia3: number, practical: number) => void;
  sendNotification: (type: 'announcement' | 'circular' | 'schedule' | 'deadline' | 'exam', title: string, message: string, sender: string, targetBatch?: string) => void;
  evaluateDirect: (studentId: string, experimentIndex: number, action: 'observation_only' | 'both' | 'record_only') => Promise<void>;
  updateStudentRisk: (studentId: string, riskFlagged: boolean, riskReason?: string) => Promise<void>;
  uploadFile: (file: File) => Promise<{ success: boolean; fileUrl?: string; error?: string }>;
  queryAI: (prompt: string, context?: string) => Promise<{ success: boolean; response?: string; error?: string }>;
  getDepartmentMetrics: () => any;
  getFacultyData: (facultyId: string) => Faculty | undefined;
  getStudentData: (studentId: string) => Student | undefined;
  getFacultyStudents: (facultyId: string) => Student[];
  refreshData: () => Promise<void>;
  addPreApprovedFaculty: (data: { email: string; phone?: string; labName: string; subject: string; subjectCode: string; batch: string; sections: string }) => Promise<{ success: boolean; error?: string }>;
  changeAdminPassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AcademicDataContext = createContext<AcademicDataContextType | undefined>(undefined);

export function AcademicDataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAuthHeaders, user } = useAuth();

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = getAuthHeaders();
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });
  };

  const fetchAcademicData = async () => {
    try {
      const res = await authFetch("/api/academic/data");
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setFaculties(data.faculties || []);
      } else if (res.status === 401) {
        console.warn("Session expired. Please log in again.");
      }
    } catch (err) {
      console.error("Failed to fetch academic data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync state with server on mount and when user changes
  useEffect(() => {
    if (user.isAuthenticated && user.token) {
      fetchAcademicData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.isAuthenticated, user.token]);

  const refreshData = async () => {
    await fetchAcademicData();
  };

  // ── File upload ──────────────────────────────────────────────────────────────
  const uploadFile = async (file: File): Promise<{ success: boolean; fileUrl?: string; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const headers: Record<string, string> = {};
      if (user.token) headers["Authorization"] = `Bearer ${user.token}`;

      const res = await fetch("/api/upload", { method: "POST", headers, body: formData });
      if (res.ok) {
        const data = await res.json();
        return { success: true, fileUrl: data.fileUrl };
      }
      const err = await res.json();
      return { success: false, error: err.error };
    } catch (err) {
      console.error("File upload failed:", err);
      return { success: false, error: "File upload failed due to network error." };
    }
  };

  // ── Gemini AI query ──────────────────────────────────────────────────────────
  const queryAI = async (prompt: string, context?: string): Promise<{ success: boolean; response?: string; error?: string }> => {
    try {
      const res = await authFetch("/api/ai/query", {
        method: "POST",
        body: JSON.stringify({ prompt, context }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, response: data.response };
      }
      const err = await res.json();
      return { success: false, error: err.error };
    } catch (err) {
      console.error("AI query failed:", err);
      return { success: false, error: "AI query failed due to network error." };
    }
  };

  // ── Attendance ───────────────────────────────────────────────────────────────
  const updateStudentAttendance = async (studentId: string, date: string, status: 'Present' | 'Absent' | 'On Duty') => {
    try {
      const res = await authFetch("/api/academic/attendance", {
        method: "POST",
        body: JSON.stringify({ studentId, date, status }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to update student attendance on server:", err);
    }
  };

  // ── Lab experiments ──────────────────────────────────────────────────────────
  const submitLabExperiment = async (studentId: string, experimentId: string, observationFile?: string, recordFile?: string) => {
    try {
      const res = await authFetch("/api/academic/lab/submit", {
        method: "POST",
        body: JSON.stringify({ studentId, experimentId, observationFile, recordFile }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to submit lab experiment on server:", err);
    }
  };

  const updateLabSubmissionStatus = async (
    studentId: string,
    experimentId: string,
    status: 'Approved' | 'Pending' | 'Rejected' | 'Submitted - Pending',
    score: number,
    remarks?: string
  ) => {
    try {
      const res = await authFetch("/api/academic/lab/status", {
        method: "POST",
        body: JSON.stringify({ studentId, experimentId, status, score, remarks }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to update lab submission status on server:", err);
    }
  };

  const evaluateDirect = async (
    studentId: string,
    experimentIndex: number,
    action: 'observation_only' | 'both' | 'record_only'
  ) => {
    try {
      const res = await authFetch("/api/academic/evaluation/direct", {
        method: "POST",
        body: JSON.stringify({ studentId, experimentIndex, action }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to evaluate student directly on server:", err);
    }
  };

  // ── Assignments ──────────────────────────────────────────────────────────────
  const submitAssignment = async (studentId: string, assignmentId: string, filename: string) => {
    try {
      const res = await authFetch("/api/academic/assignment/submit", {
        method: "POST",
        body: JSON.stringify({ studentId, assignmentId, filename }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to submit assignment on server:", err);
    }
  };

  const gradeAssignment = async (studentId: string, assignmentId: string, score: number, remarks: string) => {
    try {
      const res = await authFetch("/api/academic/assignment/grade", {
        method: "POST",
        body: JSON.stringify({ studentId, assignmentId, score, remarks }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to grade assignment on server:", err);
    }
  };

  const createAssignment = async (
    facultyId: string,
    title: string,
    description: string,
    dueDate: string,
    maxScore: number,
    batch: string
  ) => {
    try {
      const res = await authFetch("/api/academic/assignment/create", {
        method: "POST",
        body: JSON.stringify({ facultyId, title, description, dueDate, maxScore, batch }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to create assignment on server:", err);
    }
  };

  // ── Internal marks ───────────────────────────────────────────────────────────
  const updateInternalMarks = async (
    studentId: string,
    subject: string,
    cia1: number,
    cia2: number,
    cia3: number,
    practical: number
  ) => {
    try {
      const res = await authFetch("/api/academic/internal-marks", {
        method: "POST",
        body: JSON.stringify({ studentId, subject, cia1, cia2, cia3, practical }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to update internal marks on server:", err);
    }
  };

  // ── Notifications ────────────────────────────────────────────────────────────
  const sendNotification = async (
    type: 'announcement' | 'circular' | 'schedule' | 'deadline' | 'exam',
    title: string,
    message: string,
    sender: string,
    targetBatch?: string
  ) => {
    try {
      const res = await authFetch("/api/academic/notifications", {
        method: "POST",
        body: JSON.stringify({ type, title, message, sender, targetBatch }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to send notification on server:", err);
    }
  };

  // ── Risk ─────────────────────────────────────────────────────────────────────
  const updateStudentRisk = async (studentId: string, riskFlagged: boolean, riskReason?: string) => {
    try {
      const res = await authFetch("/api/academic/student/risk", {
        method: "POST",
        body: JSON.stringify({ studentId, riskFlagged, riskReason }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
      }
    } catch (err) {
      console.error("Failed to update student risk on server:", err);
    }
  };

  // ── HOD Operations ──────────────────────────────────────────────────────────
  const addPreApprovedFaculty = async (data: { email: string; phone?: string; labName: string; subject: string; subjectCode: string; batch: string; sections: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch("/api/hod/faculty", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setFaculties(result.faculties);
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.error };
    } catch (err) {
      console.error("Failed to add pre-approved faculty:", err);
      return { success: false, error: "Failed due to network error." };
    }
  };

  const changeAdminPassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch("/api/admin/password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (res.ok) {
        return { success: true };
      }
      const err = await res.json();
      return { success: false, error: err.error };
    } catch (err) {
      console.error("Failed to change admin password:", err);
      return { success: false, error: "Failed due to network error." };
    }
  };

  // ── Derived helpers ──────────────────────────────────────────────────────────
  const getDepartmentMetrics = () => calculateDepartmentMetrics(students, faculties);
  const getFacultyData = (facultyId: string) => faculties.find((f) => f.id === facultyId);
  const getStudentData = (studentId: string) => students.find((s) => s.id === studentId);
  const getFacultyStudents = (facultyId: string) => students.filter((s) => s.facultyId === facultyId);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wide text-indigo-200">Loading Academic Records...</p>
        </div>
      </div>
    );
  }

  return (
    <AcademicDataContext.Provider
      value={{
        students,
        faculties,
        updateStudentAttendance,
        submitLabExperiment,
        updateLabSubmissionStatus,
        submitAssignment,
        gradeAssignment,
        createAssignment,
        updateInternalMarks,
        sendNotification,
        evaluateDirect,
        updateStudentRisk,
        uploadFile,
        queryAI,
        getDepartmentMetrics,
        getFacultyData,
        getStudentData,
        getFacultyStudents,
        refreshData,
        addPreApprovedFaculty,
        changeAdminPassword,
      }}
    >
      {children}
    </AcademicDataContext.Provider>
  );
}

export function useAcademicData() {
  const context = useContext(AcademicDataContext);
  if (context === undefined) {
    throw new Error('useAcademicData must be used within an AcademicDataProvider');
  }
  return context;
}
