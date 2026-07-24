import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import collegeLogo from '../assets/images/panimalar_logo_final_1783767831926.jpg';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  CalendarDays,
  LogOut,
  Menu,
  X,
  Clock,
  User as UserIcon,
  BookOpen,
  FileText,
  FileSpreadsheet,
  Award,
  MessageSquare,
  Medal,
  Settings,
  Building,
  Database,
  BarChart2,
  Upload,
  Sun,
  Moon,
  Activity,
  Bell
} from 'lucide-react';
import { useAcademicData } from '../context/AcademicDataContext';

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { theme, toggleTheme } = useAcademicData();

  // 1. HOD NAVIGATION
  const hodNav: SidebarItem[] = [
    { label: 'Overview', path: '/admin/overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Batches & Sections', path: '/admin/batches', icon: <Building className="w-5 h-5" /> },
    { label: 'Timetable Builder', path: '/admin/timetable', icon: <CalendarDays className="w-5 h-5" /> },
    { label: 'Faculty Access', path: '/admin/access', icon: <Users className="w-5 h-5" /> },
    { label: 'Live Monitoring', path: '/admin/monitor', icon: <Activity className="w-5 h-5" /> },
    { label: 'Admin Profile', path: '/admin/profile', icon: <UserIcon className="w-5 h-5" /> },
  ];

  // 2. FACULTY NAVIGATION
  const facultyNav: SidebarItem[] = [
    { label: 'Section Overview', path: '/faculty/page1', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Attendance Registry', path: '/faculty/page2', icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: 'Lab Notebook Signoff', path: '/faculty/page3', icon: <FileText className="w-5 h-5" /> },
    { label: 'Visuals & Stats', path: '/faculty/page4', icon: <Users className="w-5 h-5" /> },
  ];

  // 3. STUDENT NAVIGATION
  const studentNav: SidebarItem[] = [
    { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Profile', path: '/student/profile', icon: <UserIcon className="w-5 h-5" /> },
    { label: 'Lab Attendance', path: '/student/attendance', icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: 'Observation Notebook', path: '/student/laboratory-record', icon: <FileText className="w-5 h-5" /> },
    { label: 'Record Notebook', path: '/student/assignments', icon: <BookOpen className="w-5 h-5" /> },
    { label: 'Internal Marks', path: '/student/internal-marks', icon: <Award className="w-5 h-5" /> },
    { label: 'Faculty Remarks', path: '/student/remarks', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Academic Calendar', path: '/student/calendar', icon: <CalendarDays className="w-5 h-5" /> },
    { label: 'My Certificates', path: '/student/certificates', icon: <Medal className="w-5 h-5" /> },
    { label: 'Settings', path: '/student/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const getNavItems = () => {
    switch (user.role) {
      case 'HOD':
      case 'Admin':
        return hodNav;
      case 'Faculty':
        return facultyNav;
      case 'Student':
        return studentNav;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === '/faculty/page1' && (location.pathname === '/faculty/dashboard' || location.pathname === '/faculty/page1')) {
      return true;
    }
    if (path.endsWith('/dashboard')) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200 bg-slate-50 text-slate-900">
      {/* NAVY BLUE TOP HEADER */}
      <header id="app-header" className="bg-[#0B192C] text-white h-16 px-4 md:px-6 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg md:hidden text-white"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="p-0.5 bg-white rounded-xl border border-slate-700/50 flex items-center justify-center w-10 h-10 shrink-0 overflow-hidden shadow-inner">
            <img 
              src={collegeLogo} 
              alt="Panimalar College Logo" 
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Center Portal Branding */}
        <div className="flex-1 flex justify-center text-center px-4">
          <h1 className="text-xs sm:text-base md:text-xl font-black tracking-widest text-white uppercase font-sans">
            LAB MONITORING
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          <div className="flex items-center text-xs md:text-sm font-black text-slate-100 bg-slate-800/40 border border-slate-700/30 px-3 py-1.5 rounded-xl font-mono">
            <span>{timeStr || '12:00:00 PM'}</span>
          </div>

          {/* THE ROUND ALONE */}
          <Link 
            to={user.role === 'Faculty' ? '/faculty/profile' : (user.role === 'Student' ? '/student/profile' : '#')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-500 bg-[#0B192C] flex items-center justify-center cursor-pointer select-none shadow-md shrink-0 hover:border-white transition-all"
          >
            {user.profilePic ? (
              <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-xs uppercase">
                {user.name.charAt(0) || 'F'}
              </span>
            )}
          </Link>

          {/* LOGOUT SYMBOL */}
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 bg-slate-800/60 border border-slate-700 hover:bg-rose-950/40 hover:border-rose-800 hover:text-rose-200 text-slate-300 rounded-xl transition-all duration-200 cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex relative">
        {/* SIDEBAR - DESKTOP */}
        <aside className="w-64 bg-white border-r border-slate-100 shrink-0 hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
          <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-16rem)]">
            <div className="px-3">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">LAB MONITORING MENU</p>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                      active
                        ? 'bg-[#0B192C] text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Faculty Profile down of the page in menu column in a round shape */}
          <div 
            onClick={() => {
              if (user.role === 'Faculty') {
                navigate('/faculty/profile'); // Navigate to profile tab/page
              } else if (user.role === 'Student') {
                navigate('/student/profile');
              }
            }}
            className="flex flex-col items-center justify-center p-4 border border-slate-250 rounded-full bg-slate-50 hover:bg-slate-100 transition-all text-center group cursor-pointer aspect-square w-48 mx-auto mt-auto mb-4 hover:shadow-md border-dashed border-indigo-200"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-600 bg-[#0B192C] flex items-center justify-center shadow-md relative group-hover:scale-105 transition-transform">
              {user.profilePic ? (
                <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-xl uppercase">
                  {user.name.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="mt-2 px-2 max-w-[150px]">
              <p className="text-[11px] font-black text-slate-800 truncate leading-tight">{user.name || 'Sign In'}</p>
              <p className="text-[9px] font-extrabold text-indigo-600 uppercase tracking-widest truncate mt-0.5">{user.role || 'Guest'}</p>
            </div>
          </div>
        </aside>

        {/* SIDEBAR - MOBILE DRAWER */}
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 top-16 bg-slate-900/30 backdrop-blur-xs z-40 md:hidden"
            />
            {/* Drawer */}
            <aside className="fixed left-0 top-16 w-64 bg-white border-r border-slate-100 h-[calc(100vh-4rem)] z-50 p-4 md:hidden flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-between px-3">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">LAB MONITORING MENU</p>
                  <button onClick={() => setIsMobileOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                          active
                            ? 'bg-[#0B192C] text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Scope Info</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Viewing as <strong className="text-slate-800">{user.role}</strong>.
                </p>
              </div>
            </aside>
          </>
        )}

        {/* CORE DISPLAY WINDOW */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
