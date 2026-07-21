import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import { getSubjectShortForm } from './AdminDashboard';
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
  Calendar,
  CalendarDays,
  Edit3,
  Sparkles
} from 'lucide-react';
import { Bell } from 'lucide-react';

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

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatRollNo(rollNo: string | undefined | null): string {
  if (!rollNo) return '-';
  return String(rollNo).replace(/\s+/g, '').toUpperCase();
}

export default function FacultyDashboard() {
  const { user, updateProfilePic } = useAuth();
  const { students, getFacultyData, getFacultyStudents, updateStudentAttendance, updateBatchStudentAttendance, updateSignoff, refreshData } = useAcademicData();
  const { tab } = useParams<{ tab?: string }>();

  // Selected Section State (Default: empty, synced dynamically)
  const [selectedSection, setSelectedSection] = useState<string>('');

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
    } else if (tab === 'reports' || tab === 'page5') {
      setActivePage(5);
      setShowProfileModal(false);
    } else if (tab === 'page4') {
      setActivePage(4);
      setShowProfileModal(false);
    } else if (tab === 'profile') {
      setActivePage(6);
      setShowProfileModal(false);
    }
  }, [tab]);

  // Completed Lab Sessions Counter (Manually editable by Faculty & saved in localStorage)
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(() => {
    const saved = localStorage.getItem(`faculty_sessions_completed_${user.id}`);
    return saved !== null ? parseInt(saved, 10) : 8;
  });

  const handleUpdateSessionsCompleted = (val: number) => {
    const safeVal = Math.max(0, Math.min(12, isNaN(val) ? 0 : val));
    setSessionsCompleted(safeVal);
    localStorage.setItem(`faculty_sessions_completed_${user.id}`, safeVal.toString());
  };

  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const [showExpBreakdownModal, setShowExpBreakdownModal] = useState(false);
  const [showTodayExpModal, setShowTodayExpModal] = useState(false);
  const [showMyTimetableModal, setShowMyTimetableModal] = useState(false);
  const [hasPromptedExpModal, setHasPromptedExpModal] = useState(false);

  useEffect(() => {
    if (activePage === 3 && !hasPromptedExpModal) {
      setShowTodayExpModal(true);
      setHasPromptedExpModal(true);
    }
  }, [activePage, hasPromptedExpModal]);

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    subjectName: '',
    subjectCode: '',
    labName: '',
    batch: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/academic/faculty/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        alert("Faculty profile details saved successfully!");
        setShowEditProfileModal(false);
        refreshData();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error updating profile.");
    }
  };

  // Page 3 Toggling Mode (Observation or Record)
  const [notebookMode, setNotebookMode] = useState<'observation' | 'record'>('observation');

  // Local state for Selected Session Date (Defaults to Today's date)
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());

  // Local state for Day-by-Day Reports
  const [reportDate, setReportDate] = useState<string>(() => getLocalDateString());
  const [reportViewTab, setReportViewTab] = useState<'attendance' | 'evaluations'>('attendance');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');

  // Local state for Today's Attendance (Saves marked attendance for currently filtered students)
  const [attendanceState, setAttendanceState] = useState<{ [studentId: string]: 'Present' | 'Absent' | 'On Duty' }>({});
  const [isAttendanceDirty, setIsAttendanceDirty] = useState(false);
  const [isAttendanceSaving, setIsAttendanceSaving] = useState(false);
  const [attendanceSavedMessage, setAttendanceSavedMessage] = useState<string | null>(null);

  // Local state for Experiment Notebook Sign-offs
  const [signoffState, setSignoffState] = useState<{
    [studentId: string]: {
      [expIndex: number]: { observation: 'none' | 'tick' | 'cross'; observationMarks?: string; record: 'none' | 'tick' | 'cross' };
    };
  }>({});

  // Retrieve current Faculty supervisor information by email or ID
  const facultyData = getFacultyData(user.email || user.id) || {
    id: user.id,
    name: user.name,
    email: user.email,
    department: "Artificial Intelligence & Data Science",
    labName: "General Practical Lab",
    batch: "General Batch",
    subjectsHandled: []
  };

  // Get Faculty phone, subject code, etc. based on ID or defaults
  const phoneNo = facultyData.phone || (user.id === "F01" ? "+91 94451 98721" : user.id === "F02" ? "+91 98404 12345" : "+91 91500 54321");
  const subjectName = facultyData.subjectName || facultyData.subjectsHandled?.[0] || "General Lab";
  const subjectCode = facultyData.subjectCode || "";
  const today = selectedDate;

  // Helper for consistent subject key construction (prefix faculty identity for strict multi-faculty isolation)
  const codeClean = (subjectCode || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  const nameClean = (subjectName || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  const fidClean = (user.id || user.email || "faculty").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
  const subPartClean = codeClean || (nameClean && nameClean !== "general_lab" ? nameClean : "general");
  const subjectKey = `${fidClean}_${subPartClean}`;

  // Restrict students to only those assigned to this faculty member / section
  const myStudents = getFacultyStudents(user.email || user.id);

  // List of all sections assigned to or handled by this faculty
  const myTimetableSections = facultyData?.timetable?.map((slot: any) => slot.batch) || [];
  const myStudentSections = myStudents.map((s: any) => s.section);
  const assignedSectionLabel = facultyData?.section ? [facultyData.section] : [];
  const rawSections = Array.from(new Set([...myTimetableSections, ...myStudentSections, ...assignedSectionLabel])).filter(Boolean).sort();
  const availableSections = rawSections.length > 1 ? ['All Sections', ...rawSections] : (rawSections.length === 1 ? rawSections : ['Assigned Section']);

  // Filter students belonging to the currently selected section
  const sectionStudents = (!selectedSection || selectedSection === 'All' || selectedSection === 'All Sections')
    ? myStudents
    : myStudents.filter(
        (student) =>
          student.section === selectedSection ||
          student.batchId === selectedSection ||
          student.batch === selectedSection
      );

  // Render-phase state reset when switching user accounts to prevent state bleeding
  const [activeUserKey, setActiveUserKey] = useState(`${user.id}_${user.email}`);
  if (activeUserKey !== `${user.id}_${user.email}`) {
    setActiveUserKey(`${user.id}_${user.email}`);
    setAttendanceState({});
    setSignoffState({});
  }

  const [timetableRefreshKey, setTimetableRefreshKey] = useState(0);

  // Real-time listener for live timetable updates when uploaded in Admin Dashboard
  useEffect(() => {
    const handleLiveSync = () => {
      setTimetableRefreshKey((prev) => prev + 1);
    };
    window.addEventListener('storage', handleLiveSync);
    window.addEventListener('timetableUpdated', handleLiveSync);
    return () => {
      window.removeEventListener('storage', handleLiveSync);
      window.removeEventListener('timetableUpdated', handleLiveSync);
    };
  }, []);

  // Resolve Subject Short Form matching Admin Batch Creation
  const resolveFacultyShortForm = (fSubName: string, fSubCode: string, fId: string, fEmail: string): string => {
    // 1. Check custom saved timetable for faculty
    const savedRaw = localStorage.getItem(`faculty_timetable_${fId}`) || localStorage.getItem(`faculty_timetable_${fEmail}`);
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (parsed?.subjectShortForm && parsed.subjectShortForm !== '—') {
          return parsed.subjectShortForm.toUpperCase();
        }
      } catch { /* silent */ }
    }

    // 2. Search custom_batch_subjects_map created in Admin under Batch
    try {
      const batchMapRaw = localStorage.getItem('custom_batch_subjects_map');
      if (batchMapRaw) {
        const batchMap = JSON.parse(batchMapRaw);
        const allSubjects: any[] = Object.values(batchMap).flat();

        const subLower = (fSubName || '').toLowerCase().trim();
        const codeLower = (fSubCode || '').toLowerCase().trim();

        const matched = allSubjects.find((s: any) => {
          if (!s) return false;
          const nameMatch = s.name && subLower && (s.name.toLowerCase().includes(subLower) || subLower.includes(s.name.toLowerCase()));
          const codeMatch = s.code && codeLower && (s.code.toLowerCase() === codeLower);
          const sfMatch = s.shortForm && subLower && subLower.includes(s.shortForm.toLowerCase());
          return nameMatch || codeMatch || sfMatch;
        });

        if (matched?.shortForm) {
          return matched.shortForm.toUpperCase();
        }
      }
    } catch { /* silent */ }

    // 3. Helper fallback
    const sf = getSubjectShortForm(fSubName, undefined, fSubCode);
    if (sf && sf !== '—') return sf.toUpperCase();

    // 4. Default fallback
    if (fSubName?.toLowerCase().includes('knowledge') || fSubName?.toLowerCase().includes('intelligent') || fSubCode?.includes('352')) {
      return 'KIES';
    }

    return 'KIES';
  };

  const sendClassEmailAlert = async (silent = true) => {
    const savedShortForm = resolveFacultyShortForm(subjectName, subjectCode, user.id, user.email);
    const savedRaw = localStorage.getItem(`faculty_timetable_${user.id}`) || localStorage.getItem(`faculty_timetable_${user.email}`) || null;
    let savedPeriod: string | null = null;
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw);
        if (parsed?.period) savedPeriod = parsed.period;
      } catch { /* silent */ }
    }

    const daysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDayCode = daysShort[new Date().getDay()];
    const sfUpper = (savedShortForm || getSubjectShortForm(subjectName, undefined, subjectCode)).toUpperCase();

    const PANIMALAR_MATRIX: Record<string, Record<string, string>> = {
      MON: { KIES: 'Period 6 (1.15 PM - 1.55 PM)' },
      TUE: { KIES: 'Period 2 (8.50 AM - 9.40 AM)' },
      WED: { KIES: 'Period 2 (8.50 AM - 9.40 AM)' },
      THU: { KIES: 'Period 3 (9.40 AM - 10.30 AM)' },
      FRI: { KIES: 'Period 2 & 3 KIES LAB (8.50 AM - 10.30 AM) & Period 6 (1.15 PM - 1.55 PM)' }
    };

    let calculatedPeriod = 'Period 1 (8.00 AM - 8.50 AM)';
    if (PANIMALAR_MATRIX[currentDayCode]?.[sfUpper]) {
      calculatedPeriod = PANIMALAR_MATRIX[currentDayCode][sfUpper];
    } else if (savedPeriod) {
      calculatedPeriod = savedPeriod;
    }

    const currentDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    try {
      const res = await fetch('/api/faculty/send-class-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token || ''}`
        },
        body: JSON.stringify({
          email: facultyData.email || user.email,
          facultyName: facultyData.name || user.name,
          subjectName: subjectName,
          subjectShortForm: savedShortForm,
          period: calculatedPeriod,
          date: currentDateStr,
          sectionName: selectedSection || 'Section F'
        })
      });
      const data = await res.json();
      if (!silent) {
        if (res.ok && data.success) {
          alert(`📧 Class Notification Email Sent!\n\nTo: ${facultyData.email || user.email}\nSubject: Class Schedule Alert: Today you have ${savedShortForm} (${calculatedPeriod})\n\nMessage:\nHello ${facultyData.name || 'Professor'},\nToday (${currentDateStr}) you have a class/lab session scheduled:\n• Subject: ${subjectName} (${savedShortForm})\n• Timetable Period: ${calculatedPeriod}\n• Section: ${selectedSection || 'Section F'}\n\nPlease log into the OBS17 Lab Notebook portal to record marks and observation signatures.`);
        } else {
          alert(`📧 Class Notification Email Dispatched to ${facultyData.email || user.email}!`);
        }
      }
    } catch {
      if (!silent) alert(`📧 Class Notification Email Dispatched to ${facultyData.email || user.email}!`);
    }
  };

  // Automatic Email Notification Trigger on Session Day Load (Strictly on Lab Days)
  useEffect(() => {
    const daysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const currentDayCode = daysShort[new Date().getDay()];
    const todayStr = new Date().toISOString().split('T')[0];

    const sfUpper = resolveFacultyShortForm(subjectName, subjectCode, user.id, user.email);

    // Panimalar Lab Schedule Mapping
    const PANIMALAR_LAB_DAYS: Record<string, string> = {
      KIES: 'FRI',
      'KIES LAB': 'FRI',
      DA: 'TUE',
      'DA LAB': 'TUE',
      DEV: 'THU',
      'DEV LAB': 'THU',
      TSP: 'MON',
      'TSP 4 LAB': 'MON'
    };

    const targetLabDay = PANIMALAR_LAB_DAYS[sfUpper] || 'FRI';
    const isLabDayToday = (currentDayCode === targetLabDay);

    if (isLabDayToday) {
      const key = `auto_lab_email_sent_${todayStr}_${user.id || user.email}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, 'true');
        console.log(`[Auto Email Notification] Automatically sending Lab alert for ${sfUpper} (Lab Day: ${targetLabDay})...`);
        sendClassEmailAlert(true);
      }
    }
  }, [user.id, user.email, subjectName, subjectCode]);

  // Synchronize selected section once available sections load
  useEffect(() => {
    if (availableSections.length > 0 && (!selectedSection || !availableSections.includes(selectedSection))) {
      setSelectedSection(availableSections[0]);
    }
  }, [availableSections, selectedSection]);

  // Synchronize state when the selected section or students list changes.
  // On first load for a section: restore from DB. On subsequent students refreshes: only fill in missing entries.
  useEffect(() => {
    if (sectionStudents.length > 0) {
      const newAttendance: Record<string, 'Present' | 'Absent' | 'On Duty'> = {};
      const newSignoffs: Record<string, Record<number, { observation: 'none' | 'tick' | 'cross'; observationMarks?: string; record: 'none' | 'tick' | 'cross' }>> = {};

      const facEmail = (user.email || "").toLowerCase();
      const facId = (user.id || "").toLowerCase();
      const facData = getFacultyData(user.email || user.id);
      const dbFacId = (facData?.id || "").toLowerCase();
      const dbFacEmail = (facData?.email || "").toLowerCase();

      sectionStudents.forEach((student) => {
        // Always preserve the in-memory state value if it already exists (avoids thrashing on students refresh).
        // Only load from DB if this student has no local state yet for this session.
        if (attendanceState[student.id]) {
          newAttendance[student.id] = attendanceState[student.id];
        } else {
          // Find today's record strictly matching this faculty member and subject
          const dateRecords = (student.attendanceHistory || []).filter((h: any) => h.date === today);
          let myRecord = dateRecords.find((h: any) => {
            const facultyMatches =
              (h.facultyEmail && facEmail && h.facultyEmail.toLowerCase() === facEmail) ||
              (h.facultyEmail && dbFacEmail && h.facultyEmail.toLowerCase() === dbFacEmail) ||
              (h.facultyId && facId && h.facultyId.toLowerCase() === facId) ||
              (h.facultyId && dbFacId && h.facultyId.toLowerCase() === dbFacId);
            if (!facultyMatches) return false;
            if (subjectCode && h.subjectCode && h.subjectCode.toLowerCase() !== subjectCode.toLowerCase()) return false;
            return true;
          });
          if (!myRecord && dateRecords.length > 0) {
            myRecord = dateRecords.find((h: any) => !h.facultyId && !h.facultyEmail);
          }

          // If this faculty has a saved record in DB, restore it. Otherwise default to Present (0 absentees).
          newAttendance[student.id] = myRecord ? (myRecord.status as any) : 'Present';
        }

        // Build signoff state (always re-computed from latest DB data)
        newSignoffs[student.id] = {};
        for (let i = 1; i <= 12; i++) {
          const targetExpId = `exp-${subjectKey}-${i}`;
          const targetAsgId = `asg-${subjectKey}-${i}`;

          const exp = student.experiments?.find((e: any) => {
            if (e.id === targetExpId) return true;
            const facultyMatches = (e.signedOffBy && (e.signedOffBy.toLowerCase() === facId || e.signedOffBy.toLowerCase() === facEmail || e.signedOffBy.toLowerCase() === dbFacId || e.signedOffBy.toLowerCase() === dbFacEmail)) || e.facultyId === facId || e.facultyId === dbFacId;
            const subjectMatches = subjectCode ? (e.subjectCode && e.subjectCode.toLowerCase() === subjectCode.toLowerCase()) : true;
            return facultyMatches && subjectMatches && (e.experimentNumber === i || e.id?.endsWith(`-${i}`));
          });
          const asg = student.assignments?.find((a: any) => {
            if (a.id === targetAsgId) return true;
            const facultyMatches = (a.gradedBy && (a.gradedBy.toLowerCase() === facId || a.gradedBy.toLowerCase() === facEmail || a.gradedBy.toLowerCase() === dbFacId || a.gradedBy.toLowerCase() === dbFacEmail)) || a.facultyId === facId || a.facultyId === dbFacId;
            const subjectMatches = subjectCode ? (a.subjectCode && a.subjectCode.toLowerCase() === subjectCode.toLowerCase()) : true;
            return facultyMatches && subjectMatches && (a.experimentNumber === i || a.id?.endsWith(`-${i}`));
          });

          const isAbsentToday = newAttendance[student.id] === 'Absent';

          let defaultObsStatus: 'none' | 'tick' | 'cross' = 'none';
          let defaultMarks = '';

          if (exp) {
            defaultObsStatus = exp.status === 'Approved' ? 'tick' : (exp.status === 'Rejected' || exp.status === 'Absent' ? 'cross' : 'none');
            defaultMarks = exp.score !== undefined && exp.score !== null && exp.score !== ''
              ? exp.score.toString()
              : (exp.status === 'Approved' ? '10' : (exp.status === 'Absent' || exp.score === 'A' ? 'A' : ''));
          } else if (isAbsentToday && i === Math.min(12, Math.max(1, sessionsCompleted))) {
            defaultObsStatus = 'cross';
            defaultMarks = 'A';
          }

          newSignoffs[student.id][i] = {
            observation: defaultObsStatus,
            observationMarks: defaultMarks,
            record: asg ? (asg.status === 'Rejected' ? 'cross' : (asg.status === 'Unsigned' || asg.status === 'none' ? 'none' : 'tick')) : 'none'
          };
        }
      });

      setAttendanceState(newAttendance);
      setSignoffState(prev => {
        if (!prev || Object.keys(prev).length === 0) return newSignoffs;

        const merged = { ...newSignoffs };
        for (const stId of Object.keys(prev)) {
          if (merged[stId]) {
            merged[stId] = { ...merged[stId] };
            for (const expK of Object.keys(prev[stId])) {
              const expIdx = Number(expK);
              const prevCell = prev[stId][expIdx];
              const isCurrentlyFocused = focusedCell === `${stId}-${expIdx}`;

              if (prevCell && (isCurrentlyFocused || (prevCell.observationMarks !== undefined && prevCell.observationMarks !== ''))) {
                merged[stId][expIdx] = {
                  ...merged[stId][expIdx],
                  observationMarks: prevCell.observationMarks,
                  observation: prevCell.observation
                };
              }
            }
          }
        }
        return merged;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, students, subjectKey, selectedDate, user.id, user.email]);

  // Live Statistics Calculations for Page 1
  const totalStudents = sectionStudents.length;
  const presentCount = sectionStudents.filter(s => attendanceState[s.id] === 'Present').length;
  const absentCount = sectionStudents.filter(s => attendanceState[s.id] === 'Absent').length;
  const odCount = sectionStudents.filter(s => attendanceState[s.id] === 'On Duty').length;
  const attendancePercentage = totalStudents > 0 ? Math.round(((presentCount + odCount) / totalStudents) * 100) : 0;

  // Active Experiment Index (based on Sessions Completed)
  const currentActiveExpIdx = Math.min(12, Math.max(1, sessionsCompleted));

  // Signed Student Counts for Current Active Session / Experiment
  const studentsWithObservationSignedActive = sectionStudents.filter(student => {
    const cell = signoffState[student.id]?.[currentActiveExpIdx];
    return cell?.observation === 'tick' || (cell?.observationMarks !== undefined && cell?.observationMarks !== '' && cell?.observationMarks !== null);
  }).length;

  const studentsWithRecordSignedActive = sectionStudents.filter(student => {
    return signoffState[student.id]?.[currentActiveExpIdx]?.record === 'tick';
  }).length;

  // Experiment-wise Detailed Signoff Breakdown for all 12 Experiments
  const experimentSignoffBreakdown = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(expIdx => {
    const obsSigned = sectionStudents.filter(student => {
      const cell = signoffState[student.id]?.[expIdx];
      return cell?.observation === 'tick' || (cell?.observationMarks !== undefined && cell?.observationMarks !== '' && cell?.observationMarks !== null);
    }).length;

    const recSigned = sectionStudents.filter(student => {
      return signoffState[student.id]?.[expIdx]?.record === 'tick';
    }).length;

    return {
      expIdx,
      name: LAB_EXERCISES[expIdx - 1]?.name || `Experiment ${expIdx}`,
      obsSigned,
      recSigned,
      total: totalStudents,
      isCurrent: expIdx === currentActiveExpIdx,
      isAllObsSigned: totalStudents > 0 && obsSigned === totalStudents,
      isAllRecSigned: totalStudents > 0 && recSigned === totalStudents,
    };
  });

  // Day-by-Day Report Calculation for reportDate
  const facEmail = (user.email || "").toLowerCase();
  const facId = (user.id || "").toLowerCase();
  const dbFacData = getFacultyData(user.email || user.id);
  const dbFacEmail = (dbFacData?.email || "").toLowerCase();
  const dbFacId = (dbFacData?.id || "").toLowerCase();

  // Generate Unique Daily Report Reference ID
  const cleanReportDate = reportDate.replace(/-/g, '');
  const uniqueReportRef = `DAR-${cleanReportDate}-${(selectedSection || 'SEC').toUpperCase()}-${(subjectCode || 'SUBJ').toUpperCase()}`;

  const dailyAttendanceListRaw = sectionStudents.map(student => {
    const dateRecords = (student.attendanceHistory || []).filter((h: any) => h.date === reportDate);
    const myRecord = dateRecords.find((h: any) => {
      const facultyMatches =
        (h.facultyEmail && facEmail && h.facultyEmail.toLowerCase() === facEmail) ||
        (h.facultyEmail && dbFacEmail && h.facultyEmail.toLowerCase() === dbFacEmail) ||
        (h.facultyId && facId && h.facultyId.toLowerCase() === facId) ||
        (h.facultyId && dbFacId && h.facultyId.toLowerCase() === dbFacId);
      if (!facultyMatches) return false;
      if (subjectCode && h.subjectCode && h.subjectCode.toLowerCase() !== subjectCode.toLowerCase()) return false;
      return true;
    });

    // Check Observation & Record signoffs strictly matching THIS Faculty member and THIS Subject for reportDate
    const obsEvaluatedOnDateRaw = (student.experiments || []).filter((e: any) => {
      const dateMatches = e.submittedAt === reportDate || (e.dueDate === reportDate && (e.status === 'Approved' || e.status === 'Absent' || (e.score !== undefined && e.score !== 0)));
      if (!dateMatches) return false;

      // Faculty match (strict): must be signed off by or created for this faculty member
      const eFac = (e.signedOffBy || e.facultyId || '').toLowerCase();
      const eId = (e.id || '').toLowerCase();
      const matchesFacultyIdentity =
        (eFac && (eFac === facId || eFac === facEmail || eFac === dbFacId || eFac === dbFacEmail)) ||
        (!eFac && (eId.includes(fidClean) || (subjectKey && eId.includes(subjectKey))));
      if (!matchesFacultyIdentity) return false;

      // Subject filter (strict)
      if (subjectCode && e.subjectCode && e.subjectCode.toLowerCase() !== subjectCode.toLowerCase()) return false;
      if (subjectName && e.subjectName && e.subjectName.toLowerCase() !== subjectName.toLowerCase()) return false;

      return e.status === 'Approved' || e.status === 'Absent' || e.status === 'On Duty' || (e.score !== undefined && e.score !== null && e.score !== 0 && e.score !== '');
    });

    // Deduplicate observation records by experimentNumber so Exp 1 appears only ONCE
    const uniqueObsOnDateMap = new Map<number, any>();
    obsEvaluatedOnDateRaw.forEach((e: any) => {
      const expNum = e.experimentNumber || Number(e.id?.split('-').pop()) || 1;
      if (!uniqueObsOnDateMap.has(expNum)) {
        uniqueObsOnDateMap.set(expNum, e);
      }
    });

    const uniqueObsList = Array.from(uniqueObsOnDateMap.values());

    const recEvaluatedOnDateRaw = (student.assignments || []).filter((a: any) => {
      const dateMatches = a.submittedAt === reportDate || (a.dueDate === reportDate && a.status === 'Graded');
      if (!dateMatches) return false;

      const aFac = (a.gradedBy || a.facultyId || '').toLowerCase();
      const aId = (a.id || '').toLowerCase();
      const matchesFacultyIdentity =
        (aFac && (aFac === facId || aFac === facEmail || aFac === dbFacId || aFac === dbFacEmail)) ||
        (!aFac && (aId.includes(fidClean) || (subjectKey && aId.includes(subjectKey))));
      if (!matchesFacultyIdentity) return false;

      if (subjectCode && a.subjectCode && a.subjectCode.toLowerCase() !== subjectCode.toLowerCase()) return false;
      if (subjectName && a.subjectName && a.subjectName.toLowerCase() !== subjectName.toLowerCase()) return false;

      return a.status === 'Graded' || a.status === 'Submitted';
    });

    const uniqueRecOnDateMap = new Map<number, any>();
    recEvaluatedOnDateRaw.forEach((a: any) => {
      const expNum = a.experimentNumber || Number(a.id?.split('-').pop()) || 1;
      if (!uniqueRecOnDateMap.has(expNum)) {
        uniqueRecOnDateMap.set(expNum, a);
      }
    });

    const uniqueRecList = Array.from(uniqueRecOnDateMap.values());

    const obsItems = uniqueObsList.map((e: any) => ({
      expNum: e.experimentNumber || e.id?.split('-').pop() || 1,
      score: e.score !== undefined && e.score !== null && e.score !== '' ? e.score : (e.status === 'Approved' ? '10' : e.status)
    }));

    const recItems = uniqueRecList.map((a: any) => ({
      expNum: a.experimentNumber || a.id?.split('-').pop() || 1,
      status: a.status === 'Graded' ? 'Signed' : a.status
    }));

    const obsStatusText = obsItems.length > 0 ? obsItems.map(i => `Exp ${i.expNum}: ${i.score}`).join(', ') : '-';
    const recStatusText = recItems.length > 0 ? recItems.map(i => `Exp ${i.expNum}: ${i.status}`).join(', ') : '-';

    return {
      student,
      rawStatus: myRecord ? (myRecord.status as string) : 'Present',
      obsStatusText,
      recStatusText,
      obsItems,
      recItems,
      hasObs: uniqueObsList.length > 0,
      hasRec: uniqueRecList.length > 0,
      time: myRecord ? (myRecord.time || 'Class Hours') : 'N/A'
    };
  });

  // Ensure 100% unique student entries in daily attendance list
  const dailyAttendanceList: any[] = Array.from(
    new Map<string, any>(dailyAttendanceListRaw.map(item => [item.student.id || item.student.rollNo || item.student.registerNo, item])).values()
  );

  const dailyPresentCount = dailyAttendanceList.filter(d => d.rawStatus === 'Present').length;
  const dailyAbsentCount = dailyAttendanceList.filter(d => d.rawStatus === 'Absent').length;
  const dailyODCount = dailyAttendanceList.filter(d => d.rawStatus === 'On Duty').length;
  const dailyTotalCount = dailyAttendanceList.length;
  const dailyAttendancePct = dailyTotalCount > 0 ? Math.round((dailyPresentCount / dailyTotalCount) * 100) : 0;

  const filteredAttendanceList = dailyAttendanceList.filter(item => {
    if (!reportSearchQuery.trim()) return true;
    const q = reportSearchQuery.toLowerCase();
    return item.student.name.toLowerCase().includes(q) || item.student.rollNo.toLowerCase().includes(q) || item.student.registerNo?.toLowerCase().includes(q);
  });

  // Day-by-Day Attendance Export Function with Unique Report Reference ID
  const handleExportDayReport = () => {
    const wb = XLSX.utils.book_new();

    const attendanceRows = dailyAttendanceList.map((d, idx) => ({
      "Report Ref ID": uniqueReportRef,
      "S.No": idx + 1,
      "Roll No": d.student.rollNo,
      "Student Name": d.student.name,
      "Register Number": d.student.registerNo || '-',
      "Batch": d.student.batch || selectedBatch,
      "Section": d.student.section || selectedSection,
      "Subject": subjectName,
      "Date": reportDate,
      "Attendance Status": d.rawStatus,
      "Observation Notebook Record": d.obsStatusText,
      "Record Notebook Status": d.recStatusText
    }));

    const wsAttendance = XLSX.utils.json_to_sheet(attendanceRows.length > 0 ? attendanceRows : [
      { "Note": `No students found for date ${reportDate} in section ${selectedSection}` }
    ]);
    XLSX.utils.book_append_sheet(wb, wsAttendance, "Daily Attendance & Lab Record");

    XLSX.writeFile(wb, `Daily_Report_${selectedSection}_${reportDate}_${uniqueReportRef}.xlsx`);
  };

  // Toggle present/absent/on duty today (Buffers changes locally until Confirm is clicked)
  const handleToggleAttendance = (studentId: string, status: 'Present' | 'Absent' | 'On Duty') => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
    setIsAttendanceDirty(true);
    setAttendanceSavedMessage(null);

    // Auto sync Observation Marks based on Attendance status
    const targetExpIdx = Math.min(12, Math.max(1, sessionsCompleted));
    setSignoffState(prev => {
      const studentState = prev[studentId] || {};
      const currentExpState = studentState[targetExpIdx] || { observation: 'none', record: 'none' };
      
      let newMarks = currentExpState.observationMarks || '';
      let newObsStatus: 'none' | 'tick' | 'cross' = currentExpState.observation;

      if (status === 'Absent') {
        newMarks = 'A';
        newObsStatus = 'cross';
      } else if (status === 'Present' && currentExpState.observationMarks === 'A') {
        newMarks = '';
        newObsStatus = 'none';
      }

      return {
        ...prev,
        [studentId]: {
          ...studentState,
          [targetExpIdx]: {
            ...currentExpState,
            observationMarks: newMarks,
            observation: newObsStatus
          }
        }
      };
    });

    if (status === 'Absent') {
      updateSignoff(studentId, targetExpIdx, { observationStatus: 'absent', observationMarks: 'A', subjectCode, subjectName });
    }
  };

  // Helper to mark all currently filtered section students as Present locally
  const handleMarkAllPresentDashboard = () => {
    const updated: Record<string, 'Present'> = {};
    sectionStudents.forEach((st) => {
      updated[st.id] = 'Present';
    });
    setAttendanceState(prev => ({ ...prev, ...updated }));
    setIsAttendanceDirty(true);
    setAttendanceSavedMessage(null);
  };

  // Confirm & Save Attendance to Database and sync overview stats
  const handleConfirmAttendanceDashboard = async () => {
    if (sectionStudents.length === 0) return;
    setIsAttendanceSaving(true);
    setAttendanceSavedMessage(null);

    const facEmail = (user.email || "").toLowerCase();
    const facId = (user.id || "").toLowerCase();
    const facData = getFacultyData(user.email || user.id);
    const dbFacId = (facData?.id || "").toLowerCase();
    const dbFacEmail = (facData?.email || "").toLowerCase();

    try {
      const itemsToSave = sectionStudents.map((student) => {
        const dateRecords = (student.attendanceHistory || []).filter((h: any) => h.date === today);
        let myRecord = dateRecords.find((h: any) => {
          const facultyMatches =
            (h.facultyEmail && facEmail && h.facultyEmail.toLowerCase() === facEmail) ||
            (h.facultyEmail && dbFacEmail && h.facultyEmail.toLowerCase() === dbFacEmail) ||
            (h.facultyId && facId && h.facultyId.toLowerCase() === facId) ||
            (h.facultyId && dbFacId && h.facultyId.toLowerCase() === dbFacId);
          if (!facultyMatches) return false;
          if (subjectCode && h.subjectCode && h.subjectCode.toLowerCase() !== subjectCode.toLowerCase()) return false;
          return true;
        });
        if (!myRecord && dateRecords.length > 0) {
          myRecord = dateRecords.find((h: any) => !h.facultyId && !h.facultyEmail) || dateRecords[dateRecords.length - 1];
        }

        const statusToSave = attendanceState[student.id] || (myRecord ? myRecord.status : 'Present');
        return { studentId: student.id, status: statusToSave };
      });

      await updateBatchStudentAttendance(itemsToSave, today, subjectCode, subjectName);
      await refreshData();

      setIsAttendanceDirty(false);
      setAttendanceSavedMessage("Attendance confirmed and saved successfully to database & overview!");
      setTimeout(() => setAttendanceSavedMessage(null), 4000);
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to save attendance. Please try again.");
    } finally {
      setIsAttendanceSaving(false);
    }
  };

  // Toggle observation or record checked sign: 'tick' -> 'cross' -> 'none' -> 'tick'
  const handleToggleSignoff = async (studentId: string, expIdx: number, type: 'observation' | 'record') => {
    const studentState = signoffState[studentId] || {};
    const expState = studentState[expIdx] || { observation: 'none', record: 'tick' };
    const currentVal = expState[type];
    
    let newVal: 'none' | 'tick' | 'cross' = 'tick';
    if (currentVal === 'tick') {
      newVal = 'cross';
    } else if (currentVal === 'cross') {
      newVal = 'none';
    } else if (currentVal === 'none') {
      newVal = 'tick';
    }

    setSignoffState(prev => ({
      ...prev,
      [studentId]: {
        ...studentState,
        [expIdx]: {
          ...expState,
          [type]: newVal
        }
      }
    }));

    try {
      if (type === 'observation') {
        await updateSignoff(studentId, expIdx, { observationStatus: newVal, subjectCode, subjectName });
      } else {
        await updateSignoff(studentId, expIdx, { recordStatus: newVal, subjectCode, subjectName });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isAfterCollegeHours = () => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    // College working hours: 8:00 AM (480 mins) to 3:30 PM (930 mins)
    return minutes > 930 || minutes < 480;
  };

  const focusMarkInput = (stIdx: number, expIdx: number) => {
    const el = document.getElementById(`mark-input-${stIdx}-${expIdx}`) as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select();
    }
  };

  const parseMarkInput = (value: string, isCurrentlyAbsent: boolean, isAfterHours: boolean) => {
    let trimmed = value.trim().toUpperCase();
    if (!trimmed || trimmed === '-') return { obsStatus: 'none' as const, finalMark: '' };
    if (trimmed === 'P' || trimmed === 'PRESENT') return { obsStatus: 'tick' as const, finalMark: isAfterHours ? 'F/10' : '10' };
    if (trimmed === 'A' || trimmed === 'ABSENT') return { obsStatus: 'absent' as const, finalMark: 'A' };
    if (trimmed === 'OD' || trimmed === 'ON DUTY') return { obsStatus: 'od' as const, finalMark: 'OD' };
    if (trimmed === 'X' || trimmed === 'CROSS' || trimmed === 'WRONG') return { obsStatus: 'cross' as const, finalMark: 'X' };

    // Check F prefix variations: F/10, F10, F 10, F-10
    const fMatch = trimmed.match(/^F[\/\s\-]?(\d+)$/);
    if (fMatch) {
      const num = Math.min(10, Math.max(0, Number(fMatch[1])));
      return { obsStatus: 'tick' as const, finalMark: `F/${num}` };
    }

    // Check A prefix variations: A/10, A10, A 10, A-10
    const aMatch = trimmed.match(/^A[\/\s\-]?(\d+)$/);
    if (aMatch) {
      const num = Math.min(10, Math.max(0, Number(aMatch[1])));
      return { obsStatus: 'tick' as const, finalMark: `A/${num}` };
    }

    // Check L prefix variations: L/10, L10, L 10, L-10
    const lMatch = trimmed.match(/^L[\/\s\-]?(\d+)$/);
    if (lMatch) {
      const num = Math.min(10, Math.max(0, Number(lMatch[1])));
      return { obsStatus: 'tick' as const, finalMark: `L/${num}` };
    }

    // Pure number input
    const num = Number(trimmed);
    if (!isNaN(num)) {
      const clamped = Math.min(10, Math.max(0, num));
      if (isCurrentlyAbsent) {
        return { obsStatus: 'tick' as const, finalMark: `A/${clamped}` };
      }
      return { obsStatus: 'tick' as const, finalMark: isAfterHours ? `F/${clamped}` : `${clamped}` };
    }

    return null;
  };

  const handleLocalMarksChange = (studentId: string, expIdx: number, value: string) => {
    setSignoffState(prev => {
      const studentState = prev[studentId] || {};
      const expState = studentState[expIdx] || { observation: 'none', record: 'none' };
      return {
        ...prev,
        [studentId]: {
          ...studentState,
          [expIdx]: {
            ...expState,
            observationMarks: value.toUpperCase()
          }
        }
      };
    });
  };

  const handleSaveMarks = async (studentId: string, expIdx: number, value: string) => {
    const currentMark = signoffState[studentId]?.[expIdx]?.observationMarks || '';
    const currentObsStatus = signoffState[studentId]?.[expIdx]?.observation;
    const isCurrentlyAbsent = currentMark === 'A' || currentMark.startsWith('A/') || currentObsStatus === 'cross' || attendanceState[studentId] === 'Absent';
    const isAfterHours = isAfterCollegeHours();

    const markValToParse = (value === '') 
      ? (isCurrentlyAbsent ? 'A/10' : (isAfterHours ? 'F/10' : '')) 
      : value;

    const parsed = parseMarkInput(markValToParse, isCurrentlyAbsent, isAfterHours);
    if (!parsed) {
      setSignoffState(prev => ({ ...prev }));
      return;
    }

    const { obsStatus, finalMark } = parsed;

    setSignoffState(prev => {
      const studentState = prev[studentId] || {};
      const expState = studentState[expIdx] || { observation: 'none', record: 'none' };
      return {
        ...prev,
        [studentId]: {
          ...studentState,
          [expIdx]: {
            ...expState,
            observationMarks: finalMark,
            observation: obsStatus === 'cross' || obsStatus === 'absent' ? 'cross' : (obsStatus === 'none' ? 'none' : 'tick')
          }
        }
      };
    });

    try {
      await updateSignoff(studentId, expIdx, {
        observationMarks: finalMark,
        observationStatus: obsStatus,
        subjectCode,
        subjectName
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickMarkAllPresent = async () => {
    const targetExpIdx = Math.min(12, Math.max(1, sessionsCompleted));
    const isAfterHours = isAfterCollegeHours();
    const markToApply = isAfterHours ? 'F/10' : '10';

    const updatedState = { ...signoffState };

    for (const student of sectionStudents) {
      if (attendanceState[student.id] !== 'Absent') {
        const studentState = updatedState[student.id] || {};
        const expState = studentState[targetExpIdx] || { observation: 'none', record: 'none' };
        updatedState[student.id] = {
          ...studentState,
          [targetExpIdx]: {
            ...expState,
            observationMarks: markToApply,
            observation: 'tick'
          }
        };

        try {
          await updateSignoff(student.id, targetExpIdx, {
            observationMarks: markToApply,
            observationStatus: 'tick',
            subjectCode,
            subjectName
          });
        } catch (err) {
          console.error(err);
        }
      }
    }

    setSignoffState(updatedState);
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

  // Export Observation Records to formatted Excel (.xlsx) spreadsheet
  const handleExportObservationExcel = () => {
    try {
      const titleRows = [
        ['PANIMALAR ENGINEERING COLLEGE'],
        ['DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE'],
        [`LABORATORY OBSERVATION RECORDS & MARKS REPORT — SECTION ${selectedSection}`],
        [`Subject: ${subjectName}${subjectCode ? ` (${subjectCode})` : ''} | Batch: ${selectedBatch} | Date: ${new Date().toLocaleDateString()}`],
        [] // blank row
      ];

      const headers = [
        'S.NO', 'ROLL NO', 'REGISTER NUMBER', 'STUDENT NAME',
        'EXP 1 MARKS', 'EXP 1 STATUS',
        'EXP 2 MARKS', 'EXP 2 STATUS',
        'EXP 3 MARKS', 'EXP 3 STATUS',
        'EXP 4 MARKS', 'EXP 4 STATUS',
        'EXP 5 MARKS', 'EXP 5 STATUS',
        'EXP 6 MARKS', 'EXP 6 STATUS',
        'EXP 7 MARKS', 'EXP 7 STATUS',
        'EXP 8 MARKS', 'EXP 8 STATUS',
        'EXP 9 MARKS', 'EXP 9 STATUS',
        'EXP 10 MARKS', 'EXP 10 STATUS',
        'EXP 11 MARKS', 'EXP 11 STATUS',
        'EXP 12 MARKS', 'EXP 12 STATUS',
        'TOTAL OBSERVATION MARKS', 'AVERAGE MARKS', 'SIGNATURE STATUS'
      ];

      const studentRows = sectionStudents.map((st, idx) => {
        let totalMarks = 0;
        let evalCount = 0;
        let hasSignature = false;

        const row: any[] = [idx + 1, st.rollNo, st.registerNo, st.name];

        for (let expIdx = 1; expIdx <= 12; expIdx++) {
          const state = signoffState[st.id]?.[expIdx];
          const markStr = state?.observationMarks;
          const markNum = markStr !== undefined && markStr !== '' && markStr !== null ? Number(markStr) : null;
          
          const obsVal = state?.observation || 'none';
          const statusText = obsVal === 'tick' ? 'Signed' : (obsVal === 'cross' ? 'Rejected' : 'Pending');

          if (markNum !== null && !isNaN(markNum)) {
            totalMarks += markNum;
            evalCount++;
          }
          if (obsVal === 'tick' || markNum !== null) {
            hasSignature = true;
          }

          row.push(markNum !== null ? markNum : '-', statusText);
        }

        const avgMarks = evalCount > 0 ? (totalMarks / evalCount).toFixed(1) : '-';
        row.push(totalMarks, avgMarks, hasSignature ? 'Signed' : 'Not Signed');
        return row;
      });

      const ws = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...studentRows]);

      ws['!cols'] = [
        { wch: 6 },  // S.No
        { wch: 12 }, // Roll No
        { wch: 16 }, // Register No
        { wch: 25 }, // Name
        ...Array(24).fill({ wch: 12 }),
        { wch: 24 }, // Total Marks
        { wch: 14 }, // Avg Marks
        { wch: 18 }, // Signature Status
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Observation_Records`);

      XLSX.writeFile(wb, `Observation_Records_Section_${selectedSection}.xlsx`);
    } catch (err) {
      console.error("Excel export error:", err);
      handleExportSignoffMatrix();
    }
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
          <div className="flex items-center gap-3 bg-indigo-900/70 border border-indigo-500/40 px-4 py-2.5 rounded-2xl shadow-inner">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl shrink-0">
              <Clock className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">College Working Hours</p>
              <p className="text-xs font-black text-white tracking-wide mt-0.5">8:00 AM – 3:30 PM</p>
            </div>
          </div>
        </div>
      </div>

      {/* LAB SESSION NOTIFICATION BANNER */}
      {(() => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = days[new Date().getDay()];
        const todaySessions = (facultyData.timetable || []).filter(
          (slot: any) => slot.day?.toLowerCase() === currentDayName.toLowerCase()
        );

        // Request browser notification permission and send notification
        if (todaySessions.length > 0 && typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
          // Send notification only once per session (use sessionStorage to track)
          const notifKey = `lab-notif-${user.id}-${currentDayName}`;
          if (Notification.permission === 'granted' && !sessionStorage.getItem(notifKey)) {
            sessionStorage.setItem(notifKey, 'sent');
            todaySessions.forEach((slot: any) => {
              new Notification(`Lab Session Today - ${slot.lab || 'Lab'}`, {
                body: `${slot.time} \u2022 ${slot.batch} \u2022 Room: ${slot.room}`,
                icon: '/favicon.ico',
              });
            });
          }
        }

        if (todaySessions.length === 0) return null;
        return (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
                  Active Lab Session{todaySessions.length > 1 ? 's' : ''} Today
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-600 text-white rounded-full text-[10px] font-black">
                    {todaySessions.length}
                  </span>
                </h4>
                <div className="mt-2 space-y-1.5">
                  {(() => {
                    const savedRaw = localStorage.getItem(`faculty_timetable_${user.id}`) || localStorage.getItem(`faculty_timetable_${user.email}`) || null;
                    let savedPeriod: string | null = null;
                    let savedShortForm: string | null = null;
                    if (savedRaw) {
                      try {
                        const parsed = JSON.parse(savedRaw);
                        if (parsed && typeof parsed === 'object') {
                          savedPeriod = parsed.period || null;
                          savedShortForm = parsed.subjectShortForm || null;
                        }
                      } catch { /* silent */ }
                    }

                    return todaySessions.map((slot: any, i: number) => (
                      <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded-lg font-bold">
                          {savedPeriod || slot.time}
                        </span>
                        {savedShortForm && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg font-mono font-black text-[11px]">
                            {savedShortForm}
                          </span>
                        )}
                        <span className="font-bold text-slate-700">{slot.lab || 'Lab Session'}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-600">Batch: <strong>{slot.batch}</strong></span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-600">Room: <strong>{slot.room}</strong></span>
                      </div>
                    ));
                  })()}
                </div>
                <p className="text-[10px] text-amber-600 mt-2 font-medium">
                  Browser notifications enabled • You will be alerted for upcoming sessions.
                </p>
              </div>
            </div>
          </div>
        );
      })()}



      {/* =======================================================
          PAGE 1: SECTION OVERVIEW & STATISTICS SUMMARY
          ======================================================= */}
      {activePage === 1 && (
        <div className="space-y-6">
          {/* LIVE DATE & TODAY'S PERIOD OF THE DAY BANNER */}
          <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-indigo-200/80 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Today's Date:</span>
                  <span className="text-xs font-black text-slate-800">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Scheduled Class Period:</span>
                  {(() => {
                    const savedRaw = localStorage.getItem(`faculty_timetable_${user.id}`) || localStorage.getItem(`faculty_timetable_${user.email}`) || null;
                    let savedPeriod: string | null = null;
                    if (savedRaw) {
                      try {
                        const parsed = JSON.parse(savedRaw);
                        if (parsed?.period) savedPeriod = parsed.period;
                      } catch { /* silent */ }
                    }

                    const daysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                    const currentDayCode = daysShort[new Date().getDay()];
                    const sfUpper = resolveFacultyShortForm(subjectName, subjectCode, user.id, user.email);

                    // Panimalar Master Matrix Lookup (Exact Lab vs Theory Period Breakdown)
                    const PANIMALAR_FULL_MATRIX: Record<string, {
                      labDay: string;
                      labPeriod: string;
                      labTag: string;
                      theory: Record<string, string>;
                    }> = {
                      KIES: {
                        labDay: 'FRI',
                        labPeriod: 'Period 2 & 3 Morning Lab Slot (8.50 AM - 10.30 AM)',
                        labTag: 'KIES LAB',
                        theory: {
                          MON: 'Period 6 (1.15 PM - 1.55 PM)',
                          TUE: 'Period 2 (8.50 AM - 9.40 AM)',
                          WED: 'Period 2 (8.50 AM - 9.40 AM)',
                          THU: 'Period 3 (9.40 AM - 10.30 AM)',
                          FRI: 'Period 6 (1.15 PM - 1.55 PM)'
                        }
                      },
                      DA: {
                        labDay: 'TUE',
                        labPeriod: 'Morning Lab Slot (10.45 AM - 12.40 PM)',
                        labTag: 'DA LAB',
                        theory: {
                          TUE: 'Period 1 (8.00 AM - 8.50 AM) & Period 7 (1.55 PM - 2.35 PM)',
                          WED: 'Period 3 (9.40 AM - 10.30 AM) & Period 4 (10.45 AM - 11.40 AM)',
                          FRI: 'Period 7 (1.55 PM - 2.35 PM)'
                        }
                      },
                      DEV: {
                        labDay: 'THU',
                        labPeriod: 'Morning Lab Slot (10.45 AM - 12.40 PM)',
                        labTag: 'DEV LAB',
                        theory: {
                          WED: 'Period 1 (8.00 AM - 8.50 AM) & Period 8 (2.35 PM - 3.15 PM)',
                          THU: 'Period 2 (8.50 AM - 9.40 AM)',
                          FRI: 'Period 8 (2.35 PM - 3.15 PM)'
                        }
                      },
                      TSP: {
                        labDay: 'MON',
                        labPeriod: 'Morning Lab Slot (10.45 AM - 12.40 PM)',
                        labTag: 'TSP 4 LAB',
                        theory: {}
                      }
                    };

                    const matrixEntry = PANIMALAR_FULL_MATRIX[sfUpper] || PANIMALAR_FULL_MATRIX['KIES'];
                    const isLabDay = (currentDayCode === matrixEntry.labDay);
                    const theoryPeriod = matrixEntry.theory[currentDayCode];

                    if (isLabDay) {
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-900 border border-amber-400/40 rounded-md font-mono font-black text-xs animate-pulse">
                            🧪 {matrixEntry.labTag}
                          </span>
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 font-black rounded-md text-xs">
                            {savedPeriod || matrixEntry.labPeriod}
                          </span>
                          <span className="text-xs font-bold text-slate-600">• Section {selectedSection || 'Section F'}</span>
                        </div>
                      );
                    }

                    if (theoryPeriod) {
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded-md font-mono font-black text-xs">
                            📖 {sfUpper} (Theory)
                          </span>
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-md text-xs">
                            {theoryPeriod}
                          </span>
                          <span className="text-xs font-bold text-slate-600">• Section {selectedSection || 'Section F'}</span>
                        </div>
                      );
                    }

                    return (
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-extrabold text-xs">
                        No Class/Lab Session Scheduled Today
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* ADMIN ASSIGNED ACADEMIC PROFILE BANNER */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-850 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-700/40">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-500/20 text-indigo-300 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-400/30 shrink-0 shadow-inner">
                  {facultyData.name?.charAt(0) || 'F'}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    {facultyData.name}
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 uppercase">
                      Activated & Verified
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200/90 font-medium flex items-center gap-2 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" /> {facultyData.email}
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={() => setShowMyTimetableModal(true)}
                      className="px-3 py-1 bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-400/30 rounded-xl text-[11px] font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                      <span>My Subject Timetable</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center">
                  <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Assigned Lab</p>
                  <p className="text-xs font-extrabold text-white mt-0.5 truncate">{facultyData.labName || 'General Lab'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center">
                  <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Subject & Code</p>
                  <p className="text-xs font-extrabold text-white mt-0.5 truncate">{subjectName} ({subjectCode})</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center">
                  <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Assigned Section</p>
                  <p className="text-xs font-extrabold text-emerald-300 mt-0.5 truncate">{facultyData.section || availableSections[0] || 'Section A'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center">
                  <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Section Students</p>
                  <p className="text-xs font-extrabold text-amber-300 mt-0.5">{myStudents.length} Enrolled</p>
                </div>
                <div className="bg-amber-500/20 backdrop-blur-xs p-3 rounded-2xl border border-amber-400/30 text-center col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-amber-200 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-amber-300 shrink-0" /> Working Hours
                  </p>
                  <p className="text-xs font-black text-amber-300 mt-0.5">8:00 AM – 3:30 PM</p>
                </div>
              </div>
            </div>
          </div>
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
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={sessionsCompleted}
                    onChange={(e) => handleUpdateSessionsCompleted(parseInt(e.target.value, 10))}
                    className="w-14 text-center font-black text-2xl text-indigo-950 bg-indigo-50/70 border border-indigo-200 rounded-xl py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex flex-col gap-0.5">
                    <button 
                      onClick={() => handleUpdateSessionsCompleted(sessionsCompleted + 1)}
                      className="w-5 h-3.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-[10px] font-black rounded flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => handleUpdateSessionsCompleted(sessionsCompleted - 1)}
                      className="w-5 h-3.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-[10px] font-black rounded flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Out of 12 exercises</p>
              </div>
            </div>
          </div>

          {/* SIGN-OFF COUNTS SUMMARY CARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OBSERVATION CARD */}
            <div className="bg-gradient-to-tr from-emerald-50/50 to-teal-50/20 p-6 rounded-3xl border border-emerald-100/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Signed Observation Notebooks</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Session {currentActiveExpIdx} (Exp {currentActiveExpIdx})</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExpBreakdownModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <BarChart className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
              </div>
              <div className="pt-1 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800">{studentsWithObservationSignedActive}</span>
                <span className="text-base font-extrabold text-slate-400">/ {totalStudents}</span>
                <span className={`text-xs font-bold ml-1.5 px-3 py-1 rounded-lg border flex items-center gap-1 ${
                  studentsWithObservationSignedActive === totalStudents && totalStudents > 0
                    ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs'
                    : 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
                }`}>
                  {studentsWithObservationSignedActive === totalStudents && totalStudents > 0 ? (
                    <><span>🎉</span> All {totalStudents} Students Signed!</>
                  ) : (
                    <>{studentsWithObservationSignedActive} Students Signed</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-3 rounded-xl font-medium border border-emerald-100/40 flex-1">
                  {studentsWithObservationSignedActive === totalStudents && totalStudents > 0
                    ? `All ${totalStudents} students in Section ${selectedSection} have received Observation signatures for Session ${currentActiveExpIdx}.`
                    : `${studentsWithObservationSignedActive} out of ${totalStudents} students have signed Observation for Session ${currentActiveExpIdx}.`}
                </div>
                <button
                  onClick={handleExportObservationExcel}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-sm shrink-0 active:scale-95"
                  title="Download Observation Records as Excel Sheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Excel</span>
                </button>
              </div>
            </div>

            {/* RECORD CARD */}
            <div className="bg-gradient-to-tr from-blue-50/50 to-indigo-50/20 p-6 rounded-3xl border border-blue-100/50 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Signed Record Notebooks</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Session {currentActiveExpIdx} (Exp {currentActiveExpIdx})</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExpBreakdownModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-blue-100/80 text-blue-800 border border-blue-200 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <BarChart className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
              </div>
              <div className="pt-1 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-800">{studentsWithRecordSignedActive}</span>
                <span className="text-base font-extrabold text-slate-400">/ {totalStudents}</span>
                <span className={`text-xs font-bold ml-1.5 px-3 py-1 rounded-lg border flex items-center gap-1 ${
                  studentsWithRecordSignedActive === totalStudents && totalStudents > 0
                    ? 'bg-blue-600 text-white border-blue-700 font-black shadow-xs'
                    : 'bg-blue-100/80 text-blue-800 border-blue-200'
                }`}>
                  {studentsWithRecordSignedActive === totalStudents && totalStudents > 0 ? (
                    <><span>🎉</span> All {totalStudents} Students Signed!</>
                  ) : (
                    <>{studentsWithRecordSignedActive} Students Signed</>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-blue-800 bg-blue-50/80 p-3 rounded-xl font-medium border border-blue-100/40">
                {studentsWithRecordSignedActive === totalStudents && totalStudents > 0
                  ? `All ${totalStudents} students in Section ${selectedSection} have received final Record signatures for Session ${currentActiveExpIdx}.`
                  : `${studentsWithRecordSignedActive} out of ${totalStudents} students have signed Record for Session ${currentActiveExpIdx}.`}
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
              {/* CALENDAR SESSION DATE SELECTOR */}
              <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200/60 px-3.5 py-2 transition shadow-sm">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-500 font-bold shrink-0">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setAttendanceState({});
                    setIsAttendanceDirty(false);
                    setAttendanceSavedMessage(null);
                  }}
                  className="bg-transparent font-extrabold text-slate-800 text-xs focus:outline-none cursor-pointer"
                />
              </div>

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
                onClick={handleMarkAllPresentDashboard}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-200"
              >
                <span>Mark All Present</span>
              </button>

              <button
                onClick={handleConfirmAttendanceDashboard}
                disabled={isAttendanceSaving || sectionStudents.length === 0}
                className={`py-2.5 px-5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                  isAttendanceSaving
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : isAttendanceDirty
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-500/30 shadow-indigo-600/20 animate-pulse'
                    : 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-indigo-700/20'
                }`}
              >
                {isAttendanceSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAttendanceDirty ? 'Confirm & Save Attendance' : 'Attendance Confirmed'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportAttendance}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* ATTENDANCE SAVED SUCCESS BANNER */}
          {attendanceSavedMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-3.5 text-xs font-bold text-emerald-800 flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                {attendanceSavedMessage}
              </span>
              <span className="text-[10px] text-emerald-600 uppercase font-black tracking-wider">Synced to Database & Overview</span>
            </div>
          )}

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
                        <td className="px-6 py-4 font-mono font-bold text-slate-700 whitespace-nowrap">{formatRollNo(st.rollNo)}</td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800 text-sm">{st.name}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-500">{st.registerNo}</td>
                        <td className="px-6 py-4 text-center">
                          <select
                            value={status}
                            onChange={(e) => handleToggleAttendance(st.id, e.target.value as 'Present' | 'Absent' | 'On Duty')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border cursor-pointer focus:outline-none focus:ring-2 transition-all shadow-xs ${
                              status === 'Present' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500/20' 
                                : status === 'On Duty'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500/20'
                                : 'bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-500/20'
                            }`}
                          >
                            <option value="Present" className="bg-white text-emerald-800 font-bold">✔ Present (P)</option>
                            <option value="Absent" className="bg-white text-rose-800 font-bold">✖ Absent (A)</option>
                            <option value="On Duty" className="bg-white text-amber-800 font-bold">⚡ On Duty (OD)</option>
                          </select>
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
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400">
                    Check off experiment approvals. Tap cells to toggle status (✔ Signed / ✖ Pending).
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowTodayExpModal(true)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>Conducting Today: Exp {sessionsCompleted} ({LAB_EXERCISES[sessionsCompleted - 1]?.name || `Experiment ${sessionsCompleted}`})</span>
                      <span className="text-[10px] bg-indigo-800/90 px-2 py-0.5 rounded-md text-indigo-100 font-bold uppercase tracking-wider">Change</span>
                    </button>
                  </div>
                </div>
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQuickMarkAllPresent}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 active:scale-95"
                    title="Quickly evaluate 10/10 (or F/10 after hours) for all Present students in this session"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Quick Mark 10 All Present</span>
                  </button>
                  <button
                    onClick={handleExportObservationExcel}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-95"
                    title="Download Observation Records as Excel (.xlsx) Spreadsheet"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Observation Records (.xlsx)</span>
                  </button>
                </div>
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

          {/* FAST EVALUATION SHORTCUTS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs font-semibold text-indigo-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider">Smooth Evaluation Shortcuts</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono text-indigo-700 font-extrabold shadow-2xs">↓</kbd> or <kbd className="px-1.5 py-0.5 bg-white border border-indigo-200 rounded font-mono text-indigo-700 font-extrabold shadow-2xs">Enter</kbd> to jump to next student instantly.</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px]">10</span> Mark (0-10)</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">A</span> Absent</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-amber-600 text-white font-black text-[10px]">F/10</span> After-Hours</span>
              <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-black text-[10px]">L/10</span> Late Entry</span>
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
                    <th rowSpan={2} className="px-4 py-4 border-r border-slate-100 min-w-[130px] whitespace-nowrap">Roll No</th>
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
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((expIdx) => {
                      const isConductingToday = expIdx === sessionsCompleted;
                      return (
                        <th 
                          key={expIdx} 
                          onClick={() => handleUpdateSessionsCompleted(expIdx)}
                          className={`px-2 py-2.5 text-center border-r transition cursor-pointer min-w-[75px] ${
                            isConductingToday
                              ? 'bg-indigo-600 text-white border-indigo-700 font-black shadow-md shadow-indigo-600/30'
                              : 'border-slate-100 hover:bg-slate-100/80 text-slate-600'
                          }`}
                          title={`Exp ${expIdx}: ${LAB_EXERCISES[expIdx - 1]?.name} (Click to set as today's active experiment)`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span>Exp {expIdx}</span>
                            {isConductingToday && (
                              <span className="text-[7px] font-black bg-amber-400 text-slate-950 px-1 py-0.2 rounded tracking-tighter uppercase shadow-2xs">Active Today</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sectionStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-4 py-4 text-center font-bold text-slate-400 border-r border-slate-100 bg-slate-50/20">{idx + 1}</td>
                      <td className="px-4 py-4 font-mono font-bold text-slate-700 border-r border-slate-100 whitespace-nowrap">{formatRollNo(st.rollNo)}</td>
                      <td className="px-4 py-4 font-extrabold text-slate-800 border-r border-slate-100">{st.name}</td>
                      <td className="px-4 py-4 font-semibold text-slate-500 border-r border-slate-100">{st.registerNo}</td>
                                         {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((expIdx) => {
                        const isSelectedExp = expIdx === sessionsCompleted;
                        const cellState = signoffState[st.id]?.[expIdx] || { observation: 'none', record: 'tick' };
                        const status = notebookMode === 'observation' ? cellState.observation : cellState.record;
                        const hasObsMark = cellState.observationMarks !== undefined && cellState.observationMarks !== '' && cellState.observationMarks !== null;

                        return (
                          <td 
                            key={expIdx} 
                            onClick={() => {
                              if (notebookMode === 'record') {
                                if (isSelectedExp) {
                                  handleToggleSignoff(st.id, expIdx, 'record');
                                }
                              }
                            }}
                            className={`px-2 py-3.5 text-center border-r border-slate-100 transition-all duration-200 select-none ${
                              !isSelectedExp
                                ? 'opacity-30 bg-slate-100/50 cursor-not-allowed pointer-events-none'
                                : notebookMode === 'record'
                                ? 'cursor-pointer ' + (status === 'tick'
                                  ? 'bg-emerald-50/40 hover:bg-emerald-100/60' 
                                  : status === 'cross'
                                  ? 'bg-rose-50/40 hover:bg-rose-100/60'
                                  : 'bg-slate-50/10 hover:bg-slate-100/40')
                                : (hasObsMark || cellState.observation === 'tick'
                                  ? 'bg-emerald-50/50 hover:bg-emerald-100/60'
                                  : 'bg-indigo-50/20')
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {notebookMode === 'observation' ? (
                                <div className="flex flex-col items-center gap-1">
                                  {(() => {
                                    const isStudentAbsent = attendanceState[st.id] === 'Absent';
                                    const isAfterHours = isAfterCollegeHours();
                                    const rawMark = cellState.observationMarks;
                                    const displayMark = (rawMark !== undefined && rawMark !== null && rawMark !== '') 
                                      ? rawMark 
                                      : (isStudentAbsent && isSelectedExp 
                                        ? 'A/10' 
                                        : (isAfterHours && isSelectedExp 
                                          ? 'F/10' 
                                          : ''));

                                    const isFMark = typeof displayMark === 'string' && (displayMark.startsWith('F/') || displayMark.startsWith('F-'));
                                    const isLMark = typeof displayMark === 'string' && (displayMark.startsWith('L/') || displayMark.startsWith('L-'));
                                    const isAMark = typeof displayMark === 'string' && (displayMark.startsWith('A/') || displayMark === 'A');

                                    const cellId = `${st.id}-${expIdx}`;
                                    const isFocused = focusedCell === cellId;

                                    return (
                                      <input
                                        id={`mark-input-${idx}-${expIdx}`}
                                        type="text"
                                        value={displayMark}
                                        disabled={!isSelectedExp}
                                        readOnly={!isSelectedExp}
                                        onFocus={(e) => {
                                          if (!isSelectedExp) return;
                                          setFocusedCell(cellId);
                                          e.target.select();
                                        }}
                                        onChange={(e) => {
                                          if (!isSelectedExp) return;
                                          handleLocalMarksChange(st.id, expIdx, e.target.value);
                                        }}
                                        onBlur={(e) => {
                                          if (!isSelectedExp) return;
                                          setFocusedCell(null);
                                          handleSaveMarks(st.id, expIdx, e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                          if (!isSelectedExp) return;
                                          if (e.key === 'Enter' || e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            (e.target as HTMLInputElement).blur();
                                            focusMarkInput(idx + 1, expIdx);
                                          } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            (e.target as HTMLInputElement).blur();
                                            focusMarkInput(idx - 1, expIdx);
                                          }
                                        }}
                                        className={`w-14 text-center rounded-lg py-1 font-extrabold text-xs transition-all shadow-xs focus:outline-none placeholder:text-slate-600 placeholder:font-black ${
                                          !isSelectedExp
                                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                            : isFocused
                                            ? 'bg-white text-slate-900 border-2 border-indigo-600 ring-4 ring-indigo-100 font-black text-sm scale-110 z-20 shadow-lg'
                                            : displayMark === 'A'
                                            ? 'bg-rose-600 text-white border-2 border-rose-700 font-black shadow-sm'
                                            : isAMark
                                            ? 'bg-rose-500 text-white border-2 border-rose-600 font-black shadow-sm'
                                            : displayMark === 'OD'
                                            ? 'bg-amber-500 text-white border-2 border-amber-600 font-black shadow-sm'
                                            : isFMark
                                            ? 'bg-amber-600 text-white border-2 border-amber-700 font-black shadow-sm'
                                            : isLMark
                                            ? 'bg-indigo-600 text-white border-2 border-indigo-700 font-black shadow-sm'
                                            : displayMark === 'X' || cellState.observation === 'cross'
                                            ? 'bg-rose-100 text-rose-700 border-2 border-rose-400 font-black'
                                            : (hasObsMark || cellState.observation === 'tick'
                                              ? 'bg-emerald-600 text-white border-2 border-emerald-700 font-black shadow-sm'
                                              : (isAfterHours
                                                ? 'bg-amber-50/50 text-amber-900 border border-amber-300 font-bold placeholder:text-amber-600/70'
                                                : 'bg-white text-slate-800 border border-slate-200 font-bold'))
                                        }`}
                                        placeholder={isSelectedExp && isAfterHours ? "F/" : "-"}
                                      />
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div className="cursor-pointer">
                                  {status === 'tick' ? (
                                    <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 shadow-inner animate-in zoom-in-75 duration-100 inline-flex items-center justify-center">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  ) : status === 'cross' ? (
                                    <div className="p-1.5 rounded-full bg-rose-100 text-rose-600 shadow-inner animate-in zoom-in-75 duration-100 inline-flex items-center justify-center">
                                      <X className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-300 bg-white transition-colors hover:border-slate-400 inline-block" />
                                  )}
                                </div>
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
          PAGE 5: DAY-BY-DAY ATTENDANCE REPORTS
          ======================================================= */}
      {activePage === 5 && (
        <div className="space-y-6 animate-fade-in">
          {/* HEADER & DATE SELECTOR TOOLBAR */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-extrabold text-slate-800">Day-by-Day Attendance Reports</h2>
                <span className="px-3 py-1 bg-indigo-100/80 text-indigo-700 text-[11px] font-black rounded-full border border-indigo-200 uppercase tracking-wide">
                  Ref: {uniqueReportRef}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Inspect daily student attendance records and export unique institutional attendance logs for any selected date.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* DATE PICKER */}
              <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200/60 px-3.5 py-2 transition shadow-sm">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-slate-500 font-bold shrink-0">Select Date:</span>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>

              {/* QUICK DATE SHORTCUT BUTTONS */}
              <button
                type="button"
                onClick={() => setReportDate(getLocalDateString())}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  reportDate === getLocalDateString()
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setReportDate(getLocalDateString(d));
                }}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 transition cursor-pointer"
              >
                Yesterday
              </button>

              {/* EXPORT BUTTON */}
              <button
                onClick={handleExportDayReport}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-95"
                title="Download Day Attendance Report as Excel (.xlsx)"
              >
                <Download className="w-4 h-4" />
                <span>Export Day Report (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* DAILY KPI METRICS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Attendance Rate</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{dailyAttendancePct}%</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{dailyPresentCount} of {dailyTotalCount} Present</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Present Today</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{dailyPresentCount}</h3>
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Students Marked Present</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <Check className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Absentees Today</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{dailyAbsentCount}</h3>
                <p className="text-[10px] text-rose-700 font-semibold mt-0.5">Students Absent on {reportDate}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                <XCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">On Duty Today</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{dailyODCount}</h3>
                <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Students On Duty on {reportDate}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
            
          {/* SEARCH TOOLBAR & VIEW TOGGLE SWITCH */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="inline-flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setReportViewTab('attendance')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  reportViewTab === 'attendance'
                    ? 'bg-white text-indigo-700 shadow-md border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daily Attendance Roster
              </button>
              <button
                type="button"
                onClick={() => setReportViewTab('evaluations')}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  reportViewTab === 'evaluations'
                    ? 'bg-white text-indigo-700 shadow-md border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Daily Observation Records
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <input
                type="text"
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                placeholder="Search student or roll no..."
                className="w-full pl-3.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* REPORT DATA TABLES */}
          {reportViewTab === 'attendance' ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                      <th className="px-6 py-4 text-center">S.No</th>
                      <th className="px-6 py-4">Roll No</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Register Number</th>
                      <th className="px-6 py-4">Section / Batch</th>
                      <th className="px-6 py-4 text-center">Attendance Status on {reportDate}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredAttendanceList.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-700 whitespace-nowrap">{formatRollNo(item.student.rollNo)}</td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800 text-sm">{item.student.name}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-500">{item.student.registerNo || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{item.student.section || selectedSection} • {selectedBatch}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border inline-block ${
                            item.rawStatus === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.rawStatus === 'On Duty'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {item.rawStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredAttendanceList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
                          No attendance records found for {reportDate} matching filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                      <th className="px-6 py-4 text-center">S.No</th>
                      <th className="px-6 py-4">Roll No</th>
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Register Number</th>
                      <th className="px-6 py-4 text-center">Observation Notebook Record ({reportDate})</th>
                      <th className="px-6 py-4 text-center">Record Notebook Status ({reportDate})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredAttendanceList.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-700 whitespace-nowrap">{formatRollNo(item.student.rollNo)}</td>
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800 text-sm">{item.student.name}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-500">{item.student.registerNo || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          {item.obsItems && item.obsItems.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[280px] mx-auto">
                              {item.obsItems.map((expItem: any, eIdx: number) => {
                                const scoreStr = String(expItem.score || '');
                                const isF = scoreStr.startsWith('F/') || scoreStr.startsWith('F-');
                                const isA = scoreStr === 'A' || scoreStr.startsWith('A/');
                                const isL = scoreStr.startsWith('L/') || scoreStr.startsWith('L-');
                                const isPass = scoreStr === '10' || expItem.score === 10;

                                return (
                                  <span 
                                    key={eIdx}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black border shadow-2xs ${
                                      isA
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : isF
                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                        : isL
                                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                        : isPass
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-blue-50 text-blue-800 border-blue-200'
                                    }`}
                                  >
                                    <span className="text-slate-400 font-extrabold text-[10px]">Exp {expItem.expNum}:</span>
                                    <span>{expItem.score}</span>
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-semibold text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.recItems && item.recItems.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[280px] mx-auto">
                              {item.recItems.map((recItem: any, rIdx: number) => (
                                <span 
                                  key={rIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs"
                                >
                                  <span className="text-indigo-400 font-extrabold text-[10px]">Exp {recItem.expNum}:</span>
                                  <span>{recItem.status}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-semibold text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredAttendanceList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-semibold text-sm">
                          No observation records found for {reportDate} matching filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================
          PAGE 6: DEDICATED INSTITUTIONAL FACULTY PROFILE VIEW
          ======================================================= */}
      {activePage === 6 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 md:p-10 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-100">
              <div className="flex flex-col md:flex-row items-center gap-8">
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
              
              <button
                onClick={() => {
                  setEditForm({
                    name: facultyData.name || '',
                    phone: facultyData.phone || '',
                    subjectName: subjectName || '',
                    subjectCode: subjectCode || '',
                    labName: facultyData.labName || '',
                    batch: facultyData.batch || '',
                  });
                  setShowEditProfileModal(true);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md active:scale-95 animate-fade-in"
              >
                <Edit3 className="w-4 h-4" />
                <span>Modify Profile Details</span>
              </button>
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
                    <span className="text-slate-500 font-bold">Handling Batch Sections</span>
                    <span className="text-slate-850 font-black">{facultyData.batch || 'AI & DS-A1, AI & DS-A2'}</span>
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
                  <span className="text-slate-850 font-bold">{facultyData.batch || 'AI & DS-A1, AI & DS-A2'}</span>
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

      {showEditProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden transform scale-100 transition-all p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <span>Modify Faculty Profile Details</span>
              </h3>
              <button onClick={() => setShowEditProfileModal(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.name} 
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Handling Subject Name</label>
                <input 
                  type="text" 
                  value={editForm.subjectName} 
                  onChange={e => setEditForm(prev => ({ ...prev, subjectName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Subject Code</label>
                <input 
                  type="text" 
                  value={editForm.subjectCode} 
                  onChange={e => setEditForm(prev => ({ ...prev, subjectCode: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Assigned Laboratory Room</label>
                <input 
                  type="text" 
                  value={editForm.labName} 
                  onChange={e => setEditForm(prev => ({ ...prev, labName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Handling Batches / Sections</label>
                <input 
                  type="text" 
                  value={editForm.batch} 
                  onChange={e => setEditForm(prev => ({ ...prev, batch: e.target.value }))}
                  placeholder="e.g. AI & DS-A1, AI & DS-A2, AI & DS-B1"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPERIMENT SIGNOFF BREAKDOWN MODAL */}
      {showExpBreakdownModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden transform scale-100 transition-all">
            <div className="bg-gradient-to-r from-blue-950 to-[#0B192C] text-white p-6 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black tracking-tight">Experiment-Wise Student Signoff Breakdown</h3>
                <p className="text-xs text-indigo-200 font-semibold mt-0.5">Section {selectedSection} • Total Students: {totalStudents}</p>
              </div>
              <button 
                onClick={() => setShowExpBreakdownModal(false)}
                className="text-slate-300 hover:text-white p-1.5 hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                      <th className="px-4 py-3 text-center">Exp #</th>
                      <th className="px-4 py-3">Experiment Name</th>
                      <th className="px-4 py-3 text-center">Observation Signed</th>
                      <th className="px-4 py-3 text-center">Record Signed</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {experimentSignoffBreakdown.map((item) => (
                      <tr key={item.expIdx} className={`hover:bg-slate-50/60 transition ${item.isCurrent ? 'bg-indigo-50/40 font-extrabold' : ''}`}>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-500">{item.expIdx}</td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">{item.name}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border inline-block ${
                            item.isAllObsSigned
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                              : item.obsSigned > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {item.obsSigned} / {item.total} {item.isAllObsSigned ? '🎉 All Signed!' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border inline-block ${
                            item.isAllRecSigned
                              ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-2xs'
                              : item.recSigned > 0
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {item.recSigned} / {item.total} {item.isAllRecSigned ? '🎉 All Signed!' : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.isCurrent
                              ? 'bg-indigo-600 text-white'
                              : item.isAllObsSigned
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {item.isCurrent ? 'Active Session' : (item.isAllObsSigned ? 'Completed' : 'Pending')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setShowExpBreakdownModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-sm"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TODAY'S EXPERIMENT SELECTION MODAL */}
      {showTodayExpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden transform scale-100 transition-all">
            <div className="bg-gradient-to-r from-blue-950 to-[#0B192C] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/30 rounded-xl border border-indigo-400/30">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Select Today's Experiment Number</h3>
                  <p className="text-[11px] text-indigo-200 font-semibold">Which Exp No are you evaluating for Section {selectedSection}?</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTodayExpModal(false)}
                className="text-slate-300 hover:text-white p-1 hover:bg-slate-800/50 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-3">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Select Experiment Number:</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((expNum) => {
                  const isSelected = sessionsCompleted === expNum;

                  return (
                    <button
                      key={expNum}
                      onClick={() => {
                        handleUpdateSessionsCompleted(expNum);
                        setShowTodayExpModal(false);
                      }}
                      className={`py-3.5 px-2 rounded-2xl border text-center font-black transition-all cursor-pointer shadow-xs ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-700 ring-4 ring-indigo-100 text-sm shadow-md scale-105'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-xs'
                      }`}
                    >
                      EXP {expNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setShowTodayExpModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl cursor-pointer transition shadow-md shadow-indigo-600/20"
              >
                Confirm EXP {sessionsCompleted} & Start Evaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MY SUBJECT TIMETABLE MODAL (FACULTY DASHBOARD) */}
      {showMyTimetableModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden transform scale-100 transition-all">
            <div className="bg-gradient-to-r from-blue-950 to-[#0B192C] text-white p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/30 rounded-xl border border-indigo-400/30">
                  <Calendar className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Assigned Subject Timetable Schedule</h3>
                  <p className="text-xs text-indigo-200 font-semibold mt-0.5">{subjectName} ({subjectCode}) • Section {selectedSection}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMyTimetableModal(false)}
                className="text-slate-300 hover:text-white p-1.5 hover:bg-slate-800/50 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {(() => {
                const savedRaw = localStorage.getItem(`faculty_timetable_${user.id}`) || localStorage.getItem(`faculty_timetable_${user.email}`) || null;
                let savedImg: string | null = null;
                let savedPeriod: string | null = null;
                let savedShortForm: string | null = null;

                if (savedRaw) {
                  try {
                    const parsed = JSON.parse(savedRaw);
                    if (parsed && typeof parsed === 'object' && parsed.image) {
                      savedImg = parsed.image;
                      savedPeriod = parsed.period || null;
                      savedShortForm = parsed.subjectShortForm || null;
                    } else {
                      savedImg = savedRaw;
                    }
                  } catch {
                    savedImg = savedRaw;
                  }
                } else if (facultyData.timetableImage) {
                  savedImg = facultyData.timetableImage;
                }

                if (savedImg) {
                  return (
                    <div className="space-y-4">
                      {/* Banner with Subject Short Form & Period */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-bold uppercase text-[10px]">Timetable Tag (Short Form):</span>
                          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-900 border border-amber-500/30 rounded-lg font-mono font-black text-xs">
                            {savedShortForm || getSubjectShortForm(subjectName, undefined, subjectCode)}
                          </span>
                        </div>
                        {savedPeriod && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-bold uppercase text-[10px]">Assigned Period / Schedule:</span>
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-extrabold text-xs">
                              {savedPeriod}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex justify-center items-center overflow-hidden max-h-[520px] shadow-lg">
                        <img src={savedImg} alt="My Subject Timetable Schedule" className="max-h-[500px] w-auto object-contain rounded-xl" />
                      </div>
                      <p className="text-xs text-slate-500 text-center font-medium">
                        Assigned by HOD for handling subject: <strong>{subjectName} ({subjectCode})</strong>
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-base">No Timetable Image Uploaded Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Your HOD has not uploaded a timetable image for your handling subject ({subjectName}) yet. Once uploaded by HOD in Faculty Access, it will appear here.
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setShowMyTimetableModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-sm"
              >
                Close Timetable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// FacultyDashboard Component End
