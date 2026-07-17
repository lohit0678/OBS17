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
  profilePic?: string;
  phone?: string;
  isActive?: boolean;
  facultyAttendance?: number;
}

export const initialFaculties: Faculty[] = [
  {
    id: "F01",
    name: "Dr. Ramesh Kumar",
    email: "ramesh.kumar@college.edu",
    department: "Artificial Intelligence & Data Science",
    labName: "Data Structures & Algorithms Lab",
    batch: "AI & DS-A",
    subjectsHandled: ["Data Structures", "Analysis of Algorithms", "Advanced Coding Lab"],
    experience: "12 Years",
    workloadHours: 16,
    performanceScore: 92,
    timetable: [
      { day: "Monday", time: "09:00 AM - 11:00 AM", lab: "Data Structures Lab", batch: "AI & DS-A1", room: "Lab 3" },
      { day: "Wednesday", time: "11:15 AM - 01:15 PM", lab: "Data Structures Lab", batch: "AI & DS-A2", room: "Lab 3" },
      { day: "Thursday", time: "02:00 PM - 04:00 PM", lab: "Algorithms Lab", batch: "AI & DS-A1", room: "Lab 4" },
    ],
  },
  {
    id: "F02",
    name: "Prof. Sunita Rao",
    email: "sunita.rao@college.edu",
    department: "Artificial Intelligence & Data Science",
    labName: "Database Management Systems Lab",
    batch: "AI & DS-B",
    subjectsHandled: ["Database Management Systems", "NoSQL Databases", "SQL Lab"],
    experience: "9 Years",
    workloadHours: 14,
    performanceScore: 86,
    timetable: [
      { day: "Tuesday", time: "09:00 AM - 11:00 AM", lab: "DBMS Lab", batch: "AI & DS-B1", room: "Lab 1" },
      { day: "Wednesday", time: "02:00 PM - 04:00 PM", lab: "DBMS Lab", batch: "AI & DS-B2", room: "Lab 1" },
      { day: "Friday", time: "11:15 AM - 01:15 PM", lab: "Database Administration Lab", batch: "AI & DS-B1", room: "Lab 2" },
    ],
  },
  {
    id: "F03",
    name: "Dr. Amit Patel",
    email: "amit.patel@college.edu",
    department: "Artificial Intelligence & Data Science",
    labName: "Compiler Design & Network Lab",
    batch: "AI & DS-C",
    subjectsHandled: ["Compiler Design", "Computer Networks", "Network Simulation Lab"],
    experience: "15 Years",
    workloadHours: 18,
    performanceScore: 78,
    timetable: [
      { day: "Monday", time: "11:15 AM - 01:15 PM", lab: "Compiler Lab", batch: "AI & DS-C1", room: "Lab 5" },
      { day: "Tuesday", time: "02:00 PM - 04:00 PM", lab: "Computer Networks Lab", batch: "AI & DS-C2", room: "Lab 5" },
      { day: "Thursday", time: "09:00 AM - 11:00 AM", lab: "Compiler Lab", batch: "AI & DS-C2", room: "Lab 5" },
    ],
  },
];

// Helper to generate calendar events
const getMockCalendarEvents = (): CalendarEvent[] => [
  { id: "e1", title: "Data Structures Midterm Exam", date: "2026-07-15", type: "exam", description: "Theory exam in Room 402." },
  { id: "e2", title: "Graph Algorithms Practical Session", date: "2026-07-20", type: "session", description: "Implementation of Dijkstra and Bellman-Ford." },
  { id: "e3", title: "Observation Submission - Queue Operations", date: "2026-07-22", type: "deadline", description: "Observation submission deadline." },
  { id: "e4", title: "College Symposium Holiday", date: "2026-08-01", type: "holiday", description: "Institutional non-instructional day." },
  { id: "e5", title: "Final Practical External Evaluation", date: "2026-08-10", type: "practical", description: "End-semester external evaluation." },
];

// Helper to generate notifications
const getMockNotifications = (): Notification[] => [
  { id: "n1", type: "announcement", title: "Department Circular: Lab Manual Update", message: "Please download the updated Data Structures Lab manual from the resources portal.", date: "2026-07-06", sender: "Dr. Rajesh Sharma (HOD)" },
  { id: "n2", type: "deadline", title: "Urgent: Assignment 2 Deadline Extension", message: "The submission deadline for Trees Assignment has been extended to 12th July 2026.", date: "2026-07-08", sender: "Dr. Ramesh Kumar" },
  { id: "n3", type: "schedule", title: "Lab Schedule Update for AI & DS-A1", message: "The Thursday Algorithms lab will be relocated to Server Lab 2 due to system maintenance.", date: "2026-07-07", sender: "Dr. Ramesh Kumar" },
  { id: "n4", type: "exam", title: "CIA-2 Examination Timetable Released", message: "The second continuous internal assessment cycle begins on 15th July. Check notice board for full schedule.", date: "2026-07-05", sender: "Department Office" },
];

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

