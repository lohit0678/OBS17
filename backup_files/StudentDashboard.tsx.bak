import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import { MetricCard, RiskBadge } from '../components/shared';
import {
  Percent,
  Award,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  Clock,
  MapPin,
  ClipboardList,
  User as UserIcon,
  BookOpen,
  FileText,
  MessageSquare,
  Medal,
  Settings as SettingsIcon,
  Check,
  X,
  Upload,
  Download,
  Calendar,
  Lock,
  Mail,
  Phone,
  Shield,
  FileCheck,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function StudentDashboard() {
  const { tab = 'dashboard' } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getStudentData, getFacultyData, submitLabExperiment, submitAssignment } = useAcademicData();

  const student = getStudentData(user.id);
  const advisor = student ? getFacultyData(student.facultyId) : null;

  // File Upload states (with real drag & drop support)
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [selectedAsgId, setSelectedAsgId] = useState<string | null>(null);
  const [simulatedFile, setSimulatedFile] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Settings states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  // Certificates list
  const [certTitle, setCertTitle] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certType, setCertType] = useState<'workshop' | 'symposium' | 'completion' | 'event'>('workshop');
  const [certDate, setCertDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [certificates, setCertificates] = useState(student?.certificates || []);

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800">Student Profile Not Found</h2>
        <p className="text-slate-500 mt-2">Could not load academic data for student ID: {user.id}.</p>
      </div>
    );
  }

  // Derived calculations
  const totalLabs = student.experiments.length;
  const approvedLabs = student.experiments.filter(e => e.status === 'Approved').length;
  const labCompletionRate = totalLabs > 0 ? Math.round((approvedLabs / totalLabs) * 100) : 0;

  const totalAsgs = student.assignments.length;
  const completedAsgs = student.assignments.filter(a => a.status === 'Graded' || a.status === 'Submitted').length;
  const asgCompletionRate = totalAsgs > 0 ? Math.round((completedAsgs / totalAsgs) * 100) : 0;

  const marksSubjects = Object.keys(student.internalMarks);
  const totalAvgMarks = marksSubjects.length > 0 
    ? Math.round(marksSubjects.reduce((acc, sub) => acc + student.internalMarks[sub].average, 0) / marksSubjects.length)
    : 0;

  const pendingLabs = student.experiments.filter(e => e.status === 'Not Submitted' || e.status === 'Rejected').length;
  const pendingAssignments = student.assignments.filter(a => a.status === 'Pending').length;
  const upcomingExamsCount = student.calendarEvents.filter(e => e.type === 'exam' || e.type === 'practical').length;

  // Pie Chart Attendance Data
  const presentCount = student.attendanceHistory.filter(h => h.status === 'Present').length;
  const absentCount = student.attendanceHistory.filter(h => h.status === 'Absent').length;
  const attendancePieData = [
    { name: 'Present Labs', value: presentCount, color: '#10B981' }, // Emerald
    { name: 'Absent Labs', value: absentCount, color: '#EF4444' }, // Rose
  ];

  // Bar Chart Performance Data
  const marksChartData = Object.keys(student.internalMarks).map(subject => ({
    subject,
    "CIA-1": student.internalMarks[subject].cia1,
    "CIA-2": student.internalMarks[subject].cia2,
    "CIA-3": student.internalMarks[subject].cia3,
    "Practical": student.internalMarks[subject].practical,
  }));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      setSimulatedFile(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setSimulatedFile(file.name);
    }
  };

  const handleLabUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpId || (!uploadedFile && !simulatedFile)) return;
    const finalFilename = uploadedFile ? uploadedFile.name : simulatedFile;

    setIsUploading(true);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 20;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      submitLabExperiment(student.id, selectedExpId, finalFilename, 'submitted_record.pdf');
      setUploadSuccess(true);
      setIsUploading(false);
      setTimeout(() => {
        setUploadSuccess(false);
        setSelectedExpId(null);
        setSimulatedFile('');
        setUploadedFile(null);
        setUploadProgress(0);
      }, 1500);
    }, 900);
  };

  const handleAsgUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsgId || (!uploadedFile && !simulatedFile)) return;
    const finalFilename = uploadedFile ? uploadedFile.name : simulatedFile;

    setIsUploading(true);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 25;
      });
    }, 120);

    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      submitAssignment(student.id, selectedAsgId, finalFilename);
      setUploadSuccess(true);
      setIsUploading(false);
      setTimeout(() => {
        setUploadSuccess(false);
        setSelectedAsgId(null);
        setSimulatedFile('');
        setUploadedFile(null);
        setUploadProgress(0);
      }, 1500);
    }, 800);
  };

  const handlePassChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setPassMessage('Passwords do not match or are empty.');
      return;
    }
    setPassMessage('Password updated successfully in secure session storage!');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle || !certIssuer) return;
    const newCert = {
      id: `cert-new-${Date.now()}`,
      title: certTitle,
      issuer: certIssuer,
      date: certDate,
      type: certType,
    };
    setCertificates([newCert, ...certificates]);
    setCertTitle('');
    setCertIssuer('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Student Gateway</span>
            <span className="text-indigo-600">ERP Terminal</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Logged in as: <strong className="text-slate-800">{student.name}</strong> ({student.registerNo}) &bull; Semester: {student.semester}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Advisor:</span>
          <span className="bg-[#0B192C] text-indigo-300 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
            {student.facultyName}
          </span>
        </div>
      </div>

      {/* Risk Alert */}
      {student.riskFlagged && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3.5 text-rose-800 text-xs shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h5 className="font-bold text-rose-950 text-sm">Action Advisory: Attendance or Completion Warning</h5>
            <p className="text-rose-700 mt-1 leading-relaxed">
              {student.riskReason || "Your attendance rate or lab completion rate is below the college standards."} Please meet with your Faculty Advisor immediately.
            </p>
          </div>
        </div>
      )}

      {/* RENDER THE REQUESTED TAB VIEW */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            <MetricCard
              title="Overall Attendance"
              value={`${student.attendance}%`}
              subtitle="Target threshold > 75%"
              icon={<Percent className="w-5 h-5" />}
              iconBgColor={student.attendance >= 75 ? "bg-emerald-50" : "bg-rose-50"}
              iconColor={student.attendance >= 75 ? "text-emerald-600" : "text-rose-600"}
            />
            <MetricCard
              title="Laboratory Completion"
              value={`${labCompletionRate}%`}
              subtitle={`${approvedLabs} of ${totalLabs} approved`}
              icon={<FileCheck className="w-5 h-5" />}
              iconBgColor="bg-blue-50"
              iconColor="text-blue-600"
            />
            <MetricCard
              title="Assignment Completion"
              value={`${asgCompletionRate}%`}
              subtitle={`${completedAsgs} of ${totalAsgs} done`}
              icon={<BookOpen className="w-5 h-5" />}
              iconBgColor="bg-indigo-50"
              iconColor="text-indigo-600"
            />
            <MetricCard
              title="Internal Marks Average"
              value={`${totalAvgMarks}/100`}
              subtitle="Continuous Assessment Avg"
              icon={<Award className="w-5 h-5" />}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-600"
            />
            <MetricCard
              title="Pending Lab Records"
              value={pendingLabs}
              subtitle="Entries due for evaluation"
              icon={<ClipboardList className="w-5 h-5" />}
              iconBgColor={pendingLabs > 0 ? "bg-rose-50" : "bg-emerald-50"}
              iconColor={pendingLabs > 0 ? "text-rose-600" : "text-emerald-600"}
            />
            <MetricCard
              title="Pending Assignments"
              value={pendingAssignments}
              subtitle="Awaiting solutions"
              icon={<FileText className="w-5 h-5" />}
              iconBgColor={pendingAssignments > 0 ? "bg-amber-50" : "bg-emerald-50"}
              iconColor={pendingAssignments > 0 ? "text-amber-600" : "text-emerald-600"}
            />
            <MetricCard
              title="Upcoming Practical Exams"
              value={upcomingExamsCount}
              subtitle="Lab evaluation schedules"
              icon={<CalendarDays className="w-5 h-5" />}
              iconBgColor="bg-purple-50"
              iconColor="text-purple-600"
            />
          </div>

          {/* Visual Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Pie */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Lab Attendance Breakdown</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Session-wise check-ins out of total labs</p>
              </div>
              <div className="h-64 relative flex items-center justify-center">
                {presentCount + absentCount > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {attendancePieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Labs`, 'Sessions']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">No records found.</p>
                )}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-800">{student.attendance}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate</span>
                </div>
              </div>
            </div>

            {/* Assessment Marks Bar */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Continuous Assessments (CIA)</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">CIA marks (out of 50) and practical evaluation progress</p>
              </div>
              <div className="h-64">
                {marksChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marksChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="CIA-1" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="CIA-2" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="CIA-3" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400 font-medium text-center py-20">No assessment data.</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Schedule & Notices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notices feed */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Department Announcements</h3>
              <div className="space-y-3">
                {student.notifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100/60 hover:border-slate-200 transition">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-[#0B192C] text-indigo-300 uppercase">
                        {notif.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{notif.date}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{notif.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-indigo-600 font-bold mt-2">Posted by: {notif.sender}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Practical Deadlines */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Experiment Records Due</h3>
              <div className="space-y-3">
                {student.experiments.filter(e => e.status === 'Not Submitted').map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">{exp.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        Deadline: {exp.dueDate}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedExpId(exp.id);
                        navigate('/student/laboratory-record');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>
                ))}
                {student.experiments.filter(e => e.status === 'Not Submitted').length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-400 font-medium">All assigned experiments submitted! Great job!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
            <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-md uppercase border-4 border-slate-50">
              {student.name.charAt(0)}
            </div>
            <div className="text-center md:text-left space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
              <p className="text-indigo-600 font-semibold text-sm">{student.registerNo} &bull; Roll No: {student.rollNo}</p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{student.department}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Academic Registration Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Department</span>
                  <span className="text-slate-800 font-bold">{student.department}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Semester</span>
                  <span className="text-slate-800 font-bold">{student.semester}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Section / Group</span>
                  <span className="text-slate-800 font-bold">{student.section}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Laboratory Batch</span>
                  <span className="text-slate-800 font-bold">{student.batch}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Date of Birth</span>
                  <span className="text-slate-800 font-bold">{student.id === 'S102' ? '12th March 2005' : '15th August 2005'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Gender</span>
                  <span className="text-slate-800 font-bold">{student.id === 'S102' ? 'Male' : 'Female'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contact & Guardian Info</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Personal Phone</span>
                  <span className="text-slate-800 font-bold">{student.phone}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <span className="text-slate-800 font-bold">{student.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Parent/Guardian Name</span>
                  <span className="text-slate-800 font-bold">{student.parentName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50 text-xs">
                  <span className="text-slate-500 font-medium">Parent Contact Phone</span>
                  <span className="text-slate-800 font-bold">{student.parentPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Laboratory Attendance Journal</h3>
              <p className="text-xs text-slate-400 mt-1">Official register history of check-ins during laboratory hours</p>
            </div>
            <div className={`p-3 rounded-2xl text-center border font-extrabold text-sm ${student.attendance >= 75 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
              <span className="block text-2xl leading-none">{student.attendance}%</span>
              <span className="text-[10px] uppercase font-bold tracking-wider mt-1 block">Cumulative Rate</span>
            </div>
          </div>

          {/* Subject-wise attendance */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Subject-wise Laboratory Attendance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.keys(student.subjectAttendance).map(subj => (
                <div key={subj} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{subj}</h5>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">AI & DS Dept course</p>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <span className={`text-lg font-extrabold ${student.subjectAttendance[subj] >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {student.subjectAttendance[subj]}%
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      {student.subjectAttendance[subj] >= 75 ? 'Qualified' : 'Shortage'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session History Log */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Session Log</h4>
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="px-5 py-3.5">Session Date</th>
                    <th className="px-5 py-3.5">Lab Program</th>
                    <th className="px-5 py-3.5">Group Batch</th>
                    <th className="px-5 py-3.5">Attendance Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {student.attendanceHistory.map((hist, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-3 font-bold text-slate-700">{hist.date}</td>
                      <td className="px-5 py-3 text-slate-600">{student.labName}</td>
                      <td className="px-5 py-3 text-slate-600 font-semibold">{student.batch}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${hist.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${hist.status === 'Present' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {hist.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'laboratory-record' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Observation Notebook Matrix</h3>
              <p className="text-xs text-slate-400 mt-1">Submit your weekly Observation Notebook PDFs. Once approved (ticked) by faculty, you can write and submit the Record Notebook.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span>{approvedLabs} of {totalLabs} Observations Completed</span>
            </div>
          </div>

          {/* Submission Portal for Observation */}
          {selectedExpId && (
            <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-indigo-950 text-xs sm:text-sm">
                  Submitting Observation Notebook for: <span className="text-indigo-600">{student.experiments.find(e => e.id === selectedExpId)?.name}</span>
                </h4>
                <button onClick={() => { setSelectedExpId(null); setSimulatedFile(''); setUploadedFile(null); }} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
                  Cancel
                </button>
              </div>

              <form onSubmit={handleLabUpload} className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('lab-file-input')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 bg-white hover:border-indigo-400'
                  }`}
                >
                  <input
                    id="lab-file-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                  {uploadedFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-indigo-600 animate-bounce" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">{uploadedFile.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setSimulatedFile('');
                        }}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-bold"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : simulatedFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-indigo-600" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">{simulatedFile}</p>
                          <p className="text-[10px] text-slate-400 font-medium font-mono">Auto-prepared simulation template</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Click or Drag/Drop another file to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Drag & Drop Observation PDF here, or click to browse</p>
                      <p className="text-[10px] text-slate-400 font-medium font-mono">Supports PDF (Max 10MB)</p>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-indigo-600 font-mono">
                      <span>Uploading observation...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadSuccess ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Observation Notebook Submitted! Status set to Submitted - Pending.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading file...' : 'Submit Observation Notebook to Faculty'}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Unified Lab Progress Matrix Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-4 w-20 text-center">Week</th>
                  <th className="px-5 py-4">Lab Exercise Syllabus</th>
                  <th className="px-5 py-4 text-center">Observation Notebook Status</th>
                  <th className="px-5 py-4 text-center">Record Notebook Status</th>
                  <th className="px-5 py-4">Instructor Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {student.experiments.map((exp, index) => {
                  const asgId = "asg-" + exp.id.split("-")[1];
                  const asg = student.assignments.find(a => a.id === asgId);
                  const isObsApproved = exp.status === 'Approved';

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4 text-center font-bold text-slate-500">
                        Week {index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-slate-800">{exp.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider font-bold">Exercise {index + 1}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {exp.status === 'Approved' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-extrabold">
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ✓ Completed
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mt-1 font-mono block">
                              {exp.submittedAt || "2026-07-02"}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-extrabold block mt-0.5">
                              Score: {exp.score}/100
                            </span>
                          </div>
                        ) : exp.status === 'Submitted - Pending' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-[11px] font-bold animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              ⏳ Pending Check
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mt-1 font-mono block">
                              {exp.submittedAt || "2026-07-02"}
                            </span>
                          </div>
                        ) : exp.status === 'Rejected' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-full text-[11px] font-bold">
                              <X className="w-3.5 h-3.5 text-rose-500" />
                              ✗ Rejected
                            </span>
                            <button
                              onClick={() => {
                                setSelectedExpId(exp.id);
                                setSimulatedFile(`obs_${exp.id}.pdf`);
                              }}
                              className="mt-2 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                            >
                              Resubmit
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedExpId(exp.id);
                              setSimulatedFile(`obs_${exp.id}.pdf`);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
                          >
                            Upload PDF
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {!isObsApproved ? (
                          <div className="flex flex-col items-center justify-center text-slate-400/80">
                            <Lock className="w-4 h-4 text-slate-300" />
                            <span className="text-[9px] uppercase font-extrabold mt-1 text-slate-400 tracking-wider">Locked</span>
                          </div>
                        ) : asg?.status === 'Graded' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-extrabold">
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ✓ Record Completed
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mt-1 font-mono block">
                              {asg.submittedAt || "2026-07-02"}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-extrabold block mt-0.5">
                              Score: {asg.score}/50
                            </span>
                          </div>
                        ) : asg?.status === 'Submitted' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-[11px] font-bold animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              ⏳ Record Pending
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mt-1 font-mono block">
                              {asg.submittedAt || "2026-07-02"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAsgId(asgId);
                              setSimulatedFile(`sol_${asgId}.pdf`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
                          >
                            Upload Record
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 italic max-w-xs truncate" title={exp.remarks || asg?.remarks}>
                        <div className="space-y-1 text-left">
                          {exp.remarks && <p className="leading-tight"><strong className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Observation:</strong> {exp.remarks}</p>}
                          {asg?.remarks && <p className="leading-tight"><strong className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Record:</strong> {asg.remarks}</p>}
                          {!exp.remarks && !asg?.remarks && 'No feedback logged.'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'assignments' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Record Notebook Matrix</h3>
              <p className="text-xs text-slate-400 mt-1">Submit your Record Notebook write-ups. Record notebooks can only be unlocked and submitted after the corresponding Observation has been Approved (ticked).</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{completedAsgs} of {totalAsgs} Records Graded</span>
            </div>
          </div>

          {/* Submission Portal for Record */}
          {selectedAsgId && (
            <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-indigo-950 text-xs sm:text-sm">
                  Submitting Record Notebook for: <span className="text-indigo-600">{student.assignments.find(a => a.id === selectedAsgId)?.title}</span>
                </h4>
                <button onClick={() => { setSelectedAsgId(null); setSimulatedFile(''); setUploadedFile(null); }} className="text-xs text-slate-400 hover:text-slate-600 font-bold">
                  Cancel
                </button>
              </div>

              <form onSubmit={handleAsgUpload} className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('asg-file-input')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-slate-200 bg-white hover:border-indigo-400'
                  }`}
                >
                  <input
                    id="asg-file-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                  {uploadedFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-indigo-600 animate-bounce" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">{uploadedFile.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          setSimulatedFile('');
                        }}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-bold"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : simulatedFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-indigo-600" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">{simulatedFile}</p>
                          <p className="text-[10px] text-slate-400 font-medium font-mono">Auto-prepared simulation template</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Click or Drag/Drop another file to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Drag & Drop Record PDF here, or click to browse</p>
                      <p className="text-[10px] text-slate-400 font-medium font-mono">Supports PDF (Max 10MB)</p>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-indigo-600 font-mono">
                      <span>Uploading record...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadSuccess ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Record Notebook Submitted! Status set to Submitted.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading file...' : 'Submit Record Notebook to Faculty'}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Unified Lab Progress Matrix Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                  <th className="px-5 py-4 w-20 text-center">Week</th>
                  <th className="px-5 py-4">Lab Exercise Syllabus</th>
                  <th className="px-5 py-4 text-center">Observation Notebook Status</th>
                  <th className="px-5 py-4 text-center">Record Notebook Status</th>
                  <th className="px-5 py-4">Instructor Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {student.experiments.map((exp, index) => {
                  const asgId = "asg-" + exp.id.split("-")[1];
                  const asg = student.assignments.find(a => a.id === asgId);
                  const isObsApproved = exp.status === 'Approved';

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4 text-center font-bold text-slate-500">
                        Week {index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-bold text-slate-800">{exp.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider font-bold">Exercise {index + 1}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {exp.status === 'Approved' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-extrabold">
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ✓ Completed
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mt-1 font-mono block">
                              {exp.submittedAt || "2026-07-02"}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-extrabold block mt-0.5">
                              Score: {exp.score}/100
                            </span>
                          </div>
                        ) : exp.status === 'Submitted - Pending' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-[11px] font-bold animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              ⏳ Pending Check
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mt-1 font-mono block">
                              {exp.submittedAt || "2026-07-02"}
                            </span>
                          </div>
                        ) : exp.status === 'Rejected' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 px-2.5 py-1 rounded-full text-[11px] font-bold">
                              <X className="w-3.5 h-3.5 text-rose-500" />
                              ✗ Rejected
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Not Completed</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {!isObsApproved ? (
                          <div className="flex flex-col items-center justify-center text-slate-400/80">
                            <Lock className="w-4 h-4 text-slate-300" />
                            <span className="text-[9px] uppercase font-extrabold mt-1 text-slate-400 tracking-wider">Locked</span>
                          </div>
                        ) : asg?.status === 'Graded' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-extrabold">
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ✓ Record Completed
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mt-1 font-mono block">
                              {asg.submittedAt || "2026-07-02"}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-extrabold block mt-0.5">
                              Score: {asg.score}/50
                            </span>
                          </div>
                        ) : asg?.status === 'Submitted' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-[11px] font-bold animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              ⏳ Record Pending
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold mt-1 font-mono block">
                              {asg.submittedAt || "2026-07-02"}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedAsgId(asgId);
                              setSimulatedFile(`sol_${asgId}.pdf`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition cursor-pointer"
                          >
                            Upload Record
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 italic max-w-xs truncate" title={exp.remarks || asg?.remarks}>
                        <div className="space-y-1 text-left">
                          {exp.remarks && <p className="leading-tight"><strong className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Observation:</strong> {exp.remarks}</p>}
                          {asg?.remarks && <p className="leading-tight"><strong className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider">Record:</strong> {asg.remarks}</p>}
                          {!exp.remarks && !asg?.remarks && 'No feedback logged.'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'internal-marks' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-base">Continuous Internal Assessment (CIA) Marks</h3>
            <p className="text-xs text-slate-400 mt-1">Official semester test marks and practical marks summary</p>
          </div>

          <div className="space-y-6">
            {Object.keys(student.internalMarks).map((subj) => {
              const mark = student.internalMarks[subj];
              return (
                <div key={subj} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">{subj}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Academic Year 2026</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold">Weighted Internal Score</p>
                      <p className="text-xl font-black text-indigo-600">{mark.average}/100</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">CIA-1 Marks</p>
                      <p className="text-base font-extrabold text-slate-800 mt-1">{mark.cia1}/50</p>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">CIA-2 Marks</p>
                      <p className="text-base font-extrabold text-slate-800 mt-1">{mark.cia2}/50</p>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">CIA-3 Marks</p>
                      <p className="text-base font-extrabold text-slate-800 mt-1">{mark.cia3}/50</p>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Practical Exam</p>
                      <p className="text-base font-extrabold text-slate-800 mt-1">{mark.practical}/100</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'remarks' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-base">Faculty Advising Comments & Remarks</h3>
            <p className="text-xs text-slate-400 mt-1">Direct feedback from your supervisor and subject instructors</p>
          </div>

          <div className="space-y-4">
            {/* Observation / Experiments remarks */}
            {student.experiments.filter(e => e.remarks).map((exp) => (
              <div key={exp.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0 border border-indigo-100/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Lab Feedback: {exp.name}</h4>
                    <span className="text-[9px] text-slate-400 font-bold">{exp.submittedAt || exp.dueDate}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic mt-2">"{exp.remarks}"</p>
                  <p className="text-[10px] text-indigo-600 font-bold mt-2">Awarded by: {student.facultyName}</p>
                </div>
              </div>
            ))}

            {/* Assignments remarks */}
            {student.assignments.filter(a => a.remarks).map((asg) => (
              <div key={asg.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0 border border-indigo-100/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">Assignment Grade Notes: {asg.title}</h4>
                    <span className="text-[9px] text-slate-400 font-bold">{asg.submittedAt || asg.dueDate}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic mt-2">"{asg.remarks}"</p>
                  <p className="text-[10px] text-indigo-600 font-bold mt-2">Awarded by: {student.facultyName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-base">Academic Session Calendar</h3>
            <p className="text-xs text-slate-400 mt-1">Upcoming lab evaluations, continuous internal testing schedules, and holidays</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legend & Type Filter</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <span>Lab Session Evaluation</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <span>Written Examination</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <span>Assessment Due Deadline</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
                  <span>Holiday / Non-Instructional</span>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Calendar Event Roster</h4>
              <div className="space-y-3">
                {student.calendarEvents.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl bg-white hover:bg-slate-50 transition">
                    <div className={`p-2.5 rounded-xl text-white font-bold text-xs uppercase text-center w-14 shrink-0 ${
                      evt.type === 'exam' ? 'bg-rose-600' :
                      evt.type === 'session' ? 'bg-emerald-600' :
                      evt.type === 'holiday' ? 'bg-sky-600' : 'bg-amber-600'
                    }`}>
                      {evt.date.slice(-2)} {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(evt.date.split('-')[1]) - 1]}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-800 text-sm">{evt.title}</h5>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{evt.description}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase">Schedule: {evt.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'certificates' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Workshop & Lab Certificates</h3>
              <p className="text-xs text-slate-400 mt-1">Upload workshop participation letters and laboratory completion certificates</p>
            </div>
          </div>

          <form onSubmit={handleAddCert} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Certificate Title</label>
              <input
                type="text"
                placeholder="e.g. AWS Cloud Foundation Completion"
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Issuer</label>
              <input
                type="text"
                placeholder="e.g. AWS Academy"
                value={certIssuer}
                onChange={(e) => setCertIssuer(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                required
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-2 bg-[#0B192C] hover:bg-[#1E3050] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Cert
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="p-4 border border-slate-100 rounded-2xl bg-white hover:bg-slate-50 transition flex items-start gap-3.5">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100/30 shrink-0">
                  <Medal className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{cert.title}</h4>
                  <p className="text-xs text-slate-400 font-semibold">{cert.issuer}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-700 uppercase">
                      {cert.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{cert.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-base">ERP Portal Settings</h3>
            <p className="text-xs text-slate-400 mt-1">Configure security password, email communication, and notification parameters</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Password Change */}
            <form onSubmit={handlePassChange} className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-500" />
                Security & Password
              </h4>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                  required
                />
              </div>

              {passMessage && (
                <p className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 p-2 rounded-lg">{passMessage}</p>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-[#0B192C] hover:bg-[#1E3050] text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Change Secure Password
              </button>
            </form>

            {/* Notification preferences */}
            <div className="space-y-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-500" />
                Communication Preferences
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 border border-slate-50 rounded-2xl bg-slate-50/40">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Email Alerts</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Receive email alerts on assignment grades and circulars</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => setEmailNotif(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 border border-slate-50 rounded-2xl bg-slate-50/40">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">SMS Parent Alerts</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Alert guardians automatically on attendance drops below 75%</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotif}
                    onChange={(e) => setSmsNotif(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
