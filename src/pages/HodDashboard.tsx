import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAcademicData } from '../context/AcademicDataContext';
import { getFacultyRollup, Faculty } from '../data';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  GraduationCap,
  Percent,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lock,
  Mail,
  Phone,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Download,
  LayoutDashboard,
  UserPlus,
  ShieldCheck,
  Settings,
  Building2,
  BookOpen,
  Activity,
  X,
  Eye,
  EyeOff,
  PlusCircle,
  RefreshCw,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';

interface FacultyPerformance extends Faculty {
  studentCount: number;
  avgAttendance: number;
  labCompletionRate: number;
  recordCompletionRate: number;
  atRiskCount: number;
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'monitoring', label: 'Faculty Monitoring', icon: BarChart2 },
  { key: 'access', label: 'Faculty Access', icon: UserPlus },
  { key: 'upload', label: 'Upload Data', icon: Upload },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function HodDashboard() {
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    students,
    faculties,
    getDepartmentMetrics,
    addPreApprovedFaculty,
    changeAdminPassword,
    refreshData,
    uploadExcelProvisioning,
    deleteFaculty,
    clearFacultyData,
    manualProvisionData,
    uploadProfilePic,
    theme,
    toggleTheme,
  } = useAcademicData();

  // Resolve active tab
  const validTabs: TabKey[] = ['overview', 'monitoring', 'access', 'upload', 'settings'];
  const tab: TabKey = (urlTab && validTabs.includes(urlTab as TabKey) ? urlTab : 'overview') as TabKey;

  // Overview derived state from server stats
  const [serverStats, setServerStats] = useState<any>(null);

  // Faculty monitoring search & section filter
  const [monitorSearch, setMonitorSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Faculty access tab state
  const [accessSearch, setAccessSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '', phone: '', labName: '', subject: '', subjectCode: '',
    batch: '', sections: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Deletion modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Settings tab state
  const [academicTerm, setAcademicTerm] = useState('Odd Semester 2026');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile photo upload state
  const [picLoading, setPicLoading] = useState(false);
  const [picMsg, setPicMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload tab state
  const [uploadMode, setUploadMode] = useState<'excel' | 'form'>('excel');
  const [uploadDragging, setUploadDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ type: 'success' | 'error'; summary?: any; text: string } | null>(null);

  // Excel Manual Staff/Lab Defaults state (when Excel contains only student rows)
  const [excelDefaults, setExcelDefaults] = useState({
    defaultStaffName: '',
    defaultStaffEmail: '',
    defaultSubjectCode: '',
    defaultSubjectName: '',
    defaultLabLocation: '',
    defaultLabName: '',
    defaultFloor: '',
    defaultTiming: '',
    defaultBatch: '',
    defaultDepartment: 'Artificial Intelligence & Data Science',
  });

  // Manual Form Fallback State
  const [manualForm, setManualForm] = useState({
    staffName: '', staffEmail: '', subjectCode: '', subjectName: '',
    labLocation: '', labName: '', floor: '', timing: '', batch: '', sectionName: '',
    studentName: '', rollNo: '', registerNo: '', phoneNumber: ''
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualMsg, setManualMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const metrics = getDepartmentMetrics();

  useEffect(() => {
    const token = user.token;
    if (!token) return;
    fetch('/api/academic/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setServerStats(d); })
      .catch(() => {});
  }, [user.token, faculties]);

  // Faculty performance data
  const facultyPerformanceData: FacultyPerformance[] = faculties.map((f) => {
    const rollup = getFacultyRollup(f.id, students);
    return {
      ...f,
      studentCount: rollup.count,
      avgAttendance: rollup.avgAttendance,
      labCompletionRate: rollup.labCompletionRate,
      recordCompletionRate: rollup.recordCompletionRate,
      atRiskCount: rollup.atRiskCount,
    };
  });

  const filteredFacultyMonitor = facultyPerformanceData.filter(f =>
    f.name.toLowerCase().includes(monitorSearch.toLowerCase()) ||
    f.email.toLowerCase().includes(monitorSearch.toLowerCase())
  );

  const filteredFacultyAccess = faculties.filter(f =>
    f.name.toLowerCase().includes(accessSearch.toLowerCase()) ||
    f.email.toLowerCase().includes(accessSearch.toLowerCase())
  );

  const activeFaculties = (serverStats?.activeFaculties ?? faculties.filter(f => (f as any).isActive).length);
  const totalFaculties = serverStats?.totalFaculties ?? faculties.length;

  // batch attendance from server
  const batchAttendance: Record<string, number> = serverStats?.batchAttendance ?? {};
  const batchEntries = Object.entries(batchAttendance);

  // Overall avg attendance
  const overallAvg = serverStats?.avgAttendance ?? metrics.avgAttendance;

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMsg(null);
    const res = await addPreApprovedFaculty(addForm);
    if (res.success) {
      setAddMsg({ type: 'success', text: `Faculty access stub created for ${addForm.email}. They can now register using this email.` });
      setAddForm({ email: '', phone: '', labName: '', subject: '', subjectCode: '', batch: '', sections: '' });
      setShowAddForm(false);
    } else {
      setAddMsg({ type: 'error', text: res.error || 'Failed to add faculty.' });
    }
    setAddLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    const res = await changeAdminPassword(oldPassword, newPassword);
    if (res.success) {
      setPwMsg({ type: 'success', text: 'Password updated successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwMsg({ type: 'error', text: res.error || 'Failed to update password.' });
    }
    setPwLoading(false);
  };

  const navigateTab = (t: TabKey) => {
    navigate(`/hod/${t}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">HOD Administration</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Department Head Portal • Quality Auditing & Lab Metrics Monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#0B192C] text-white rounded-xl p-2.5 px-4 flex items-center gap-2 border border-slate-800 shadow-sm">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">Active Faculty</p>
              <p className="text-xs font-bold leading-tight">{activeFaculties} / {totalFaculties} Online</p>
            </div>
          </div>
          <button
            onClick={() => refreshData()}
            title="Refresh data"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ============================= PAGE 1: OVERVIEW ============================= */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{activeFaculties}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Active Faculties</p>
                <p className="text-[10px] text-slate-400">out of {totalFaculties} total</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{serverStats?.totalStudents ?? students.length}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Students</p>
                <p className="text-[10px] text-slate-400">AI & DS all batches</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Percent className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className={`text-2xl font-extrabold ${overallAvg >= 75 ? 'text-emerald-700' : 'text-rose-600'}`}>{overallAvg}%</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Overall Attendance</p>
                <p className="text-[10px] text-slate-400">Threshold: 75%</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-800">{serverStats?.riskStudents ?? metrics.totalAtRisk}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Students Needing Review</p>
                <p className="text-[10px] text-slate-400">Standard monitoring</p>
              </div>
            </div>
          </div>

          {/* Batch Attendance Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Batch-wise Student Attendance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Overall attendance percentage per batch</p>
            </div>

            {batchEntries.length > 0 ? (
              <div className="space-y-3">
                {batchEntries.map(([batch, pct]) => (
                  <div key={batch} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{batch}</span>
                      <span className={pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Fallback static batch data from local students */}
                {Array.from(new Set(students.map(s => s.batch))).map(batch => {
                  const batchStudents = students.filter(s => s.batch === batch);
                  const pct = batchStudents.length > 0
                    ? Math.round(batchStudents.reduce((sum, s) => sum + s.attendance, 0) / batchStudents.length)
                    : 0;
                  return (
                    <div key={batch} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{batch}</span>
                        <span className={pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}>{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lab Completion */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Departmental Lab Completion</h3>
              <p className="text-xs text-slate-400 mt-0.5">How many lab experiments have been completed across all batches</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-indigo-700">{serverStats?.labCompletionRate ?? metrics.labCompletionRate}%</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Completion Rate</p>
              </div>
              <div className="flex-1">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${serverStats?.labCompletionRate ?? metrics.labCompletionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-semibold">
                  <span>{serverStats?.submittedLabs ?? ''} submitted</span>
                  <span>{serverStats?.totalLabs ?? ''} total</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================= PAGE 2: FACULTY MONITORING ============================= */}
      {tab === 'monitoring' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Faculty Performance & Section Monitoring</h3>
              <p className="text-xs text-slate-500 mt-0.5">Filter by section to monitor faculty attendance and student notebook completion.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-700 bg-white"
              >
                <option value="All">All Sections & Batches</option>
                {Array.from(new Set(faculties.map(f => f.batch))).filter(Boolean).map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search faculty..."
                value={monitorSearch}
                onChange={e => setMonitorSearch(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium"
              />
            </div>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
              <p className="text-lg font-extrabold text-blue-700">{activeFaculties}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Active</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
              <p className="text-lg font-extrabold text-amber-600">{totalFaculties - activeFaculties}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Pending Reg.</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
              <p className="text-lg font-extrabold text-indigo-700">{totalFaculties}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Total</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
              <p className="text-lg font-extrabold text-emerald-700">{overallAvg}%</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Dept. Avg Att.</p>
            </div>
          </div>

          {/* Faculty Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Faculty Name</th>
                    <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Batch / Section</th>
                    <th className="px-4 py-3 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Faculty Att.</th>
                    <th className="px-4 py-3 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Observations %</th>
                    <th className="px-4 py-3 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Records %</th>
                    <th className="px-4 py-3 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFacultyMonitor.filter(f => selectedSection === 'All' || f.batch === selectedSection).length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-400 font-semibold">No faculty found for selected section.</td></tr>
                  )}
                  {filteredFacultyMonitor
                    .filter(f => selectedSection === 'All' || f.batch === selectedSection)
                    .map((f) => (
                      <tr
                        key={f.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-3.5" onClick={() => navigate(`/hod/faculty/${f.id}`)}>
                          <div>
                            <p className="font-bold text-slate-800">{f.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{f.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium" onClick={() => navigate(`/hod/faculty/${f.id}`)}>
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-[10px]">{f.batch}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center" onClick={() => navigate(`/hod/faculty/${f.id}`)}>
                          <span className={`font-extrabold ${((f as any).facultyAttendance ?? 0) >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {(f as any).facultyAttendance ?? 'N/A'}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-slate-700">{f.labCompletionRate}%</td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-indigo-600">{f.recordCompletionRate}%</td>
                        <td className="px-4 py-3.5 text-center">
                          {(f as any).isActive ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px]">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[10px]">Pending</span>
                          )}
                        </td>
                      <td className="px-4 py-3.5 text-right">
                        <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition cursor-pointer">
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================= PAGE 3: FACULTY ACCESS ============================= */}
      {tab === 'access' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Faculty Access Management</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Add faculty email IDs here. Only pre-approved emails can register on the portal.
              </p>
            </div>
            <button
              onClick={() => { setShowAddForm(v => !v); setAddMsg(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              {showAddForm ? 'Close Form' : 'Add Faculty Email'}
            </button>
          </div>

          {/* Success / Error message */}
          {addMsg && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-xs font-semibold border ${
              addMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {addMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{addMsg.text}</span>
              <button onClick={() => setAddMsg(null)} className="ml-auto text-slate-400 hover:text-slate-700"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Add Faculty Form */}
          {showAddForm && (
            <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
              <h4 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" /> Add Pre-Approved Faculty
              </h4>
              <form onSubmit={handleAddFaculty} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Faculty Email *</label>
                  <input
                    type="email" required value={addForm.email}
                    onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="faculty@college.edu"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="tel" value={addForm.phone}
                    onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lab Name *</label>
                  <input
                    type="text" required value={addForm.labName}
                    onChange={e => setAddForm(p => ({ ...p, labName: e.target.value }))}
                    placeholder="e.g. Data Structures Lab"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject Name *</label>
                  <input
                    type="text" required value={addForm.subject}
                    onChange={e => setAddForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="e.g. Data Structures & Algorithms"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject Code *</label>
                  <input
                    type="text" required value={addForm.subjectCode}
                    onChange={e => setAddForm(p => ({ ...p, subjectCode: e.target.value }))}
                    placeholder="e.g. AD3311"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Batch *</label>
                  <input
                    type="text" required value={addForm.batch}
                    onChange={e => setAddForm(p => ({ ...p, batch: e.target.value }))}
                    placeholder="e.g. AI & DS-A"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sections (comma separated) *</label>
                  <input
                    type="text" required value={addForm.sections}
                    onChange={e => setAddForm(p => ({ ...p, sections: e.target.value }))}
                    placeholder="e.g. AI & DS-A1, AI & DS-A2, AI & DS-A3"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {addLoading ? 'Adding...' : 'Add Faculty Access'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Faculty Access List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Pre-Approved Faculty List ({filteredFacultyAccess.length})
              </h4>
              <input
                type="text"
                placeholder="Search..."
                value={accessSearch}
                onChange={e => setAccessSearch(e.target.value)}
                className="w-44 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 font-medium"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-4 py-2.5 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Email ID</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Lab / Subject</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Batch</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFacultyAccess.length === 0 && (
                    <tr><td colSpan={5} className="py-10 text-center text-slate-400 font-semibold">No faculty pre-approved yet.</td></tr>
                  )}
                  {filteredFacultyAccess.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-700">{f.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-700">{f.labName}</p>
                          <p className="text-[10px] text-slate-400">{(f as any).subjectCode}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">{f.batch}</td>
                      <td className="px-4 py-3 text-center">
                        {(f as any).isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[10px]">
                            <Activity className="w-3 h-3" /> Awaiting Registration
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={async () => {
                              if (window.confirm(`Clear lab timetable and data for ${f.name || f.email} so you can upload fresh Excel data?`)) {
                                setDeleteLoading(true);
                                const res = await clearFacultyData(f.id);
                                if (res.success) {
                                  alert(`Successfully cleared lab session data for ${f.name || f.email}. You can now upload new Excel file(s) for this faculty.`);
                                } else {
                                  alert(res.error || 'Failed to clear faculty data');
                                }
                                setDeleteLoading(false);
                              }
                            }}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Clear Lab Sessions/Data to Re-Upload"
                          >
                            Reset Data
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to completely remove faculty member ${f.name || f.email} from database?`)) {
                                setDeleteLoading(true);
                                const res = await deleteFaculty(f.id);
                                if (!res.success) {
                                  alert(res.error || 'Failed to delete faculty');
                                }
                                setDeleteLoading(false);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
                            title="Remove Faculty Profile"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================= PAGE: UPLOAD DATA ============================= */}
      {tab === 'upload' && (
        <div className="space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setUploadMode('excel')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                uploadMode === 'excel'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel File Upload
            </button>
            <button
              onClick={() => setUploadMode('form')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                uploadMode === 'form'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Manual Form Filling (Fallback)
            </button>
          </div>

          {/* EXCEL UPLOAD MODE */}
          {uploadMode === 'excel' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Excel Data Upload & Drag-and-Drop
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload an Excel spreadsheet (.xlsx / .xls) containing staff and student details. If any columns are missing, switch to Manual Form Filling above.
                </p>
              </div>

              {/* Expected Format Info */}
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-blue-900">Supported Excel Columns:</p>
                  <span className="px-2 py-0.5 bg-blue-200 text-blue-900 rounded font-black text-[10px]">
                    Student-Only Excel Supported!
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Your Excel file can contain <strong>ONLY Section, Student Name, Roll No, and Register Number</strong>. Staff and lab details specified below will be assigned automatically!
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {['Section Name', 'Student Name', 'Roll No', 'Register Number'].map(col => (
                    <span key={col} className="bg-white px-2 py-1 rounded-lg border border-blue-200 text-blue-900 font-bold text-[10px] text-center shadow-xs">{col}</span>
                  ))}
                </div>
              </div>

              {/* Manual Common Details Form for Excel Upload */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Common Faculty & Lab Details (Assigned to Imported Students)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Fill if Excel lacks staff/lab columns</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Staff Name</label>
                    <input
                      type="text"
                      value={excelDefaults.defaultStaffName}
                      onChange={e => setExcelDefaults(p => ({ ...p, defaultStaffName: e.target.value }))}
                      placeholder="e.g. Dr. Ramesh Kumar"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Staff Mail ID *</label>
                    <input
                      type="email"
                      value={excelDefaults.defaultStaffEmail}
                      onChange={e => setExcelDefaults(p => ({ ...p, defaultStaffEmail: e.target.value }))}
                      placeholder="ramesh.kumar@college.edu"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Code & Name</label>
                    <input
                      type="text"
                      value={excelDefaults.defaultSubjectName}
                      onChange={e => setExcelDefaults(p => ({ ...p, defaultSubjectName: e.target.value }))}
                      placeholder="e.g. Data Structures Lab (AD3311)"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lab Name & Floor</label>
                    <input
                      type="text"
                      value={excelDefaults.defaultLabName}
                      onChange={e => setExcelDefaults(p => ({ ...p, defaultLabName: e.target.value }))}
                      placeholder="e.g. AI Lab 1 (Floor 2)"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lab Timing</label>
                    <input
                      type="text"
                      value={excelDefaults.defaultTiming}
                      onChange={e => setExcelDefaults(p => ({ ...p, defaultTiming: e.target.value }))}
                      placeholder="Monday 09:00 AM - 11:00 AM"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Batch / Academic Year</label>
                    <input
                      type="text"
                      value={excelDefaults.defaultBatch}
                      onChange={e => setExcelDefaults(p => ({ ...p, defaultBatch: e.target.value }))}
                      placeholder="Batch 2024-2028"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department (Manual Entry)</label>
                    <input
                      type="text"
                      value={excelDefaults.defaultDepartment}
                      onChange={e => setExcelDefaults(p => ({ ...p, defaultDepartment: e.target.value }))}
                      placeholder="e.g. Artificial Intelligence & Data Science"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setUploadDragging(true); }}
                onDragLeave={() => setUploadDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setUploadDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                    setUploadFile(file);
                    setUploadResult(null);
                  }
                }}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                  uploadDragging
                    ? 'border-blue-400 bg-blue-50/40 scale-[1.01]'
                    : uploadFile
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-200 bg-slate-50/30 hover:border-slate-300'
                }`}
              >
                <input
                  id="excel-upload-input"
                  type="file"
                  accept=".xlsx,.xls"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      setUploadResult(null);
                    }
                  }}
                />
                <div className="flex flex-col items-center gap-3">
                  {uploadFile ? (
                    <>
                      <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                        <FileSpreadsheet className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-emerald-800">{uploadFile.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{(uploadFile.size / 1024).toFixed(1)} KB • Ready to upload</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-slate-100 text-slate-400 rounded-xl">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-600">Drag & Drop your Excel file here</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">or click to browse • .xlsx / .xls files supported</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Upload Actions */}
              <div className="flex items-center gap-3">
                <button
                  disabled={!uploadFile || uploadLoading}
                  onClick={async () => {
                    if (!uploadFile) return;
                    setUploadLoading(true);
                    setUploadResult(null);
                    const result = await uploadExcelProvisioning(uploadFile, excelDefaults);
                    if (result.success) {
                      setUploadResult({
                        type: 'success',
                        summary: result.summary,
                        text: `Successfully processed ${result.summary?.totalRows || 0} rows.`,
                      });
                      setUploadFile(null);
                      const input = document.getElementById('excel-upload-input') as HTMLInputElement;
                      if (input) input.value = '';
                    } else {
                      setUploadResult({ type: 'error', text: result.error || 'Upload failed.' });
                    }
                    setUploadLoading(false);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {uploadLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing File...</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Process & Upload Excel</>
                  )}
                </button>
                {uploadFile && (
                  <button
                    onClick={() => {
                      setUploadFile(null);
                      setUploadResult(null);
                      const input = document.getElementById('excel-upload-input') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Remove Selected File
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MANUAL FORM FILLING MODE (FALLBACK) */}
          {uploadMode === 'form' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" /> Manual Provisioning Entry Form
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Use this form to enter staff & student details manually if your Excel sheet does not contain all required columns.
                </p>
              </div>

              {manualMsg && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold border ${
                  manualMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {manualMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {manualMsg.text}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!manualForm.staffEmail) {
                    setManualMsg({ type: 'error', text: 'Staff Mail ID is required.' });
                    return;
                  }
                  setManualLoading(true);
                  setManualMsg(null);
                  const res = await manualProvisionData(manualForm);
                  if (res.success) {
                    setManualMsg({ type: 'success', text: 'Provisioning entry added successfully!' });
                    setManualForm({
                      staffName: '', staffEmail: '', subjectCode: '', subjectName: '',
                      labLocation: '', labName: '', floor: '', timing: '', batch: '', sectionName: '',
                      studentName: '', rollNo: '', registerNo: '', phoneNumber: ''
                    });
                  } else {
                    setManualMsg({ type: 'error', text: res.error || 'Failed to save entry.' });
                  }
                  setManualLoading(false);
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {/* Staff Details */}
                <div className="sm:col-span-3 pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">1. Staff & Subject Information</h4>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Staff Name</label>
                  <input
                    type="text"
                    value={manualForm.staffName}
                    onChange={e => setManualForm(p => ({ ...p, staffName: e.target.value }))}
                    placeholder="e.g. Dr. Ramesh Kumar"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Staff Mail ID *</label>
                  <input
                    type="email" required
                    value={manualForm.staffEmail}
                    onChange={e => setManualForm(p => ({ ...p, staffEmail: e.target.value }))}
                    placeholder="ramesh.kumar@college.edu"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Code</label>
                  <input
                    type="text"
                    value={manualForm.subjectCode}
                    onChange={e => setManualForm(p => ({ ...p, subjectCode: e.target.value }))}
                    placeholder="e.g. AD3311"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={manualForm.subjectName}
                    onChange={e => setManualForm(p => ({ ...p, subjectName: e.target.value }))}
                    placeholder="e.g. Data Structures Laboratory"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lab Name</label>
                  <input
                    type="text"
                    value={manualForm.labName}
                    onChange={e => setManualForm(p => ({ ...p, labName: e.target.value }))}
                    placeholder="e.g. AI & DS Main Lab 1"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lab Location & Floor</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualForm.labLocation}
                      onChange={e => setManualForm(p => ({ ...p, labLocation: e.target.value }))}
                      placeholder="Block B"
                      className="w-2/3 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="text"
                      value={manualForm.floor}
                      onChange={e => setManualForm(p => ({ ...p, floor: e.target.value }))}
                      placeholder="2nd Floor"
                      className="w-1/3 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Timing of Lab Section</label>
                  <input
                    type="text"
                    value={manualForm.timing}
                    onChange={e => setManualForm(p => ({ ...p, timing: e.target.value }))}
                    placeholder="Monday 09:00 AM - 11:00 AM"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Batch & Section Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualForm.batch}
                      onChange={e => setManualForm(p => ({ ...p, batch: e.target.value }))}
                      placeholder="Batch 2024-2028"
                      className="w-1/2 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="text"
                      value={manualForm.sectionName}
                      onChange={e => setManualForm(p => ({ ...p, sectionName: e.target.value }))}
                      placeholder="Section A"
                      className="w-1/2 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                {/* Student Details */}
                <div className="sm:col-span-3 pt-3 pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">2. Student Assignment (Optional)</h4>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Student Name</label>
                  <input
                    type="text"
                    value={manualForm.studentName}
                    onChange={e => setManualForm(p => ({ ...p, studentName: e.target.value }))}
                    placeholder="e.g. Arun Kumar"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Roll No & Register No</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualForm.rollNo}
                      onChange={e => setManualForm(p => ({ ...p, rollNo: e.target.value }))}
                      placeholder="Roll No"
                      className="w-1/2 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    <input
                      type="text"
                      value={manualForm.registerNo}
                      onChange={e => setManualForm(p => ({ ...p, registerNo: e.target.value }))}
                      placeholder="Register No"
                      className="w-1/2 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={manualForm.phoneNumber}
                    onChange={e => setManualForm(p => ({ ...p, phoneNumber: e.target.value }))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={manualLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {manualLoading ? 'Saving Entry...' : 'Save Provisioning Entry'}
                  </button>
                </div>
              </form>
            </div>
          )}

            {/* Upload Result */}
            {uploadResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-3 ${
                uploadResult.type === 'success'
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-rose-50 border-rose-100'
              }`}>
                <div className="flex items-start gap-2">
                  {uploadResult.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-bold text-sm ${uploadResult.type === 'success' ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {uploadResult.type === 'success' ? 'Upload Successful!' : 'Upload Failed'}
                    </p>
                    <p className={uploadResult.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}>
                      {uploadResult.text}
                    </p>
                  </div>
                </div>

                {/* Detailed Summary */}
                {uploadResult.summary && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-emerald-100">
                    <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
                      <p className="text-lg font-extrabold text-slate-800">{uploadResult.summary.totalRows}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Total Rows</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
                      <p className="text-lg font-extrabold text-emerald-700">{uploadResult.summary.facultiesCreated}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Faculty Created</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
                      <p className="text-lg font-extrabold text-blue-700">{uploadResult.summary.facultiesUpdated}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Faculty Updated</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
                      <p className="text-lg font-extrabold text-emerald-700">{uploadResult.summary.studentsCreated}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Students Created</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-emerald-100 text-center">
                      <p className="text-lg font-extrabold text-blue-700">{uploadResult.summary.studentsUpdated}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">Students Updated</p>
                    </div>
                  </div>
                )}

                {/* Errors */}
                {uploadResult.summary?.errors?.length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 space-y-1 max-h-36 overflow-y-auto shadow-inner">
                    <p className="font-extrabold text-amber-900 text-[10px] uppercase tracking-wider">Parse Warnings ({uploadResult.summary.errors.length})</p>
                    {uploadResult.summary.errors.map((err: string, i: number) => (
                      <p key={i} className="text-amber-800 text-[11px] font-medium">{err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

          {/* Recently Provisioned Faculty */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">Provisioned Faculty Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">All faculty members currently in the system — uploaded or manually added.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Lab</th>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-left">Batch</th>
                    <th className="px-4 py-3 text-center">Sessions</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {faculties.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-500">{f.id}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{f.name}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{f.email}</td>
                      <td className="px-4 py-3 text-slate-600">{f.labName}</td>
                      <td className="px-4 py-3 text-slate-600">{f.subjectsHandled?.[0] || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{f.batch}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[10px]">
                          {f.timetable?.length || 0} slots
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(f as any).isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold text-[10px]">
                            <Activity className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================= PAGE 4: SETTINGS ============================= */}
      {tab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Photo Upload */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" /> HOD Profile Photo
              </h3>
              <p className="text-xs text-slate-400 mt-1">Upload a official profile image (Max file size: 10MB).</p>
            </div>

            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-500 bg-[#0B192C] flex items-center justify-center shadow-lg relative">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-2xl uppercase">{user.name.charAt(0) || 'H'}</span>
                )}
              </div>

              {picMsg && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold border text-center ${
                  picMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                  {picMsg.text}
                </div>
              )}

              <label className="w-full">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) {
                      setPicMsg({ type: 'error', text: 'Image exceeds 10MB limit.' });
                      return;
                    }
                    setPicLoading(true);
                    setPicMsg(null);
                    const res = await uploadProfilePic(file);
                    if (res.success) {
                      setPicMsg({ type: 'success', text: 'Profile picture updated!' });
                    } else {
                      setPicMsg({ type: 'error', text: res.error || 'Upload failed.' });
                    }
                    setPicLoading(false);
                  }}
                />
                <div className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold text-center border border-indigo-200 transition cursor-pointer">
                  {picLoading ? 'Uploading Photo...' : 'Choose Profile Photo (Max 10MB)'}
                </div>
              </label>
            </div>
          </div>

          {/* Academic Settings & Theme */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Academic Parameters & Theme
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure evaluation parameters and display mode.</p>
            </div>

            <form onSubmit={e => { e.preventDefault(); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Display Theme Mode</label>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-between"
                >
                  <span>Active Theme: <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong></span>
                  <span className="text-indigo-600">Toggle Theme 🌙☀️</span>
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Active Semester</label>
                <select
                  value={academicTerm}
                  onChange={e => setAcademicTerm(e.target.value)}
                  className="w-full border border-slate-200 text-xs font-bold text-slate-700 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                >
                  <option value="Odd Semester 2026">Odd Semester 2026 (July – Dec)</option>
                  <option value="Even Semester 2026">Even Semester 2026 (Jan – June)</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input id="auto-sms" type="checkbox" className="rounded" defaultChecked />
                <label htmlFor="auto-sms" className="text-xs font-semibold text-slate-600">Auto-flag low attendance students</label>
              </div>
              {saveSuccess ? (
                <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-center text-xs font-bold text-emerald-800 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Settings saved!
                </div>
              ) : (
                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer">
                  Save Parameters
                </button>
              )}
            </form>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Change Admin Password
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Update credentials for your HOD admin account (<strong>admin</strong> / <strong>hod@college.edu</strong>).
              </p>
            </div>

            {pwMsg && (
              <div className={`p-3 rounded-xl flex items-start gap-2 text-xs font-semibold border ${
                pwMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                {pwMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type={showOld ? 'text' : 'password'} required value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                  <button type="button" onClick={() => setShowOld(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showOld ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type={showNew ? 'text' : 'password'} required value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                    {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="password" required value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {pwLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
