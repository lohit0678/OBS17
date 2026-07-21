import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicDataProvider } from './context/AcademicDataContext';
import LayoutWrapper from './components/LayoutWrapper';

import Login from './pages/Login';
import AdminFaculty from './pages/AdminFaculty';
import AdminStudents from './pages/AdminStudents';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyStudents from './pages/FacultyStudents';
import FacultyAttendance from './pages/FacultyAttendance';
import FacultyTimetable from './pages/FacultyTimetable';
import StudentDashboard from './pages/StudentDashboard';
import StudentDetail from './pages/StudentDetail';
import AdminDashboard from './pages/AdminDashboard';

// ==========================================
// 1. ROUTE GUARD: Authentication & Role Check
// ==========================================
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Admin' | 'HOD' | 'Faculty' | 'Student')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // If not authenticated, immediately redirect to /login
  if (!user.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If role is defined but doesn't match, bounce back to login (or their dashboard)
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // Render with shared LayoutWrapper dashboard frame
  return <LayoutWrapper>{children}</LayoutWrapper>;
};

// ==========================================
// 2. MAIN APP ROUTER CORE
// ==========================================
export default function App() {
  return (
    <AuthProvider>
      <AcademicDataProvider>
        <BrowserRouter>
          <Routes>
            {/* Gateways */}
            <Route path="/login" element={<Login />} />

            {/* ADMIN & HOD ROUTES */}
            <Route path="/admin/dashboard" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/hod/dashboard" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/hod/overview" element={<Navigate to="/admin/overview" replace />} />
            <Route path="/hod/monitoring" element={<Navigate to="/admin/access" replace />} />
            <Route path="/hod/access" element={<Navigate to="/admin/access" replace />} />
            <Route path="/hod/upload" element={<Navigate to="/admin/upload" replace />} />
            <Route path="/hod/batches" element={<Navigate to="/admin/batches" replace />} />
            <Route path="/hod/timetable" element={<Navigate to="/admin/timetable" replace />} />
            <Route
              path="/admin/:tab"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'HOD']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/faculty"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'HOD']}>
                  <AdminFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/faculty/:facultyId"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'HOD']}>
                  <AdminFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'HOD']}>
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students/:studentId"
              element={
                <ProtectedRoute allowedRoles={['Admin', 'HOD']}>
                  <StudentDetail />
                </ProtectedRoute>
              }
            />

            {/* B. FACULTY PRIVILEGE ROUTES */}
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/students"
              element={
                <ProtectedRoute allowedRoles={['Faculty']}>
                  <FacultyStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/students/:studentId"
              element={
                <ProtectedRoute allowedRoles={['Faculty']}>
                  <StudentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/attendance"
              element={
                <ProtectedRoute allowedRoles={['Faculty']}>
                  <FacultyAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/timetable"
              element={
                <ProtectedRoute allowedRoles={['Faculty']}>
                  <FacultyTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/:tab"
              element={
                <ProtectedRoute allowedRoles={['Faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />

            {/* C. STUDENT PRIVILEGE ROUTES */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/:tab"
              element={
                <ProtectedRoute allowedRoles={['Student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Wildcard Auto Redirections */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AcademicDataProvider>
    </AuthProvider>
  );
}
