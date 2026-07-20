const fs = require('fs');

const adminPath = 'src/pages/AdminDashboard.tsx';
const hodPath = 'src/pages/HodDashboard.tsx';

let adminSrc = fs.readFileSync(adminPath, 'utf8');
let hodSrc = fs.readFileSync(hodPath, 'utf8');

// 1. Combine Imports
const extraImports = `import { useAcademicData } from '../context/AcademicDataContext';
import { getFacultyRollup, Faculty } from '../data';
import { BarChart2, UserPlus, Activity, Eye, EyeOff, ShieldCheck, AlertTriangle, TrendingUp, GraduationCap, Percent, AlertCircle, Building2, Lock, Mail, Phone, CheckCircle2, RefreshCw } from 'lucide-react';
`;

adminSrc = adminSrc.replace("import { LayoutDashboard", extraImports + "import { LayoutDashboard");

// 2. Add Tabs
adminSrc = adminSrc.replace(
  "] as const;",
  `  { key: 'monitoring', label: 'Faculty Monitoring', icon: BarChart2 },
  { key: 'access', label: 'Faculty Access', icon: UserPlus },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;`
);

adminSrc = adminSrc.replace(
  "['overview', 'batches', 'timetables', 'builder', 'subjects'];",
  "['overview', 'batches', 'timetables', 'builder', 'subjects', 'monitoring', 'access', 'settings'];"
);

// 3. Add Contexts to AdminDashboard component
const contextStr = `
  const { students, faculties, getDepartmentMetrics, addPreApprovedFaculty, changeAdminPassword, refreshData } = useAcademicData();
  const [serverStats, setServerStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/academic/stats', { headers: getAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setServerStats(d); })
      .catch(() => {});
  }, [user.token, faculties]);
`;

adminSrc = adminSrc.replace("const { user, getAuthHeaders } = useAuth();", "const { user, getAuthHeaders } = useAuth();" + contextStr);

// 4. Update Overview Tab Props to pass stats
adminSrc = adminSrc.replace(
  "<OverviewTab batches={batches} sections={sections} subjects={subjects} structures={structures} />",
  "<OverviewTab batches={batches} sections={sections} subjects={subjects} structures={structures} faculties={faculties} students={students} serverStats={serverStats} metrics={getDepartmentMetrics()} />"
);

// 5. Add new Tabs renders
const newTabsRender = `
        {tab === 'monitoring' && <MonitoringTab faculties={faculties} students={students} serverStats={serverStats} metrics={getDepartmentMetrics()} />}
        {tab === 'access' && <AccessTab faculties={faculties} addPreApprovedFaculty={addPreApprovedFaculty} />}
        {tab === 'settings' && <SettingsTab changeAdminPassword={changeAdminPassword} />}
`;
adminSrc = adminSrc.replace(
  "{tab === 'subjects' && <SubjectsTab subjects={subjects} onUpdate={fetchData} getAuthHeaders={getAuthHeaders} />}",
  "{tab === 'subjects' && <SubjectsTab subjects={subjects} onUpdate={fetchData} getAuthHeaders={getAuthHeaders} />}\n" + newTabsRender
);

// 6. Rewrite OverviewTab to include HOD overview stats
const newOverviewTab = `
function OverviewTab({ batches, sections, subjects, structures, faculties, students, serverStats, metrics }: any) {
  const activeFaculties = (serverStats?.activeFaculties ?? faculties.filter((f:any) => f.isActive).length);
  const totalFaculties = serverStats?.totalFaculties ?? faculties.length;
  const overallAvg = serverStats?.avgAttendance ?? metrics.avgAttendance;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Batches" value={batches.length} icon={Users} color="blue" />
        <StatCard title="Total Sections" value={sections.length} icon={LayoutDashboard} color="emerald" />
        <StatCard title="Active Faculties" value={activeFaculties + ' / ' + totalFaculties} icon={Users} color="indigo" />
        <StatCard title="Total Students" value={serverStats?.totalStudents ?? students.length} icon={GraduationCap} color="emerald" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Timetable Structures" value={structures.length} icon={Clock} color="indigo" />
        <StatCard title="Subjects" value={subjects.length} icon={BookOpen} color="amber" />
        <StatCard title="Overall Attendance" value={overallAvg + '%'} icon={Percent} color={overallAvg >= 75 ? 'emerald' : 'rose'} />
        <StatCard title="At-Risk Students" value={serverStats?.riskStudents ?? metrics.totalAtRisk} icon={AlertCircle} color="amber" />
      </div>
    </div>
  );
}
`;
adminSrc = adminSrc.replace(/function OverviewTab[\s\S]*?function StatCard/m, newOverviewTab + "\nfunction StatCard");

