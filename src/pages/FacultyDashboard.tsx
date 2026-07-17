import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  Users,
  Check,
  X,
  Download,
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  FileText,
  Phone,
  Mail,
  User as UserIcon,
  Book,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  ChevronDown,
  Calendar
} from 'lucide-react';

// Define the 12 Lab Exercises mapped to 6 Weeks
const LAB_EXERCISES = [
  { week: 1, exp: 1, name: "Stack Operations using Arrays" },
  { week: 1, exp: 2, name: "Queue Implementation using Arrays" },
  { week: 2, exp: 3, name: "Singly Linked List Insertion & Deletion" },
  { week: 2, exp: 4, name: "Binary Search Tree Traversals" },
  { week: 3, exp: 5, name: "Graph Search Algorithms (BFS & DFS)" },
  { week: 3, exp: 6, name: "Sorting Techniques (Merge & Quick Sort)" },
  { week: 4, exp: 7, name: "Hash Table Collision Resolution" },
  { week: 4, exp: 8, name: "Minimum Spanning Tree (Kruskal & Prim)" },
  { week: 5, exp: 9, name: "Shortest Path Routing (Dijkstra's Algorithm)" },
  { week: 5, exp: 10, name: "Min/Max Heap and Priority Queues" },
  { week: 6, exp: 11, name: "Advanced Tree Indexing Schemes" },
  { week: 6, exp: 12, name: "Network Routing and Simulation" }
];

