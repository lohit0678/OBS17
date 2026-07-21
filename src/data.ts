export interface TimetableSlot {
  day: string;
  time: string;
  lab: string;
  batch: string;
  room: string;
}

export interface LabExperiment {
  id: string;
  name: string;
  dueDate: string;
  observationPdfUrl?: string; // e.g. "observation_ex1.pdf"
  recordPdfUrl?: string; // e.g. "record_ex1.pdf"
  status: 'Not Submitted' | 'Submitted - Pending' | 'Approved' | 'Rejected';
  score: number; // Max 100
  maxScore: number;
  remarks?: string;
  submittedAt?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  fileUrl?: string; // Downloadable file reference
  status: 'Pending' | 'Submitted' | 'Graded';
  score?: number;
  maxScore: number;
  remarks?: string;
  submittedAt?: string;
}

export interface InternalMarks {
  cia1: number; // Max 50
  cia2: number; // Max 50
  cia3: number; // Max 50
  practical: number; // Max 100
  average: number; // out of 100
}

export interface Notification {
  id: string;
  type: 'announcement' | 'circular' | 'schedule' | 'deadline' | 'exam';
  title: string;
  message: string;
  date: string;
  sender: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'session' | 'exam' | 'holiday' | 'deadline' | 'practical';
  description?: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  type: 'workshop' | 'symposium' | 'completion' | 'event';
}

export interface Student {
  id: string;
  name: string;
  email: string;
  facultyId: string;
  facultyName: string;
  attendance: number; // overall percentage (0-100)
  subjectAttendance: { [subject: string]: number }; // Subject-wise attendance
  attendanceHistory: { date: string; status: 'Present' | 'Absent' | 'On Duty' }[];
  experiments: LabExperiment[];
  assignments: Assignment[];
  internalMarks: { [subject: string]: InternalMarks }; // Subject-wise internal marks
  notifications: Notification[];
  calendarEvents: CalendarEvent[];
  certificates: Certificate[];
  batch: string; // e.g., "CSE-A1"
  labName: string; // Assigned Lab Name
  registerNo: string;
  rollNo: string;
  department: string;
  semester: string;
  section: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  profilePic?: string;
  riskFlagged: boolean;
  riskReason?: string;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  labName: string;
  batch: string;
  subjectsHandled: string[];
  subjectCode?: string;
  experience: string;
  workloadHours: number;
  performanceScore: number; // Out of 100
  timetable: TimetableSlot[];
  timetableImage?: string;
  profilePic?: string;
  phone?: string;
  isActive?: boolean;
  facultyAttendance?: number;
}

export const initialFaculties: Faculty[] = [];

// Helper to generate calendar events
const getMockCalendarEvents = (): CalendarEvent[] => [];

// Helper to generate notifications
const getMockNotifications = (): Notification[] => [];

export const DS_LAB_EXERCISES = [
  "Stack Implementation using Arrays & Linked Lists",
  "Queue Operations & Circular Queue implementation",
  "Singly & Doubly Linked List Operations",
  "Binary Search Tree Creation & Traversals",
  "Graph Search Algorithms (BFS & DFS)",
  "Sorting Algorithms (Merge Sort, Quick Sort)",
  "Hash Table Collision Resolution Techniques",
  "Minimum Spanning Tree (Kruskal & Prim)",
  "Shortest Path Routing (Dijkstra's Algorithm)",
  "Min/Max Heap and Priority Queue Applications"
];

export const DBMS_LAB_EXERCISES = [
  "Database Creation & SQL DDL Commands",
  "SQL DML Commands (Insert, Update, Delete)",
  "Complex Queries using Joins & Subqueries",
  "Aggregate Functions, Group By & Having",
  "Views, Indexes & Sequence Management",
  "PL/SQL Blocks & Conditional Statements",
  "PL/SQL Cursors (Implicit & Explicit)",
  "Database Triggers & Event Handling",
  "Stored Procedures & Functions",
  "NoSQL Database Operations (MongoDB)"
];