// 7. Extract Monitoring, Access, and Settings components from HodDashboard
// We will extract the JSX for these tabs and wrap them in functional components.

const monitoringStart = hodSrc.indexOf("{/* ============================= PAGE 2: FACULTY MONITORING ============================= */}");
const accessStart = hodSrc.indexOf("{/* ============================= PAGE 3: FACULTY ACCESS ============================= */}");
const settingsStart = hodSrc.indexOf("{/* ============================= PAGE 4: SETTINGS ============================= */}");
const settingsEnd = hodSrc.lastIndexOf("</div>"); // approximate end before final return

let monitoringJsx = hodSrc.substring(hodSrc.indexOf("{tab === 'monitoring' && (") + "{tab === 'monitoring' && (".length, accessStart);
monitoringJsx = monitoringJsx.trim();
if (monitoringJsx.endsWith(")}")) {
  monitoringJsx = monitoringJsx.substring(0, monitoringJsx.length - 2);
}

let accessJsx = hodSrc.substring(hodSrc.indexOf("{tab === 'access' && (") + "{tab === 'access' && (".length, settingsStart);
accessJsx = accessJsx.trim();
if (accessJsx.endsWith(")}")) {
  accessJsx = accessJsx.substring(0, accessJsx.length - 2);
}

let settingsJsx = hodSrc.substring(hodSrc.indexOf("{tab === 'settings' && (") + "{tab === 'settings' && (".length, settingsEnd);
settingsJsx = settingsJsx.trim();
if (settingsJsx.endsWith(")}")) {
  settingsJsx = settingsJsx.substring(0, settingsJsx.length - 2);
}
// Settings jsx might have extra closing tags, we will just take up to the second to last div.
settingsJsx = settingsJsx.substring(0, settingsJsx.lastIndexOf("</div>"));
settingsJsx = settingsJsx.substring(0, settingsJsx.lastIndexOf("</div>"));
settingsJsx += "</div></div>"; // patch up

const newComponents = `
// ---------------------------------------------------------------------------
// FACULTY MONITORING TAB
// ---------------------------------------------------------------------------
function MonitoringTab({ faculties, students, serverStats, metrics }: any) {
  const navigate = require('react-router-dom').useNavigate();
  const [monitorSearch, setMonitorSearch] = useState('');
  
  const facultyPerformanceData = faculties.map((f: any) => {
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

  const filteredFacultyMonitor = facultyPerformanceData.filter((f:any) =>
    f.name.toLowerCase().includes(monitorSearch.toLowerCase()) ||
    f.email.toLowerCase().includes(monitorSearch.toLowerCase())
  );

  const activeFaculties = (serverStats?.activeFaculties ?? faculties.filter((f:any) => f.isActive).length);
  const totalFaculties = serverStats?.totalFaculties ?? faculties.length;
  const overallAvg = serverStats?.avgAttendance ?? metrics.avgAttendance;

  return (
    ${monitoringJsx}
  );
}

// ---------------------------------------------------------------------------
// FACULTY ACCESS TAB
// ---------------------------------------------------------------------------
function AccessTab({ faculties, addPreApprovedFaculty }: any) {
  const [accessSearch, setAccessSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', phone: '', labName: '', subject: '', subjectCode: '', batch: '', sections: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredFacultyAccess = faculties.filter((f:any) =>
    f.name.toLowerCase().includes(accessSearch.toLowerCase()) ||
    f.email.toLowerCase().includes(accessSearch.toLowerCase())
  );

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddMsg(null);
    const res = await addPreApprovedFaculty(addForm);
    if (res.success) {
      setAddMsg({ type: 'success', text: \`Faculty access stub created for \${addForm.email}. They can now register using this email.\` });
      setAddForm({ email: '', phone: '', labName: '', subject: '', subjectCode: '', batch: '', sections: '' });
      setShowAddForm(false);
    } else {
      setAddMsg({ type: 'error', text: res.error || 'Failed to add faculty.' });
    }
    setAddLoading(false);
  };

  return (
    ${accessJsx}
  );
}

// ---------------------------------------------------------------------------
// SETTINGS TAB
// ---------------------------------------------------------------------------
function SettingsTab({ changeAdminPassword }: any) {
  const [academicTerm, setAcademicTerm] = useState('Odd Semester 2026');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  return (
    ${settingsJsx}
  );
}
`;

adminSrc += "\n" + newComponents;

fs.writeFileSync('src/pages/AdminDashboard.tsx', adminSrc);
console.log('Merge complete!');