export default function FacultyDashboard() {
  const { user, updateProfilePic } = useAuth();
  const { students, getFacultyData, getFacultyStudents, updateStudentAttendance } = useAcademicData();
  const { tab } = useParams<{ tab?: string }>();

  // Selected Section State (Default: AI & DS-A1)
  const [selectedSection, setSelectedSection] = useState<string>('AI & DS-A1');

  // Selected Batch Year State (Default: 2024 - 2028)
  const [selectedBatch, setSelectedBatch] = useState<string>('2024 - 2028');

  // Popover menu open state variables
  const [isSectionOpen, setIsSectionOpen] = useState<boolean>(false);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);
  
  // Active Page State (1, 2, 3, 4, or 5)
  const [activePage, setActivePage] = useState<number>(1);

  // Profile modal visible state
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  // Sync tab param with page state
  useEffect(() => {
    if (tab === 'page1' || tab === 'dashboard' || !tab) {
      setActivePage(1);
    } else if (tab === 'page2') {
      setActivePage(2);
    } else if (tab === 'page3') {
      setActivePage(3);
    } else if (tab === 'page4') {
      setActivePage(4);
      setShowProfileModal(false);
    } else if (tab === 'profile') {
      setActivePage(5);
      setShowProfileModal(false);
    }
  }, [tab]);

  // Completed Lab Sessions Counter (Default: 8 out of 12)
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(8);

  // Page 3 Toggling Mode (Observation or Record)
  const [notebookMode, setNotebookMode] = useState<'observation' | 'record'>('observation');

  // Local state for Today's Attendance (Saves marked attendance for currently filtered students)
  const [attendanceState, setAttendanceState] = useState<{ [studentId: string]: 'Present' | 'Absent' | 'On Duty' }>({});

  // Local state for Experiment Notebook Sign-offs
  // Structure: { [studentId]: { [expIndex]: { observation: 'none' | 'tick' | 'cross', record: 'none' | 'tick' | 'cross' } } }
  const [signoffState, setSignoffState] = useState<{
    [studentId: string]: {
      [expIndex: number]: { observation: 'none' | 'tick' | 'cross'; record: 'none' | 'tick' | 'cross' };
    };
  }>({});

  // Retrieve current Faculty supervisor information
  const facultyData = getFacultyData(user.id) || {
    id: user.id,
    name: user.name,
    email: user.email,
    department: "Artificial Intelligence & Data Science",
    labName: "Data Structures & Algorithms Lab",
    batch: "AI & DS-A",
    subjectsHandled: ["Data Structures", "Analysis of Algorithms", "Advanced Coding Lab"]
  };

  // Get Faculty phone, subject code, etc. based on ID or defaults
  const phoneNo = user.id === "F01" ? "+91 94451 98721" : user.id === "F02" ? "+91 98404 12345" : "+91 91500 54321";
  const subjectName = facultyData.subjectsHandled[0] || "Data Structures";
  const subjectCode = user.id === "F01" ? "CS3401" : user.id === "F02" ? "CS3492" : "CS3501";

  // List of all sections handled across the department
  const availableSections = ['AI & DS-A1', 'AI & DS-A2', 'AI & DS-B1', 'AI & DS-B2', 'AI & DS-C1', 'AI & DS-C2'];

  // Filter students belonging to the currently selected section
  const sectionStudents = students.filter(
    (student) => student.batch === selectedSection
  );

  // Synchronize state when the selected section or students list changes
  useEffect(() => {
    if (sectionStudents.length > 0) {
      // Initialize Attendance Status to Present by default if not set
      const newAttendance = { ...attendanceState };
      const newSignoffs = { ...signoffState };

      sectionStudents.forEach((student) => {
        const todayRecord = student.attendanceHistory?.find((h) => h.date === '2026-07-08');
        if (todayRecord) {
          newAttendance[student.id] = todayRecord.status;
        } else if (!newAttendance[student.id]) {
          // Check historical record or set Present
          const lastHistory = student.attendanceHistory?.[student.attendanceHistory.length - 1];
          newAttendance[student.id] = lastHistory ? lastHistory.status : 'Present';
        }

        if (!newSignoffs[student.id]) {
          newSignoffs[student.id] = {};
          for (let i = 1; i <= 12; i++) {
            newSignoffs[student.id][i] = {
              observation: 'none',
              record: 'none'
            };
          }
        }
      });

      setAttendanceState(newAttendance);
      setSignoffState(newSignoffs);
    }
  }, [selectedSection, students]);

  // Live Statistics Calculations for Page 1
  const totalStudents = sectionStudents.length;
  const presentCount = sectionStudents.filter(s => attendanceState[s.id] === 'Present').length;
  const absentCount = sectionStudents.filter(s => attendanceState[s.id] === 'Absent').length;
  const odCount = sectionStudents.filter(s => attendanceState[s.id] === 'On Duty').length;
  const attendancePercentage = totalStudents > 0 ? Math.round(((presentCount + odCount) / totalStudents) * 100) : 0;

  // Signed Notebook Counts for Selected Section
  let totalObservationsSigned = 0;
  let totalRecordsSigned = 0;
  sectionStudents.forEach(student => {
    for (let expIdx = 1; expIdx <= 12; expIdx++) {
      if (signoffState[student.id]?.[expIdx]?.observation === 'tick') {
        totalObservationsSigned++;
      }
      if (signoffState[student.id]?.[expIdx]?.record === 'tick') {
        totalRecordsSigned++;
      }
    }
  });

  // Toggle present/absent/on duty today
  const handleToggleAttendance = (studentId: string, status: 'Present' | 'Absent' | 'On Duty') => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
    updateStudentAttendance(studentId, '2026-07-08', status);
  };

  // Toggle observation or record checked sign: 'none' -> 'tick' -> 'cross' -> 'none'
  const handleToggleSignoff = (studentId: string, expIdx: number, type: 'observation' | 'record') => {
    setSignoffState(prev => {
      const studentState = prev[studentId] || {};
      const expState = studentState[expIdx] || { observation: 'none', record: 'none' };
      const currentVal = expState[type];
      
      let newVal: 'none' | 'tick' | 'cross' = 'tick';
      if (currentVal === 'tick') {
        newVal = 'cross';
      } else if (currentVal === 'cross') {
        newVal = 'none';
      }

      return {
        ...prev,
        [studentId]: {
          ...studentState,
          [expIdx]: {
            ...expState,
            [type]: newVal
          }
        }
      };
    });
  };

  // CSV Export helper function using Blob
  const triggerExcelExport = (headers: string[], rows: string[][], fileName: string) => {
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Page 2 (Attendance) to Excel (CSV)
  const handleExportAttendance = () => {
    const headers = ['S.No', 'Roll No', 'Student Name', 'Register Number', 'Attendance Status'];
    const rows = sectionStudents.map((st, idx) => [
      (idx + 1).toString(),
      st.rollNo,
      st.name,
      st.registerNo,
      attendanceState[st.id] || 'Present'
    ]);
    triggerExcelExport(headers, rows, `Attendance_Report_${selectedSection}.csv`);
  };

  // Export Page 3 (Sign-off Matrix) to Excel (CSV)
  const handleExportSignoffMatrix = () => {
    const headers = [
      'S.No', 'Roll No', 'Student Name', 'Register Number',
      'W1-E1 Obs', 'W1-E1 Rec', 'W1-E2 Obs', 'W1-E2 Rec',
      'W2-E3 Obs', 'W2-E3 Rec', 'W2-E4 Obs', 'W2-E4 Rec',
      'W3-E5 Obs', 'W3-E5 Rec', 'W3-E6 Obs', 'W3-E6 Rec',
      'W4-E7 Obs', 'W4-E7 Rec', 'W4-E8 Obs', 'W4-E8 Rec',
      'W5-E9 Obs', 'W5-E9 Rec', 'W5-E10 Obs', 'W5-E10 Rec',
      'W6-E11 Obs', 'W6-E11 Rec', 'W6-E12 Obs', 'W6-E12 Rec'
    ];

    const rows = sectionStudents.map((st, idx) => {
      const row = [(idx + 1).toString(), st.rollNo, st.name, st.registerNo];
      for (let expIdx = 1; expIdx <= 12; expIdx++) {
        const obsVal = signoffState[st.id]?.[expIdx]?.observation || 'none';
        const recVal = signoffState[st.id]?.[expIdx]?.record || 'none';
        const obs = obsVal === 'tick' ? 'Signed' : (obsVal === 'cross' ? 'Incorrect' : 'Pending');
        const rec = recVal === 'tick' ? 'Signed' : (recVal === 'cross' ? 'Incorrect' : 'Pending');
        row.push(obs, rec);
      }
      return row;
    });

    triggerExcelExport(headers, rows, `Lab_Signoff_Report_${selectedSection}.csv`);
  };

  // Prepare Histogram Data for Page 4
  // 1. Attendance ranges
  let attendanceHigh = 0; // 90%+
  let attendanceMedium = 0; // 75-89%
  let attendanceLow = 0; // <75%

  sectionStudents.forEach(st => {
    const att = attendanceState[st.id] === 'Present' ? 100 : 0;
    // or calculate based on their overall attendance history
    const overallAtt = st.attendance;
    if (overallAtt >= 90) attendanceHigh++;
    else if (overallAtt >= 75) attendanceMedium++;
    else attendanceLow++;
  });

  const attendanceHistogramData = [
    { range: 'High (>=90%)', Students: attendanceHigh, fill: '#059669' },
    { range: 'Mid (75-89%)', Students: attendanceMedium, fill: '#3b82f6' },
    { range: 'Low (<75%)', Students: attendanceLow, fill: '#ef4444' }
  ];

  // 2. Observations and Records Completion Counts histogram
  // Group students by how many notebooks they have completed (out of 12)
  let obs_10_12 = 0;
  let obs_7_9 = 0;
  let obs_4_6 = 0;
  let obs_0_3 = 0;

  let rec_10_12 = 0;
  let rec_7_9 = 0;
  let rec_4_6 = 0;
  let rec_0_3 = 0;

  sectionStudents.forEach(st => {
    let studentObs = 0;
    let studentRec = 0;
    for (let expIdx = 1; expIdx <= 12; expIdx++) {
      if (signoffState[st.id]?.[expIdx]?.observation === 'tick') studentObs++;
      if (signoffState[st.id]?.[expIdx]?.record === 'tick') studentRec++;
    }

    if (studentObs >= 10) obs_10_12++;
    else if (studentObs >= 7) obs_7_9++;
    else if (studentObs >= 4) obs_4_6++;
    else obs_0_3++;

    if (studentRec >= 10) rec_10_12++;
    else if (studentRec >= 7) rec_7_9++;
    else if (studentRec >= 4) rec_4_6++;
    else rec_0_3++;
  });

  const signoffHistogramData = [
    { name: '10-12 Exp', Observations: obs_10_12, Records: rec_10_12 },
    { name: '7-9 Exp', Observations: obs_7_9, Records: rec_7_9 },
    { name: '4-6 Exp', Observations: obs_4_6, Records: rec_4_6 },
    { name: '0-3 Exp', Observations: obs_0_3, Records: rec_0_3 }
  ];

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-blue-950 to-[#0B192C] text-white p-6 rounded-3xl border border-blue-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
          <Building className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-500/30">
              Departmental ERP Console
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
              Panimalar Faculty Dashboard
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Welcome, <span className="text-blue-300 font-extrabold">{facultyData.name}</span> &bull; Academic Year 2026-2027
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 p-3 rounded-2xl">
            <Clock className="w-5 h-5 text-blue-400" />
            <div className="text-left font-mono">
              <p className="text-xs font-bold text-slate-100">AI & DS Labs</p>
              <p className="text-[10px] text-slate-400">System Clock Sync Active</p>
            </div>
          </div>
        </div>
      </div>



      {/* =======================================================
          PAGE 1: SECTION OVERVIEW & STATISTICS SUMMARY
          ======================================================= */}
      {activePage === 1 && (
        <div className="space-y-6">
          {/* SECTION CONTROLLERS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  Choose Target Batch / Section
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a section to retrieve student details and laboratory status.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* BATCH SELECTOR (POPPING DROPDOWN) */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsBatchOpen(!isBatchOpen);
                      setIsSectionOpen(false);
                    }}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-2xl border border-slate-200/60 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Batch: {selectedBatch}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isBatchOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isBatchOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsBatchOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        {['2024 - 2028', '2023 - 2027', '2022 - 2026', '2025 - 2029'].map((batchOption) => (
                          <button
                            key={batchOption}
                            onClick={() => {
                              setSelectedBatch(batchOption);
                              setIsBatchOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                              selectedBatch === batchOption
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Batch {batchOption}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* SECTION SELECTOR (POPPING DROPDOWN) */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsSectionOpen(!isSectionOpen);
                      setIsBatchOpen(false);
                    }}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-2xl border border-slate-200/60 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Section: {selectedSection}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isSectionOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSectionOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSectionOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        {availableSections.map((sect) => (
                          <button
                            key={sect}
                            onClick={() => {
                              setSelectedSection(sect);
                              setIsSectionOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                              selectedSection === sect
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Section {sect}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* KPI STATS BOARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Students</p>
                <h4 className="text-2xl font-black text-slate-800 mt-1">{totalStudents}</h4>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">In section {selectedSection}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Present Today</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h4 className="text-2xl font-black text-slate-800">{presentCount}</h4>
                  {odCount > 0 && <span className="text-xs font-bold text-amber-600">(+{odCount} OD)</span>}
                </div>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{attendancePercentage}% Attendance</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Absent Today</p>
                <h4 className="text-2xl font-black text-slate-800 mt-1">{absentCount}</h4>
                <p className="text-[10px] text-rose-600 font-semibold mt-0.5">Absentees logged</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Sessions Completed</p>
                <div className="flex items-center gap-2 mt-1">
                  <h4 className="text-2xl font-black text-slate-800">{sessionsCompleted}</h4>
                  <div className="flex gap-0.5">
                    <button 
                      onClick={() => setSessionsCompleted(prev => Math.max(0, prev - 1))}
                      className="px-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded cursor-pointer"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => setSessionsCompleted(prev => Math.min(12, prev + 1))}
                      className="px-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Out of 12 exercises</p>
              </div>
            </div>
          </div>

          {/* SIGN-OFF COUNTS SUMMARY CARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-tr from-emerald-50/50 to-teal-50/20 p-6 rounded-3xl border border-emerald-100/50 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500 text-white rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Signed Observation Notebooks</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Real-time Sign-off count</p>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-4xl font-black text-slate-800">{totalObservationsSigned}</span>
                <span className="text-xs text-slate-400 font-bold ml-1.5">Total Experiment observations signed in this section</span>
              </div>
              <div className="text-[11px] text-emerald-700 bg-emerald-50/80 p-3 rounded-xl font-medium border border-emerald-100/40">
                You can toggle observation sign-offs directly inside <strong>Page 3: Lab Notebook Signoff</strong>.
              </div>
            </div>

            <div className="bg-gradient-to-tr from-blue-50/50 to-indigo-50/20 p-6 rounded-3xl border border-blue-100/50 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500 text-white rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Signed Record Notebooks</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Final Record Sign-off count</p>
                </div>
              </div>
              <div className="pt-2">
                <span className="text-4xl font-black text-slate-800">{totalRecordsSigned}</span>
                <span className="text-xs text-slate-400 font-bold ml-1.5">Total Experiment records signed in this section</span>
              </div>
              <div className="text-[11px] text-blue-700 bg-blue-50/80 p-3 rounded-xl font-medium border border-blue-100/40">
                Ensure records are checkmarked regularly after manual verification.
              </div>
            </div>
          </div>

          {/* FACULTY CARD SUMMARY */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-lg shadow-inner">
                {facultyData.name.charAt(3) || "F"}
              </div>
              <div>
                <p className="text-xs text-blue-400 font-extrabold tracking-widest uppercase">Assigned Faculty Supervisor</p>
                <h4 className="text-lg font-bold text-slate-50">{facultyData.name}</h4>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-300">
              <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/50">
                <span className="text-slate-500">SUBJECT:</span> {subjectName}
              </div>
              <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/50">
                <span className="text-slate-500">LAB:</span> {facultyData.labName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          PAGE 2: ATTENDANCE REGISTRY SHEET & LOGGING
          ======================================================= */}
      {activePage === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Lab Attendance Registry</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mark students present or absent for today's lab session, and export to Excel.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* BATCH SELECTOR (POPPING DROPDOWN) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsBatchOpen(!isBatchOpen);
                    setIsSectionOpen(false);
                  }}
                  className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200/60 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Batch: {selectedBatch}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isBatchOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isBatchOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsBatchOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                      {['2024 - 2028', '2023 - 2027', '2022 - 2026', '2025 - 2029'].map((batchOption) => (
                        <button
                          key={batchOption}
                          onClick={() => {
                            setSelectedBatch(batchOption);
                            setIsBatchOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                            selectedBatch === batchOption
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Batch {batchOption}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* SECTION SELECTOR (POPPING DROPDOWN) */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsSectionOpen(!isSectionOpen);
                    setIsBatchOpen(false);
                  }}
                  className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200/60 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Section: {selectedSection}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isSectionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSectionOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsSectionOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                      {availableSections.map((sect) => (
                        <button
                          key={sect}
                          onClick={() => {
                            setSelectedSection(sect);
                            setIsSectionOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                            selectedSection === sect
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Section {sect}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleExportAttendance}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10"
              >
                <Download className="w-4 h-4" />
                <span>Export Attendance</span>
              </button>
            </div>
          </div>

          {/* ATTENDANCE MATRIX TABLE */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="px-6 py-4 text-center">S.No</th>
                    <th className="px-6 py-4">Roll No</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Register Number</th>
                    <th className="px-6 py-4 text-center">Attendance Status today</th>
                    <th className="px-6 py-4 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {sectionStudents.map((st, idx) => {
                    const status = attendanceState[st.id] || 'Present';
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{st.rollNo}</td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800 text-sm">{st.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{st.email}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-500">{st.registerNo}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            status === 'Present' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : status === 'On Duty'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(st.id, 'Present')}
                              className={`px-3.5 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                status === 'Present'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(st.id, 'Absent')}
                              className={`px-3.5 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                status === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(st.id, 'On Duty')}
                              className={`px-3.5 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                                status === 'On Duty'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                              }`}
                            >
                              On Duty
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sectionStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
                        No students enrolled in section {selectedSection}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          PAGE 3: 6-WEEK LAB EXERCISE SIGN-OFF MATRIX
          ======================================================= */}
      {activePage === 3 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">6-Week experiment completion</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Check off experiment approvals. Tap cells to toggle status (✔ Signed / ✖ Pending).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* BATCH SELECTOR (POPPING DROPDOWN) */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsBatchOpen(!isBatchOpen);
                      setIsSectionOpen(false);
                    }}
                    className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200/60 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Batch: {selectedBatch}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isBatchOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isBatchOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsBatchOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        {['2024 - 2028', '2023 - 2027', '2022 - 2026', '2025 - 2029'].map((batchOption) => (
                          <button
                            key={batchOption}
                            onClick={() => {
                              setSelectedBatch(batchOption);
                              setIsBatchOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                              selectedBatch === batchOption
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Batch {batchOption}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* SECTION SELECTOR (POPPING DROPDOWN) */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsSectionOpen(!isSectionOpen);
                      setIsBatchOpen(false);
                    }}
                    className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200/60 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Section: {selectedSection}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isSectionOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSectionOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsSectionOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        {availableSections.map((sect) => (
                          <button
                            key={sect}
                            onClick={() => {
                              setSelectedSection(sect);
                              setIsSectionOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                              selectedSection === sect
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            Section {sect}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleExportSignoffMatrix}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Matrix</span>
                </button>
              </div>
            </div>

            {/* Notebook Type Switcher for Matrix view toggling */}
            <div className="flex items-center gap-3 border-t border-slate-50 pt-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Notebook View:</span>
              <div className="inline-flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                <button
                  onClick={() => setNotebookMode('observation')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    notebookMode === 'observation'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Observation Notebooks
                </button>
                <button
                  onClick={() => setNotebookMode('record')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    notebookMode === 'record'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Record Notebooks
                </button>
              </div>
            </div>
          </div>

          {/* MAIN GRID SHEET */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border-spacing-0">
                <thead>
                  {/* Row 1 headings: Week labels */}
                  <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-widest border-b border-slate-100">
                    <th rowSpan={2} className="px-4 py-4 text-center border-r border-slate-100">S.No</th>
                    <th rowSpan={2} className="px-4 py-4 border-r border-slate-100 min-w-[90px]">Roll No</th>
                    <th rowSpan={2} className="px-4 py-4 border-r border-slate-100 min-w-[140px]">Student Name</th>
                    <th rowSpan={2} className="px-4 py-4 border-r border-slate-100 min-w-[110px]">Register No</th>
                    {[1, 2, 3, 4, 5, 6].map((week) => (
                      <th 
                        key={week} 
                        colSpan={2} 
                        className="px-4 py-3 text-center border-r border-slate-100 bg-blue-50/10 font-black text-blue-900"
                      >
                        Week {week}
                      </th>
                    ))}
                  </tr>
                  {/* Row 2 headings: Experiment labels */}
                  <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 tracking-wide border-b border-slate-200">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((expIdx) => (
                      <th 
                        key={expIdx} 
                        className="px-2 py-3 text-center border-r border-slate-100 min-w-[70px] hover:bg-slate-100/50 transition cursor-help"
                        title={LAB_EXERCISES[expIdx - 1]?.name}
                      >
                        Exp {expIdx}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sectionStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-4 py-4 text-center font-bold text-slate-400 border-r border-slate-100 bg-slate-50/20">{idx + 1}</td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-700 border-r border-slate-100">{st.rollNo}</td>
                      <td className="px-4 py-4 font-extrabold text-slate-800 border-r border-slate-100">{st.name}</td>
                      <td className="px-4 py-4 font-semibold text-slate-500 border-r border-slate-100">{st.registerNo}</td>
                                         {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((expIdx) => {
                        const cellState = signoffState[st.id]?.[expIdx] || { observation: 'none', record: 'none' };
                        const status = notebookMode === 'observation' ? cellState.observation : cellState.record;

                        return (
                          <td 
                            key={expIdx} 
                            onClick={() => handleToggleSignoff(st.id, expIdx, notebookMode)}
                            className={`px-2 py-3.5 text-center border-r border-slate-100 transition-all duration-200 cursor-pointer select-none ${
                              status === 'tick'
                                ? 'bg-emerald-50/20 hover:bg-emerald-100/30' 
                                : status === 'cross'
                                ? 'bg-rose-50/20 hover:bg-rose-100/30'
                                : 'bg-slate-50/5 hover:bg-slate-100/30'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {status === 'tick' ? (
                                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 shadow-inner animate-in zoom-in-75 duration-100">
                                  <Check className="w-3.5 h-3.5" />
                                </div>
                              ) : status === 'cross' ? (
                                <div className="p-1 rounded-full bg-rose-100 text-rose-600 shadow-inner animate-in zoom-in-75 duration-100">
                                  <X className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-200 bg-white transition-colors hover:border-slate-300" />
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          PAGE 4: DATA VISUALIZATION HISTOGRAMS & PROFILE INFO
          ======================================================= */}
      {activePage === 4 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* HISTOGRAM 1: SIGN-OFF COMPLETION RATE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                  Notebook Completion Histograms
                </h4>
                <p className="text-xs text-slate-400">
                  Total student counts grouped by signed experiment volumes (Observation vs Record).
                </p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={signoffHistogramData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    <Bar dataKey="Observations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Records" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* HISTOGRAM 2: ATTENDANCE BRACKET */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                  Attendance Bracket Ranges
                </h4>
                <p className="text-xs text-slate-400">
                  Distribution of students across high, medium, and low overall attendance brackets.
                </p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendanceHistogramData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="range" stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="Students" radius={[4, 4, 0, 0]}>
                      {attendanceHistogramData.map((entry, index) => (
                        <Bar key={`bar-${index}`} dataKey="Students" fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          PAGE 5: DEDICATED INSTITUTIONAL FACULTY PROFILE VIEW
          ======================================================= */}
      {activePage === 5 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-10 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-slate-100">
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full bg-[#0B192C] text-white flex items-center justify-center text-4xl font-black shadow-md border-4 border-slate-50 uppercase overflow-hidden">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    facultyData.name.charAt(0) || "F"
                  )}
                </div>
                <label className="absolute inset-0 bg-black/60 text-white text-[9px] font-extrabold rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-center p-1">
                  <span>UPLOAD</span>
                  <span>PIC (MAX 10MB)</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        alert("Profile picture must be within 10MB!");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const base64 = reader.result as string;
                        if (updateProfilePic) {
                          await updateProfilePic(base64);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              <div className="text-center md:text-left space-y-2">
                <span className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">
                  Verified Institutional Member
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{facultyData.name}</h3>
                <p className="text-indigo-600 font-extrabold text-sm uppercase tracking-wider">
                  {facultyData.department}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-50 pb-2">
                  Academic Designation Profile
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">Handling Subject Name</span>
                    <span className="text-slate-850 font-black">{subjectName}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">Subject Code</span>
                    <span className="text-slate-850 font-mono font-black text-blue-600">{subjectCode}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">Assigned Laboratory Room</span>
                    <span className="text-slate-850 font-black">{facultyData.labName}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-50 pb-2">
                  Institutional Contact Profile
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">Official Mail ID</span>
                    <span className="text-slate-850 font-black text-blue-600">{facultyData.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">Authorized Phone Number</span>
                    <span className="text-slate-850 font-black">{phoneNo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-slate-500 font-bold">Handling Batch Sections</span>
                    <span className="text-slate-850 font-black">AI & DS-A1, AI & DS-A2, AI & DS-B1, AI & DS-B2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FACULTY PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden transform scale-100 transition-all">
            <div className="bg-gradient-to-r from-blue-950 to-[#0B192C] text-white p-6 relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileModal(false);
                }}
                className="absolute right-4 top-4 text-slate-300 hover:text-white p-1.5 hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4 mt-2">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full bg-blue-600 border-2 border-blue-400 flex items-center justify-center text-2xl font-black shadow-inner uppercase overflow-hidden text-white">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      facultyData.name.charAt(0) || "F"
                    )}
                  </div>
                  <label className="absolute inset-0 bg-black/60 text-white text-[8px] font-black rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-center p-0.5">
                    <span>UPLOAD</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          alert("Profile picture must be within 10MB!");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64 = reader.result as string;
                          if (updateProfilePic) {
                            await updateProfilePic(base64);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{facultyData.name}</h3>
                  <p className="text-xs text-blue-300 font-semibold">{facultyData.department}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <h4 className="font-extrabold text-slate-400 uppercase tracking-widest text-[10px]">Official Faculty Credentials</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">FACULTY NAME</span>
                  <span className="text-slate-800 font-black text-sm">{facultyData.name}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">OFFICIAL MAIL ID</span>
                  <span className="text-slate-800 font-extrabold break-all">{facultyData.email}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">PHONE NUMBER</span>
                  <span className="text-slate-800 font-bold">{phoneNo}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block mb-1">LAB ROOM NAME</span>
                  <span className="text-slate-800 font-bold">{facultyData.labName}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Handling Subject</span>
                  <span className="text-slate-800 font-extrabold">{subjectName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Subject Code</span>
                  <span className="text-slate-800 font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{subjectCode}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Handling Sections</span>
                  <span className="text-slate-800 font-bold">AI & DS-A1, AI & DS-A2</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileModal(false);
                  }}
                  className="w-full py-3 bg-[#0B192C] hover:bg-slate-800 text-white rounded-2xl font-bold transition cursor-pointer"
                >
                  Close Profile View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