export const initialStudents: Student[] = [];


// Top-down Rollup Metrics for HOD
export function calculateDepartmentMetrics(students: Student[], faculties: Faculty[]) {
  const totalStudents = students.length;
  const totalFaculty = faculties.length;
  const activeLabs = Array.from(new Set(students.map(s => s.labName))).length;
  
  const avgAttendance = totalStudents > 0 
    ? Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / totalStudents) 
    : 0;
    
  // Calculate Lab Completion Rate
  // Defined as approved experiments / total assigned experiments across all students
  let totalExperimentsAssigned = 0;
  let totalExperimentsApproved = 0;
  let totalAssignmentsAssigned = 0;
  let totalAssignmentsCompleted = 0;
  students.forEach(s => {
    totalExperimentsAssigned += s.experiments.length;
    totalExperimentsApproved += s.experiments.filter(e => e.status === 'Approved').length;
    totalAssignmentsAssigned += s.assignments.length;
    totalAssignmentsCompleted += s.assignments.filter(a => a.status === 'Graded' || a.status === 'Submitted').length;
  });
  const labCompletionRate = totalExperimentsAssigned > 0
    ? Math.round((totalExperimentsApproved / totalExperimentsAssigned) * 100)
    : 0;
  const recordCompletionRate = totalAssignmentsAssigned > 0
    ? Math.round((totalAssignmentsCompleted / totalAssignmentsAssigned) * 100)
    : 0;

  // Pending items counts
  let pendingLabApprovals = 0;
  let pendingAssignments = 0;
  students.forEach(s => {
    pendingLabApprovals += s.experiments.filter(e => e.status === 'Submitted - Pending').length;
    pendingAssignments += s.assignments.filter(a => a.status === 'Submitted').length;
  });

  const totalAtRisk = students.filter(s => s.riskFlagged).length;

  return {
    totalStudents,
    totalFaculty,
    activeLabs,
    avgAttendance,
    labCompletionRate,
    recordCompletionRate,
    pendingLabApprovals,
    pendingAssignments,
    totalAtRisk,
  };
}

// Rollup Metrics per Faculty for HOD & Faculty Dashboard
export function getFacultyRollup(facultyId: string, students: Student[]) {
  const facultyStudents = students.filter(s => s.facultyId === facultyId);
  const count = facultyStudents.length;

  if (count === 0) {
    return {
      count: 0,
      avgAttendance: 0,
      labCompletionRate: 0,
      recordCompletionRate: 0,
      pendingApprovals: 0,
      pendingAssignments: 0,
      experimentsCompleted: 0,
      atRiskCount: 0,
    };
  }

  const avgAttendance = Math.round(facultyStudents.reduce((acc, s) => acc + s.attendance, 0) / count);
  
  let totalExps = 0;
  let approvedExps = 0;
  let pendingApprovals = 0;
  let pendingAssignments = 0;
  let totalAsgs = 0;
  let gradedAsgs = 0;

  facultyStudents.forEach(s => {
    totalExps += s.experiments.length;
    approvedExps += s.experiments.filter(e => e.status === 'Approved').length;
    pendingApprovals += s.experiments.filter(e => e.status === 'Submitted - Pending').length;
    pendingAssignments += s.assignments.filter(a => a.status === 'Submitted').length;
    totalAsgs += s.assignments.length;
    gradedAsgs += s.assignments.filter(a => a.status === 'Graded' || a.status === 'Submitted').length;
  });

  const labCompletionRate = totalExps > 0 ? Math.round((approvedExps / totalExps) * 100) : 0;
  const recordCompletionRate = totalAsgs > 0 ? Math.round((gradedAsgs / totalAsgs) * 100) : 0;
  const atRiskCount = facultyStudents.filter(s => s.riskFlagged).length;

  return {
    count,
    avgAttendance,
    labCompletionRate,
    recordCompletionRate,
    pendingApprovals,
    pendingAssignments,
    experimentsCompleted: approvedExps,
    atRiskCount,
  };
}