export const initialStudents: Student[] = [
  // Faculty F01 (Dr. Ramesh Kumar) Students
  {
    id: "S101",
    name: "Ananya Sharma",
    email: "ananya.sharma@student.edu",
    facultyId: "F01",
    facultyName: "Dr. Ramesh Kumar",
    attendance: 92,
    subjectAttendance: {
      "Data Structures Lab": 95,
      "Algorithms Lab": 90,
      "Object Oriented Programming Lab": 91
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Present" },
      { date: "2026-07-02", status: "Present" },
      { date: "2026-07-05", status: "Present" },
      { date: "2026-07-06", status: "Present" },
      { date: "2026-07-08", status: "Present" },
    ],
    experiments: [
      { id: "exp-1", name: "Stack Implementation using Arrays & Linked Lists", dueDate: "2026-07-02", observationPdfUrl: "obs_stack.pdf", recordPdfUrl: "rec_stack.pdf", status: "Approved", score: 95, maxScore: 100, remarks: "Excellent code structuring and analysis.", submittedAt: "2026-07-01" },
      { id: "exp-2", name: "Queue Operations & Circular Queue implementation", dueDate: "2026-07-06", observationPdfUrl: "obs_queue.pdf", recordPdfUrl: "rec_queue.pdf", status: "Approved", score: 90, maxScore: 100, remarks: "Good, but try to optimize memory usage.", submittedAt: "2026-07-05" },
      { id: "exp-3", name: "Singly & Doubly Linked List Operations", dueDate: "2026-07-10", observationPdfUrl: "obs_linkedlist.pdf", recordPdfUrl: "rec_linkedlist.pdf", status: "Approved", score: 92, maxScore: 100, remarks: "Excellent pointer manipulation logic.", submittedAt: "2026-07-09" },
      { id: "exp-4", name: "Binary Search Tree Creation & Traversals", dueDate: "2026-07-14", observationPdfUrl: "obs_bst.pdf", recordPdfUrl: "rec_bst.pdf", status: "Approved", score: 94, maxScore: 100, remarks: "Flawless recursive implementation.", submittedAt: "2026-07-13" },
      { id: "exp-5", name: "Graph Search Algorithms (BFS & DFS)", dueDate: "2026-07-18", observationPdfUrl: "obs_graphs.pdf", status: "Approved", score: 88, maxScore: 100, remarks: "Neat DFS traversal representation.", submittedAt: "2026-07-17" },
      { id: "exp-6", name: "Sorting Algorithms (Merge Sort, Quick Sort)", dueDate: "2026-07-22", observationPdfUrl: "obs_sorting.pdf", status: "Submitted - Pending", score: 0, maxScore: 100, submittedAt: "2026-07-21" },
      { id: "exp-7", name: "Hash Table Collision Resolution Techniques", dueDate: "2026-07-26", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-8", name: "Minimum Spanning Tree (Kruskal & Prim)", dueDate: "2026-07-30", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-9", name: "Shortest Path Routing (Dijkstra's Algorithm)", dueDate: "2026-08-03", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-10", name: "Min/Max Heap and Priority Queue Applications", dueDate: "2026-08-07", status: "Not Submitted", score: 0, maxScore: 100 },
    ],
    assignments: [
      { id: "asg-1", title: "Stack Implementation using Arrays & Linked Lists", description: "Theory worksheet for Stack implementation.", dueDate: "2026-07-02", status: "Graded", score: 48, maxScore: 50, remarks: "Perfect logical diagrams.", submittedAt: "2026-07-01" },
      { id: "asg-2", title: "Queue Operations & Circular Queue implementation", description: "Analysis on priority queues and buffer systems.", dueDate: "2026-07-06", status: "Graded", score: 45, maxScore: 50, remarks: "Excellent circular array calculations.", submittedAt: "2026-07-05" },
      { id: "asg-3", title: "Singly & Doubly Linked List Operations", description: "Write proofs for node deletion complexities.", dueDate: "2026-07-10", status: "Graded", score: 47, maxScore: 50, remarks: "Neat and comprehensive.", submittedAt: "2026-07-09" },
      { id: "asg-4", title: "Binary Search Tree Creation & Traversals", description: "Worksheet on post-order traversal and BST height.", dueDate: "2026-07-14", status: "Graded", score: 46, maxScore: 50, remarks: "Correct height analysis.", submittedAt: "2026-07-13" },
      { id: "asg-5", title: "Graph Search Algorithms (BFS & DFS)", description: "Worksheet on queue/stack states during graph traversal.", dueDate: "2026-07-18", status: "Submitted", maxScore: 50, submittedAt: "2026-07-17" },
      { id: "asg-6", title: "Sorting Algorithms (Merge Sort, Quick Sort)", description: "Asymptotic comparisons of QuickSort vs MergeSort.", dueDate: "2026-07-22", status: "Pending", maxScore: 50 },
      { id: "asg-7", title: "Hash Table Collision Resolution Techniques", description: "Worksheet on linear probing vs quadratic probing.", dueDate: "2026-07-26", status: "Pending", maxScore: 50 },
      { id: "asg-8", title: "Minimum Spanning Tree (Kruskal & Prim)", description: "State differences between Prim and Kruskal search rules.", dueDate: "2026-07-30", status: "Pending", maxScore: 50 },
      { id: "asg-9", title: "Shortest Path Routing (Dijkstra's Algorithm)", description: "Worksheet on Dijkstra paths for a given routing network.", dueDate: "2026-08-03", status: "Pending", maxScore: 50 },
      { id: "asg-10", title: "Min/Max Heap and Priority Queue Applications", description: "Formulate priority enqueue operations.", dueDate: "2026-08-07", status: "Pending", maxScore: 50 },
    ],
    internalMarks: {
      "Data Structures Lab": { cia1: 45, cia2: 42, cia3: 46, practical: 92, average: 90 },
      "Algorithms Lab": { cia1: 40, cia2: 44, cia3: 43, practical: 88, average: 86 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [
      { id: "cert-1", title: "Full Stack Java Development Workshop", issuer: "Oracle Academy", date: "2026-05-10", type: "workshop" },
      { id: "cert-2", title: "National Level Hackathon Participant", issuer: "IIT Madras", date: "2026-06-18", type: "event" },
      { id: "cert-3", title: "Laboratory Completion Certificate: Data Structures", issuer: "College AI & DS Dept", date: "2026-07-02", type: "completion" }
    ],
    batch: "AI & DS-A1",
    labName: "Data Structures & Algorithms Lab",
    registerNo: "UR20CS101",
    rollNo: "20CS01",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section A",
    phone: "+91 98765 43210",
    parentName: "Manoj Sharma",
    parentPhone: "+91 98765 43219",
    riskFlagged: false,
  },
  {
    id: "S102",
    name: "Rahul Verma",
    email: "rahul.verma@student.edu",
    facultyId: "F01",
    facultyName: "Dr. Ramesh Kumar",
    attendance: 64, // Critically low!
    subjectAttendance: {
      "Data Structures Lab": 60,
      "Algorithms Lab": 68,
      "Object Oriented Programming Lab": 64
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Absent" },
      { date: "2026-07-02", status: "Present" },
      { date: "2026-07-05", status: "Absent" },
      { date: "2026-07-06", status: "Present" },
      { date: "2026-07-08", status: "Absent" },
    ],
    experiments: [
      { id: "exp-1", name: "Stack Implementation using Arrays & Linked Lists", dueDate: "2026-07-02", observationPdfUrl: "obs_stack2.pdf", recordPdfUrl: "rec_stack2.pdf", status: "Approved", score: 65, maxScore: 100, remarks: "Code works but missing edge cases.", submittedAt: "2026-07-03" },
      { id: "exp-2", name: "Queue Operations & Circular Queue implementation", dueDate: "2026-07-06", observationPdfUrl: "obs_queue2.pdf", status: "Rejected", score: 0, maxScore: 100, remarks: "Code contains syntax errors. Redo and resubmit.", submittedAt: "2026-07-07" },
      { id: "exp-3", name: "Singly & Doubly Linked List Operations", dueDate: "2026-07-10", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-4", name: "Binary Search Tree Creation & Traversals", dueDate: "2026-07-14", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-5", name: "Graph Search Algorithms (BFS & DFS)", dueDate: "2026-07-18", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-6", name: "Sorting Algorithms (Merge Sort, Quick Sort)", dueDate: "2026-07-22", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-7", name: "Hash Table Collision Resolution Techniques", dueDate: "2026-07-26", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-8", name: "Minimum Spanning Tree (Kruskal & Prim)", dueDate: "2026-07-30", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-9", name: "Shortest Path Routing (Dijkstra's Algorithm)", dueDate: "2026-08-03", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-10", name: "Min/Max Heap and Priority Queue Applications", dueDate: "2026-08-07", status: "Not Submitted", score: 0, maxScore: 100 },
    ],
    assignments: [
      { id: "asg-1", title: "Stack Implementation using Arrays & Linked Lists", description: "Theory worksheet for Stack implementation.", dueDate: "2026-07-02", status: "Graded", score: 28, maxScore: 50, remarks: "Incomplete proofs. Needs improvement.", submittedAt: "2026-07-06" },
      { id: "asg-2", title: "Queue Operations & Circular Queue implementation", description: "Analysis on priority queues and buffer systems.", dueDate: "2026-07-06", status: "Pending", maxScore: 50 },
      { id: "asg-3", title: "Singly & Doubly Linked List Operations", description: "Write proofs for node deletion complexities.", dueDate: "2026-07-10", status: "Pending", maxScore: 50 },
      { id: "asg-4", title: "Binary Search Tree Creation & Traversals", description: "Worksheet on post-order traversal and BST height.", dueDate: "2026-07-14", status: "Pending", maxScore: 50 },
      { id: "asg-5", title: "Graph Search Algorithms (BFS & DFS)", description: "Worksheet on queue/stack states during graph traversal.", dueDate: "2026-07-18", status: "Pending", maxScore: 50 },
      { id: "asg-6", title: "Sorting Algorithms (Merge Sort, Quick Sort)", description: "Asymptotic comparisons of QuickSort vs MergeSort.", dueDate: "2026-07-22", status: "Pending", maxScore: 50 },
      { id: "asg-7", title: "Hash Table Collision Resolution Techniques", description: "Worksheet on linear probing vs quadratic probing.", dueDate: "2026-07-26", status: "Pending", maxScore: 50 },
      { id: "asg-8", title: "Minimum Spanning Tree (Kruskal & Prim)", description: "State differences between Prim and Kruskal search rules.", dueDate: "2026-07-30", status: "Pending", maxScore: 50 },
      { id: "asg-9", title: "Shortest Path Routing (Dijkstra's Algorithm)", description: "Worksheet on Dijkstra paths for a given routing network.", dueDate: "2026-08-03", status: "Pending", maxScore: 50 },
      { id: "asg-10", title: "Min/Max Heap and Priority Queue Applications", description: "Formulate priority enqueue operations.", dueDate: "2026-08-07", status: "Pending", maxScore: 50 },
    ],
    internalMarks: {
      "Data Structures Lab": { cia1: 24, cia2: 28, cia3: 20, practical: 55, average: 44 },
      "Algorithms Lab": { cia1: 28, cia2: 30, cia3: 22, practical: 60, average: 50 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [],
    batch: "AI & DS-A1",
    labName: "Data Structures & Algorithms Lab",
    registerNo: "UR20CS102",
    rollNo: "20CS02",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section A",
    phone: "+91 91234 56789",
    parentName: "Sanjay Verma",
    parentPhone: "+91 91234 56780",
    riskFlagged: true,
    riskReason: "Critically low overall attendance (64%) and multiple pending/rejected experiment completions.",
  },
  {
    id: "S103",
    name: "Sneha Patel",
    email: "sneha.patel@student.edu",
    facultyId: "F01",
    facultyName: "Dr. Ramesh Kumar",
    attendance: 88,
    subjectAttendance: {
      "Data Structures Lab": 90,
      "Algorithms Lab": 86,
      "Object Oriented Programming Lab": 88
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Present" },
      { date: "2026-07-02", status: "Present" },
      { date: "2026-07-05", status: "Present" },
      { date: "2026-07-06", status: "Absent" },
      { date: "2026-07-08", status: "Present" },
    ],
    experiments: [
      { id: "exp-1", name: "Stack Implementation using Arrays & Linked Lists", dueDate: "2026-07-02", observationPdfUrl: "obs_sneha_1.pdf", recordPdfUrl: "rec_sneha_1.pdf", status: "Approved", score: 85, maxScore: 100, remarks: "Well written files.", submittedAt: "2026-07-02" },
      { id: "exp-2", name: "Queue Operations & Circular Queue implementation", dueDate: "2026-07-06", observationPdfUrl: "obs_sneha_2.pdf", recordPdfUrl: "rec_sneha_2.pdf", status: "Approved", score: 88, maxScore: 100, remarks: "Completed successfully.", submittedAt: "2026-07-06" },
      { id: "exp-3", name: "Singly & Doubly Linked List Operations", dueDate: "2026-07-10", observationPdfUrl: "obs_sneha_3.pdf", status: "Submitted - Pending", score: 0, maxScore: 100, submittedAt: "2026-07-10" },
      { id: "exp-4", name: "Binary Search Tree Creation & Traversals", dueDate: "2026-07-14", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-5", name: "Graph Search Algorithms (BFS & DFS)", dueDate: "2026-07-18", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-6", name: "Sorting Algorithms (Merge Sort, Quick Sort)", dueDate: "2026-07-22", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-7", name: "Hash Table Collision Resolution Techniques", dueDate: "2026-07-26", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-8", name: "Minimum Spanning Tree (Kruskal & Prim)", dueDate: "2026-07-30", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-9", name: "Shortest Path Routing (Dijkstra's Algorithm)", dueDate: "2026-08-03", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-10", name: "Min/Max Heap and Priority Queue Applications", dueDate: "2026-08-07", status: "Not Submitted", score: 0, maxScore: 100 },
    ],
    assignments: [
      { id: "asg-1", title: "Stack Implementation using Arrays & Linked Lists", description: "Theory worksheet for Stack implementation.", dueDate: "2026-07-02", status: "Graded", score: 40, maxScore: 50, remarks: "Good analysis.", submittedAt: "2026-07-04" },
      { id: "asg-2", title: "Queue Operations & Circular Queue implementation", description: "Analysis on priority queues and buffer systems.", dueDate: "2026-07-06", status: "Graded", score: 42, maxScore: 50, remarks: "Answers are correct.", submittedAt: "2026-07-06" },
      { id: "asg-3", title: "Singly & Doubly Linked List Operations", description: "Write proofs for node deletion complexities.", dueDate: "2026-07-10", status: "Submitted", maxScore: 50, submittedAt: "2026-07-10" },
      { id: "asg-4", title: "Binary Search Tree Creation & Traversals", description: "Worksheet on post-order traversal and BST height.", dueDate: "2026-07-14", status: "Pending", maxScore: 50 },
      { id: "asg-5", title: "Graph Search Algorithms (BFS & DFS)", description: "Worksheet on queue/stack states during graph traversal.", dueDate: "2026-07-18", status: "Pending", maxScore: 50 },
      { id: "asg-6", title: "Sorting Algorithms (Merge Sort, Quick Sort)", description: "Asymptotic comparisons of QuickSort vs MergeSort.", dueDate: "2026-07-22", status: "Pending", maxScore: 50 },
      { id: "asg-7", title: "Hash Table Collision Resolution Techniques", description: "Worksheet on linear probing vs quadratic probing.", dueDate: "2026-07-26", status: "Pending", maxScore: 50 },
      { id: "asg-8", title: "Minimum Spanning Tree (Kruskal & Prim)", description: "State differences between Prim and Kruskal search rules.", dueDate: "2026-07-30", status: "Pending", maxScore: 50 },
      { id: "asg-9", title: "Shortest Path Routing (Dijkstra's Algorithm)", description: "Worksheet on Dijkstra paths for a given routing network.", dueDate: "2026-08-03", status: "Pending", maxScore: 50 },
      { id: "asg-10", title: "Min/Max Heap and Priority Queue Applications", description: "Formulate priority enqueue operations.", dueDate: "2026-08-07", status: "Pending", maxScore: 50 },
    ],
    internalMarks: {
      "Data Structures Lab": { cia1: 38, cia2: 40, cia3: 41, practical: 80, average: 79 },
      "Algorithms Lab": { cia1: 42, cia2: 38, cia3: 39, practical: 82, average: 80 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [
      { id: "cert-s1", title: "Cloud Computing Fundamentals", issuer: "AWS Academy", date: "2026-04-12", type: "workshop" }
    ],
    batch: "AI & DS-A2",
    labName: "Data Structures & Algorithms Lab",
    registerNo: "UR20CS103",
    rollNo: "20CS03",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section A",
    phone: "+91 99887 76655",
    parentName: "Dilip Patel",
    parentPhone: "+91 99887 76650",
    riskFlagged: false,
  },

  // Faculty F02 (Prof. Sunita Rao) Students
  {
    id: "S104",
    name: "Aditya Iyer",
    email: "aditya.iyer@student.edu",
    facultyId: "F02",
    facultyName: "Prof. Sunita Rao",
    attendance: 72, // Below 75% department threshold
    subjectAttendance: {
      "DBMS Lab": 70,
      "Database Administration Lab": 74
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Present" },
      { date: "2026-07-02", status: "Absent" },
      { date: "2026-07-05", status: "Present" },
      { date: "2026-07-06", status: "Absent" },
      { date: "2026-07-08", status: "Present" },
    ],
    experiments: [
      { id: "exp-1", name: "Database Creation & SQL DDL Commands", dueDate: "2026-07-02", observationPdfUrl: "obs_ddl.pdf", status: "Approved", score: 80, maxScore: 100, remarks: "Neat schemas.", submittedAt: "2026-07-02" },
      { id: "exp-2", name: "SQL DML Commands (Insert, Update, Delete)", dueDate: "2026-07-07", observationPdfUrl: "obs_dml.pdf", status: "Approved", score: 85, maxScore: 100, remarks: "Well solved.", submittedAt: "2026-07-07" },
      { id: "exp-3", name: "Complex Queries using Joins & Subqueries", dueDate: "2026-07-14", observationPdfUrl: "obs_complex.pdf", status: "Submitted - Pending", score: 0, maxScore: 100, submittedAt: "2026-07-12" },
      { id: "exp-4", name: "Aggregate Functions, Group By & Having", dueDate: "2026-07-18", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-5", name: "Views, Indexes & Sequence Management", dueDate: "2026-07-22", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-6", name: "PL/SQL Blocks & Conditional Statements", dueDate: "2026-07-26", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-7", name: "PL/SQL Cursors (Implicit & Explicit)", dueDate: "2026-07-30", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-8", name: "Database Triggers & Event Handling", dueDate: "2026-08-03", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-9", name: "Stored Procedures & Functions", dueDate: "2026-08-07", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-10", name: "NoSQL Database Operations (MongoDB)", dueDate: "2026-08-11", status: "Not Submitted", score: 0, maxScore: 100 },
    ],
    assignments: [
      { id: "asg-1", title: "Database Creation & SQL DDL Commands", description: "Design fully normalized ER models.", dueDate: "2026-07-05", status: "Graded", score: 38, maxScore: 50, remarks: "Excellent cardinality layout.", submittedAt: "2026-07-04" },
      { id: "asg-2", title: "SQL DML Commands (Insert, Update, Delete)", description: "Worksheet on query mapping constraints.", dueDate: "2026-07-07", status: "Submitted", maxScore: 50, submittedAt: "2026-07-07" },
      { id: "asg-3", title: "Complex Queries using Joins & Subqueries", description: "Detailed recursive join diagrams.", dueDate: "2026-07-14", status: "Pending", maxScore: 50 },
      { id: "asg-4", title: "Aggregate Functions, Group By & Having", description: "Theory behind indexing performance benefits.", dueDate: "2026-07-18", status: "Pending", maxScore: 50 },
      { id: "asg-5", title: "Views, Indexes & Sequence Management", description: "PL/SQL structure schema designs.", dueDate: "2026-07-22", status: "Pending", maxScore: 50 },
      { id: "asg-6", title: "PL/SQL Blocks & Conditional Statements", description: "Identify cursor exceptions guidelines.", dueDate: "2026-07-26", status: "Pending", maxScore: 50 },
      { id: "asg-7", title: "PL/SQL Cursors (Implicit & Explicit)", description: "Theory of trigger constraints.", dueDate: "2026-07-30", status: "Pending", maxScore: 50 },
      { id: "asg-8", title: "Database Triggers & Event Handling", description: "Formulate stored parameter definitions.", dueDate: "2026-08-03", status: "Pending", maxScore: 50 },
      { id: "asg-9", title: "Stored Procedures & Functions", description: "Workbook on MongoDB collection schemas.", dueDate: "2026-08-07", status: "Pending", maxScore: 50 },
      { id: "asg-10", title: "NoSQL Database Operations (MongoDB)", description: "Theory of ACID properties in distributed DBs.", dueDate: "2026-08-11", status: "Pending", maxScore: 50 },
    ],
    internalMarks: {
      "DBMS Lab": { cia1: 35, cia2: 38, cia3: 36, practical: 78, average: 74 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [],
    batch: "AI & DS-B1",
    labName: "Database Management Systems Lab",
    registerNo: "UR20CS104",
    rollNo: "20CS04",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section B",
    phone: "+91 97766 55443",
    parentName: "Venkatesh Iyer",
    parentPhone: "+91 97766 55440",
    riskFlagged: true,
    riskReason: "DBMS Lab Attendance (70%) has slipped below the mandatory 75% department threshold.",
  },
  {
    id: "S105",
    name: "Pooja Hegde",
    email: "pooja.hegde@student.edu",
    facultyId: "F02",
    facultyName: "Prof. Sunita Rao",
    attendance: 95,
    subjectAttendance: {
      "DBMS Lab": 96,
      "Database Administration Lab": 94
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Present" },
      { date: "2026-07-02", status: "Present" },
      { date: "2026-07-05", status: "Present" },
      { date: "2026-07-06", status: "Present" },
      { date: "2026-07-08", status: "Present" },
    ],
    experiments: [
      { id: "exp-1", name: "Database Creation & SQL DDL Commands", dueDate: "2026-07-02", observationPdfUrl: "obs_pooja_1.pdf", recordPdfUrl: "rec_pooja_1.pdf", status: "Approved", score: 98, maxScore: 100, remarks: "Flawless schemas.", submittedAt: "2026-07-02" },
      { id: "exp-2", name: "SQL DML Commands (Insert, Update, Delete)", dueDate: "2026-07-07", observationPdfUrl: "obs_pooja_2.pdf", recordPdfUrl: "rec_pooja_2.pdf", status: "Approved", score: 95, maxScore: 100, remarks: "Highly optimized queries.", submittedAt: "2026-07-07" },
      { id: "exp-3", name: "Complex Queries using Joins & Subqueries", dueDate: "2026-07-14", observationPdfUrl: "obs_pooja_3.pdf", recordPdfUrl: "rec_pooja_3.pdf", status: "Approved", score: 96, maxScore: 100, remarks: "Excellent triggers implementation.", submittedAt: "2026-07-11" },
      { id: "exp-4", name: "Aggregate Functions, Group By & Having", dueDate: "2026-07-18", observationPdfUrl: "obs_pooja_4.pdf", recordPdfUrl: "rec_pooja_4.pdf", status: "Approved", score: 94, maxScore: 100, remarks: "Very clean query structure.", submittedAt: "2026-07-15" },
      { id: "exp-5", name: "Views, Indexes & Sequence Management", dueDate: "2026-07-22", observationPdfUrl: "obs_pooja_5.pdf", status: "Submitted - Pending", score: 0, maxScore: 100, submittedAt: "2026-07-19" },
      { id: "exp-6", name: "PL/SQL Blocks & Conditional Statements", dueDate: "2026-07-26", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-7", name: "PL/SQL Cursors (Implicit & Explicit)", dueDate: "2026-07-30", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-8", name: "Database Triggers & Event Handling", dueDate: "2026-08-03", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-9", name: "Stored Procedures & Functions", dueDate: "2026-08-07", status: "Not Submitted", score: 0, maxScore: 100 },
      { id: "exp-10", name: "NoSQL Database Operations (MongoDB)", dueDate: "2026-08-11", status: "Not Submitted", score: 0, maxScore: 100 },
    ],
    assignments: [
      { id: "asg-1", title: "Database Creation & SQL DDL Commands", description: "Design fully normalized ER models.", dueDate: "2026-07-05", status: "Graded", score: 48, maxScore: 50, remarks: "Top quality layout.", submittedAt: "2026-07-02" },
      { id: "asg-2", title: "SQL DML Commands (Insert, Update, Delete)", description: "Worksheet on query mapping constraints.", dueDate: "2026-07-07", status: "Graded", score: 47, maxScore: 50, remarks: "Perfect solution.", submittedAt: "2026-07-07" },
      { id: "asg-3", title: "Complex Queries using Joins & Subqueries", description: "Detailed recursive join diagrams.", dueDate: "2026-07-14", status: "Graded", score: 46, maxScore: 50, remarks: "Highly accurate schema mapping.", submittedAt: "2026-07-11" },
      { id: "asg-4", title: "Aggregate Functions, Group By & Having", description: "Theory behind indexing performance benefits.", dueDate: "2026-07-18", status: "Submitted", maxScore: 50, submittedAt: "2026-07-15" },
      { id: "asg-5", title: "Views, Indexes & Sequence Management", description: "PL/SQL structure schema designs.", dueDate: "2026-07-22", status: "Pending", maxScore: 50 },
      { id: "asg-6", title: "PL/SQL Blocks & Conditional Statements", description: "Identify cursor exceptions guidelines.", dueDate: "2026-07-26", status: "Pending", maxScore: 50 },
      { id: "asg-7", title: "PL/SQL Cursors (Implicit & Explicit)", description: "Theory of trigger constraints.", dueDate: "2026-07-30", status: "Pending", maxScore: 50 },
      { id: "asg-8", title: "Database Triggers & Event Handling", description: "Formulate stored parameter definitions.", dueDate: "2026-08-03", status: "Pending", maxScore: 50 },
      { id: "asg-9", title: "Stored Procedures & Functions", description: "Workbook on MongoDB collection schemas.", dueDate: "2026-08-07", status: "Pending", maxScore: 50 },
      { id: "asg-10", title: "NoSQL Database Operations (MongoDB)", description: "Theory of ACID properties in distributed DBs.", dueDate: "2026-08-11", status: "Pending", maxScore: 50 },
    ],
    internalMarks: {
      "DBMS Lab": { cia1: 48, cia2: 47, cia3: 49, practical: 96, average: 95 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [
      { id: "cert-p1", title: "Database Systems Specialization", issuer: "Coursera / Stanford", date: "2026-03-25", type: "symposium" }
    ],
    batch: "AI & DS-B1",
    labName: "Database Management Systems Lab",
    registerNo: "UR20CS105",
    rollNo: "20CS05",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section B",
    phone: "+91 93344 55667",
    parentName: "Krishna Hegde",
    parentPhone: "+91 93344 55660",
    riskFlagged: false,
  },
  {
    id: "S106",
    name: "Vikram Seth",
    email: "vikram.seth@student.edu",
    facultyId: "F03",
    facultyName: "Dr. Amit Patel",
    attendance: 88,
    subjectAttendance: {
      "Compiler Lab": 90,
      "Computer Networks Lab": 86
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Present" },
      { date: "2026-07-02", status: "Present" },
      { date: "2026-07-05", status: "Present" },
      { date: "2026-07-06", status: "Present" },
      { date: "2026-07-08", status: "Absent" },
    ],
    experiments: [
      { id: "exp-cd1", name: "Design of Lexical Analyzer using Lex/Flex", dueDate: "2026-07-02", observationPdfUrl: "obs_vikram_1.pdf", recordPdfUrl: "rec_vikram_1.pdf", status: "Approved", score: 92, maxScore: 100, remarks: "Excellent token parsing.", submittedAt: "2026-07-01" },
      { id: "exp-cd2", name: "Implementation of Calculator using Yacc/Bison", dueDate: "2026-07-07", observationPdfUrl: "obs_vikram_2.pdf", recordPdfUrl: "rec_vikram_2.pdf", status: "Approved", score: 88, maxScore: 100, remarks: "Correct grammar specification.", submittedAt: "2026-07-06" },
      { id: "exp-cd3", name: "Construction of NFA from Regular Expression", dueDate: "2026-07-14", status: "Submitted - Pending", score: 0, maxScore: 100, submittedAt: "2026-07-13" },
    ],
    assignments: [
      { id: "asg-cd1", title: "Lexical Analysis Exercises", description: "Practice regex writing for tokens.", dueDate: "2026-07-05", status: "Graded", score: 44, maxScore: 50, remarks: "Good grammar logic.", submittedAt: "2026-07-04" },
    ],
    internalMarks: {
      "Compiler Lab": { cia1: 42, cia2: 44, cia3: 40, practical: 88, average: 85 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [],
    batch: "AI & DS-C1",
    labName: "Compiler Design & Network Lab",
    registerNo: "UR20CS106",
    rollNo: "20CS06",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section C",
    phone: "+91 94455 66778",
    parentName: "Rajendra Seth",
    parentPhone: "+91 94455 66770",
    riskFlagged: false,
  },
  {
    id: "S107",
    name: "Meera Krishnan",
    email: "meera.krishnan@student.edu",
    facultyId: "F03",
    facultyName: "Dr. Amit Patel",
    attendance: 74,
    subjectAttendance: {
      "Compiler Lab": 72,
      "Computer Networks Lab": 76
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Absent" },
      { date: "2026-07-02", status: "Present" },
      { date: "2026-07-05", status: "Absent" },
      { date: "2026-07-06", status: "Present" },
      { date: "2026-07-08", status: "Present" },
    ],
    experiments: [
      { id: "exp-cd1", name: "Design of Lexical Analyzer using Lex/Flex", dueDate: "2026-07-02", observationPdfUrl: "obs_meera_1.pdf", recordPdfUrl: "rec_meera_1.pdf", status: "Approved", score: 75, maxScore: 100, remarks: "Late submission.", submittedAt: "2026-07-04" },
      { id: "exp-cd2", name: "Implementation of Calculator using Yacc/Bison", dueDate: "2026-07-07", status: "Not Submitted", score: 0, maxScore: 100 },
    ],
    assignments: [
      { id: "asg-cd1", title: "Lexical Analysis Exercises", description: "Practice regex writing for tokens.", dueDate: "2026-07-05", status: "Pending", maxScore: 50 },
    ],
    internalMarks: {
      "Compiler Lab": { cia1: 30, cia2: 32, cia3: 28, practical: 72, average: 65 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [],
    batch: "AI & DS-C1",
    labName: "Compiler Design & Network Lab",
    registerNo: "UR20CS107",
    rollNo: "20CS07",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section C",
    phone: "+91 95566 77889",
    parentName: "Gopal Krishnan",
    parentPhone: "+91 95566 77880",
    riskFlagged: true,
    riskReason: "Compiler Lab Attendance (72%) has slipped below the threshold and multiple incomplete lab experiments.",
  },
  {
    id: "S108",
    name: "Rajesh Nair",
    email: "rajesh.nair@student.edu",
    facultyId: "F01",
    facultyName: "Dr. Ramesh Kumar",
    attendance: 89,
    subjectAttendance: {
      "Data Structures Lab": 90,
      "Algorithms Lab": 88
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Present" },
      { date: "2026-07-02", status: "Present" },
      { date: "2026-07-05", status: "Present" },
      { date: "2026-07-06", status: "Present" },
      { date: "2026-07-08", status: "Present" },
    ],
    experiments: [
      { id: "exp-1", name: "Stack Implementation using Arrays & Linked Lists", dueDate: "2026-07-02", observationPdfUrl: "obs_rajesh_1.pdf", recordPdfUrl: "rec_rajesh_1.pdf", status: "Approved", score: 91, maxScore: 100, remarks: "Clean pointers usage.", submittedAt: "2026-07-02" },
    ],
    assignments: [
      { id: "asg-1", title: "Stack Implementation using Arrays & Linked Lists", description: "Theory worksheet for Stack implementation.", dueDate: "2026-07-02", status: "Graded", score: 45, maxScore: 50, remarks: "Correct designs.", submittedAt: "2026-07-02" },
    ],
    internalMarks: {
      "Data Structures Lab": { cia1: 44, cia2: 41, cia3: 45, practical: 90, average: 88 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [],
    batch: "AI & DS-A2",
    labName: "Data Structures & Algorithms Lab",
    registerNo: "UR20CS108",
    rollNo: "20CS08",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section A",
    phone: "+91 96677 88990",
    parentName: "Sreedharan Nair",
    parentPhone: "+91 96677 88991",
    riskFlagged: false,
  },
  {
    id: "S109",
    name: "Shruti Sen",
    email: "shruti.sen@student.edu",
    facultyId: "F02",
    facultyName: "Prof. Sunita Rao",
    attendance: 94,
    subjectAttendance: {
      "DBMS Lab": 95,
      "Database Administration Lab": 93
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Present" },
      { date: "2026-07-02", status: "Present" },
      { date: "2026-07-05", status: "Present" },
      { date: "2026-07-06", status: "Present" },
      { date: "2026-07-08", status: "Present" },
    ],
    experiments: [
      { id: "exp-1", name: "Database Creation & SQL DDL Commands", dueDate: "2026-07-02", observationPdfUrl: "obs_shruti_1.pdf", recordPdfUrl: "rec_shruti_1.pdf", status: "Approved", score: 94, maxScore: 100, remarks: "Excellent schemas and tables.", submittedAt: "2026-07-01" },
    ],
    assignments: [
      { id: "asg-1", title: "Database Creation & SQL DDL Commands", description: "Design fully normalized ER models.", dueDate: "2026-07-05", status: "Graded", score: 46, maxScore: 50, remarks: "Very neat work.", submittedAt: "2026-07-03" },
    ],
    internalMarks: {
      "DBMS Lab": { cia1: 45, cia2: 44, cia3: 46, practical: 94, average: 92 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [],
    batch: "AI & DS-B2",
    labName: "Database Management Systems Lab",
    registerNo: "UR20CS109",
    rollNo: "20CS09",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section B",
    phone: "+91 97788 99001",
    parentName: "Sanjay Sen",
    parentPhone: "+91 97788 99000",
    riskFlagged: false,
  },
  {
    id: "S110",
    name: "Karan Johar",
    email: "karan.johar@student.edu",
    facultyId: "F01",
    facultyName: "Dr. Ramesh Kumar",
    attendance: 82,
    subjectAttendance: {
      "Data Structures Lab": 80,
      "Algorithms Lab": 84
    },
    attendanceHistory: [
      { date: "2026-07-01", status: "Present" },
      { date: "2026-07-02", status: "Present" },
      { date: "2026-07-05", status: "Absent" },
      { date: "2026-07-06", status: "Present" },
      { date: "2026-07-08", status: "Present" },
    ],
    experiments: [
      { id: "exp-1", name: "Stack Implementation using Arrays & Linked Lists", dueDate: "2026-07-02", observationPdfUrl: "obs_karan_1.pdf", recordPdfUrl: "rec_karan_1.pdf", status: "Approved", score: 85, maxScore: 100, remarks: "Good implementation.", submittedAt: "2026-07-02" },
    ],
    assignments: [
      { id: "asg-1", title: "Stack Implementation using Arrays & Linked Lists", description: "Theory worksheet for Stack implementation.", dueDate: "2026-07-02", status: "Graded", score: 41, maxScore: 50, remarks: "Completed well.", submittedAt: "2026-07-02" },
    ],
    internalMarks: {
      "Data Structures Lab": { cia1: 40, cia2: 38, cia3: 42, practical: 82, average: 80 }
    },
    notifications: getMockNotifications(),
    calendarEvents: getMockCalendarEvents(),
    certificates: [],
    batch: "AI & DS-A1",
    labName: "Data Structures & Algorithms Lab",
    registerNo: "UR20CS110",
    rollNo: "20CS10",
    department: "Artificial Intelligence & Data Science",
    semester: "4th Semester",
    section: "Section A",
    phone: "+91 98899 00112",
    parentName: "Yash Johar",
    parentPhone: "+91 98899 00110",
    riskFlagged: false,
  }
];

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
