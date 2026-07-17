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
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function HodDashboard() {
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { students, faculties, getDepartmentMetrics, addPreApprovedFaculty, changeAdminPassword, refreshData } = useAcademicData();

  // Resolve active tab
  const validTabs: TabKey[] = ['overview', 'monitoring', 'access', 'settings'];
  const tab: TabKey = (urlTab && validTabs.includes(urlTab as TabKey) ? urlTab : 'overview') as TabKey;

  // Overview derived state from server stats
  const [serverStats, setServerStats] = useState<any>(null);

  // Faculty monitoring search
  const [monitorSearch, setMonitorSearch] = useState('');

  // Faculty access tab state
  const [accessSearch, setAccessSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '', phone: '', labName: '', subject: '', subjectCode: '',
    batch: '', sections: '',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-50 border border-slate-100 rounded-2xl p-1 w-full sm:w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => navigateTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              tab === key
                ? 'bg-white text-blue-700 shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
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
              <div className="p-3 bg-amber-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-amber-700">{serverStats?.riskStudents ?? metrics.totalAtRisk}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">At-Risk Students</p>
                <p className="text-[10px] text-slate-400">Needs attention</p>
              </div>
            </div>
          </div>

          {/* At-Risk Alert */}
          {(serverStats?.riskStudents ?? metrics.totalAtRisk) > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-amber-950 text-sm">Student Risk Warning</h5>
                  <p className="text-amber-700 mt-0.5">
                    <strong>{serverStats?.riskStudents ?? metrics.totalAtRisk} students</strong> flagged for low attendance or low lab completion.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/hod/students')}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-center"
              >
                Review Flagged Students
              </button>
            </div>
          )}

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
              <h3 className="text-base font-extrabold text-slate-800">Faculty Profile Monitoring</h3>
              <p className="text-xs text-slate-500 mt-0.5">View all registered faculty with attendance, observation & record rates.</p>
            </div>
            <input
              type="text"
              placeholder="Search faculty..."
              value={monitorSearch}
              onChange={e => setMonitorSearch(e.target.value)}
              className="w-full sm:w-56 px-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 font-medium"
            />
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
                    <th className="px-4 py-3 text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Faculty Att.</th>
                    <th className="px-4 py-3 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Observations %</th>
                    <th className="px-4 py-3 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Records %</th>
                    <th className="px-4 py-3 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFacultyMonitor.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-400 font-semibold">No faculty found.</td></tr>
                  )}
                  {filteredFacultyMonitor.map((f) => (
                    <tr
                      key={f.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => navigate(`/hod/faculty/${f.id}`)}
                    >
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-bold text-slate-800">{f.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{f.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {(f as any).phone || <span className="text-slate-300 italic">N/A</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFacultyAccess.length === 0 && (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400 font-semibold">No faculty pre-approved yet.</td></tr>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academic Settings */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" /> Academic Parameters
              </h3>
              <p className="text-xs text-slate-400 mt-1">Configure evaluation cycles and attendance thresholds.</p>
            </div>

            <form onSubmit={e => { e.preventDefault(); setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000); }} className="space-y-4">
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
                Update credentials for your HOD admin account. Works for both <strong>admin</strong> and <strong>hod@college.edu</strong> accounts.
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
