import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicDataProvider } from './context/AcademicDataContext';
import LayoutWrapper from './components/LayoutWrapper';

// Page Imports
import Login from './pages/Login';
import HodDashboard from './pages/HodDashboard';
import HodFaculty from './pages/HodFaculty';
import HodStudents from './pages/HodStudents';
import FacultyDashboard from './pages/FacultyDashboard';
import FacultyStudents from './pages/FacultyStudents';
import FacultyAttendance from './pages/FacultyAttendance';
import FacultyTimetable from './pages/FacultyTimetable';
import StudentDashboard from './pages/StudentDashboard';
import StudentDetail from './pages/StudentDetail';

// ==========================================
// 1. ROUTE GUARD: Authentication & Role Check
// ==========================================
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('HOD' | 'Faculty' | 'Student')[];
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

            {/* A. HOD PRIVILEGE ROUTES */}
            {/* Legacy redirect */}
            <Route path="/hod/dashboard" element={<Navigate to="/hod/overview" replace />} />
            <Route
              path="/hod/faculty"
              element={
                <ProtectedRoute allowedRoles={['HOD']}>
                  <HodFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/faculty/:facultyId"
              element={
                <ProtectedRoute allowedRoles={['HOD']}>
                  <HodFaculty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/students"
              element={
                <ProtectedRoute allowedRoles={['HOD']}>
                  <HodStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/students/:studentId"
              element={
                <ProtectedRoute allowedRoles={['HOD']}>
                  <StudentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hod/:tab"
              element={
                <ProtectedRoute allowedRoles={['HOD']}>
                  <HodDashboard />
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
