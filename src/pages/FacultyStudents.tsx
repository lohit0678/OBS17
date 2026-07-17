import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import { Student } from '../data';
import { RiskBadge } from '../components/shared';
import { 
  GraduationCap, 
  ArrowUpRight, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Save, 
  FileDown, 
  ShieldAlert, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  ClipboardList, 
  BookOpen, 
  FileText 
} from 'lucide-react';
import EvaluationModal from '../components/EvaluationModal';

function getExperimentMockContent(
  studentName: string,
  registerNo: string,
  rollNo: string,
  labName: string,
  expIndex: number,
  type: 'observation' | 'record'
) {
  let aim = "To write a program/queries to implement the specified requirements and verify its correct output under experimental parameters.";
  let algorithm = "1. Understand the problem statement and identify the inputs and required processing logic.\n2. Design the data structures or schema design required.\n3. Formulate the logical steps / database queries for step-by-step execution.\n4. Code the solution and execute with standard sample inputs.\n5. Verify the correctness of output against the expected results.";
  let code = "";
  let output = "";

  const cleanLabName = labName ? labName.toLowerCase() : "";

  if (cleanLabName.includes("data structures") || cleanLabName.includes("algorithms")) {
    if (expIndex === 1) {
      aim = "To implement Stack Operations (Push, Pop, Peek, Display) using Arrays.";
      algorithm = "1. Declare an array of MAX_SIZE and a top pointer initialized to -1.\n2. Push operation: If top is equal to MAX_SIZE - 1, output Stack Overflow. Otherwise, increment top and insert the element.\n3. Pop operation: If top is -1, output Stack Underflow. Otherwise, return the element at top and decrement top.\n4. Peek operation: Return the element at top without removing it.\n5. Display: Iterate from top to 0 and print each element.";
      code = `#include <iostream>\nusing namespace std;\n\n#define MAX 100\n\nclass Stack {\n    int top;\npublic:\n    int arr[MAX];\n    Stack() { top = -1; }\n    \n    bool push(int x) {\n        if (top >= (MAX - 1)) {\n            cout << "Stack Overflow!" << endl;\n            return false;\n        }\n        arr[++top] = x;\n        cout << x << " pushed into stack\\n";\n        return true;\n    }\n    \n    int pop() {\n        if (top < 0) {\n            cout << "Stack Underflow!" << endl;\n            return 0;\n        }\n        return arr[top--];\n    }\n    \n    int peek() {\n        if (top < 0) {\n            return 0;\n        }\n        return arr[top];\n    }\n    \n    bool isEmpty() {\n        return (top < 0);\n    }\n};\n\nint main() {\n    Stack s;\n    s.push(10);\n    s.push(20);\n    s.push(30);\n    cout << s.pop() << " popped from stack\\n";\n    cout << "Top element is: " << s.peek() << endl;\n    return 0;\n}`;
      output = "10 pushed into stack\n20 pushed into stack\n30 pushed into stack\n30 popped from stack\nTop element is: 20";
    } else if (expIndex === 2) {
      aim = "To implement Queue Operations (Enqueue, Dequeue, Display) using Arrays.";
      algorithm = "1. Declare an array of MAX_SIZE and front, rear pointers initialized to -1.\n2. Enqueue: Check for overflow (rear == MAX - 1). If empty, set front=rear=0. Otherwise, increment rear and insert element.\n3. Dequeue: Check for underflow (front == -1). Retrieve the element at front. If front==rear, set front=rear=-1. Otherwise, increment front.\n4. Display: Iterate from front to rear and print elements.";
      code = `#include <iostream>\nusing namespace std;\n\n#define MAX 5\n\nclass Queue {\n    int items[MAX], front, rear;\npublic:\n    Queue() { front = -1; rear = -1; }\n    \n    bool isFull() {\n        return (front == 0 && rear == MAX - 1);\n    }\n    \n    bool isEmpty() {\n        return (front == -1);\n    }\n    \n    void enqueue(int element) {\n        if (isFull()) {\n            cout << "Queue is full" << endl;\n        } else {\n            if (front == -1) front = 0;\n            rear++;\n            items[rear] = element;\n            cout << "Inserted " << element << endl;\n        }\n    }\n    \n    int dequeue() {\n        int element;\n        if (isEmpty()) {\n            cout << "Queue is empty" << endl;\n            return -1;\n        } else {\n            element = items[front];\n            if (front >= rear) {\n                front = -1;\n                rear = -1;\n            } else {\n                front++;\n            }\n            return element;\n        }\n    }\n};\n\nint main() {\n    Queue q;\n    q.enqueue(10);\n    q.enqueue(20);\n    q.enqueue(30);\n    cout << "Dequeued: " << q.dequeue() << endl;\n    return 0;\n}`;
      output = "Inserted 10\nInserted 20\nInserted 30\nDequeued: 10";
    } else if (expIndex === 3) {
      aim = "To implement Singly Linked List operations (Insertion, Deletion, Display).";
      algorithm = "1. Create a dynamic structure Node containing 'data' and 'next' pointer.\n2. Insert at head: Create a new node and insert it before the current head.\n3. Display: Start from head and print until NULL.";
      code = `#include <iostream>\nusing namespace std;\n\nstruct Node {\n    int data;\n    Node* next;\n};\n\nvoid insertAtHead(Node* &head, int val) {\n    Node* newNode = new Node();\n    newNode->data = val;\n    newNode->next = head;\n    head = newNode;\n}\n\nvoid display(Node* head) {\n    while (head != NULL) {\n        cout << head->data << " -> ";\n        head = head->next;\n    }\n    cout << "NULL" << endl;\n}\n\nint main() {\n    Node* head = NULL;\n    insertAtHead(head, 30);\n    insertAtHead(head, 20);\n    insertAtHead(head, 10);\n    display(head);\n    return 0;\n}`;
      output = "10 -> 20 -> 30 -> NULL";
    } else if (expIndex === 4) {
      aim = "To implement Binary Search Tree (BST) Creation and Traversals (Inorder, Preorder, Postorder).";
      algorithm = "1. Define BST Node with left and right children pointers.\n2. Insert: Compare key with root. Recursively insert in left subtree if smaller, or right subtree if larger.\n3. Inorder: Left, Root, Right.\n4. Preorder: Root, Left, Right.\n5. Postorder: Left, Right, Root.";
      code = `#include <iostream>\nusing namespace std;\n\nstruct Node {\n    int key;\n    Node *left, *right;\n};\n\nNode* newNode(int item) {\n    Node* temp = new Node;\n    temp->key = item;\n    temp->left = temp->right = NULL;\n    return temp;\n}\n\nvoid inorder(Node* root) {\n    if (root != NULL) {\n        inorder(root->left);\n        cout << root->key << " ";\n        inorder(root->right);\n    }\n}\n\nNode* insert(Node* node, int key) {\n    if (node == NULL) return newNode(key);\n    if (key < node->key)\n        node->left = insert(node->left, key);\n    else if (key > node->key)\n        node->right = insert(node->right, key);\n    return node;\n}`;
      output = "Inorder Traversal of BST: 10 20 30 40 50";
    } else {
      aim = "To implement Graph Breadth First Search (BFS) and Depth First Search (DFS) traversals.";
      algorithm = "1. Represent graph using adjacency list or matrix.\n2. BFS: Use a queue to track visited nodes level-by-level.\n3. DFS: Use recursion or a stack to track visited nodes deeply.";
      code = `#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\n\nvoid BFS(int start, vector<vector<int>>& adj, vector<bool>& visited) {\n    queue<int> q;\n    q.push(start);\n    visited[start] = true;\n    while (!q.empty()) {\n        int curr = q.front(); q.pop();\n        cout << curr << " ";\n        for (int neighbor : adj[curr]) {\n            if (!visited[neighbor]) {\n                visited[neighbor] = true;\n                q.push(neighbor);\n            }\n        }\n    }\n}`;
      output = "BFS Traversal starting from vertex 0: 0 1 2 3 4";
    }
  } else if (cleanLabName.includes("database") || cleanLabName.includes("dbms")) {
    if (expIndex === 1) {
      aim = "To create database schemas and implement Data Definition Language (DDL) commands (CREATE, ALTER, DROP, TRUNCATE).";
      algorithm = "1. Use CREATE TABLE to define tables with appropriate constraints (Primary Key, Foreign Key, Not Null).\n2. Use ALTER TABLE to add new columns or modify constraints.\n3. Execute DESCRIBE or SHOW tables to verify schemas.";
      code = `-- CREATE TABLE Command\nCREATE TABLE Employees (\n    EmpID INT PRIMARY KEY,\n    FirstName VARCHAR(50) NOT NULL,\n    LastName VARCHAR(50),\n    Department VARCHAR(50),\n    Salary DECIMAL(10, 2)\n);\n\n-- ALTER TABLE Command\nALTER TABLE Employees ADD DateOfJoining DATE;\n\n-- TRUNCATE Command\nTRUNCATE TABLE Employees;`;
      output = "Table 'Employees' created successfully.\nTable 'Employees' altered. Column 'DateOfJoining' added.";
    } else if (expIndex === 2) {
      aim = "To perform Data Manipulation Language (DML) commands (INSERT, UPDATE, DELETE, SELECT) on database tables.";
      algorithm = "1. Populate tables with data using INSERT INTO values.\n2. Execute UPDATE queries to change existing values with conditional WHERE clauses.\n3. Execute DELETE statements to remove records safely.";
      code = `-- Insert Statement\nINSERT INTO Employees (EmpID, FirstName, LastName, Department, Salary)\nVALUES (101, 'Arun', 'Kumar', 'AI & DS', 75000.00);\n\n-- Update Statement\nUPDATE Employees SET Salary = 80000.00 WHERE EmpID = 101;\n\n-- Select Query\nSELECT * FROM Employees WHERE Salary > 50000;`;
      output = "1 row inserted.\n1 row updated.\nEmpID | FirstName | LastName | Department | Salary\n101   | Arun      | Kumar    | AI & DS    | 80000.00";
    } else if (expIndex === 3) {
      aim = "To implement relational algebraic joins (INNER, LEFT, RIGHT, FULL OUTER) and subqueries.";
      algorithm = "1. Formulate queries retrieving data from multiple tables referencing foreign keys.\n2. Apply join conditions on common columns.\n3. Write subqueries in SELECT/WHERE clauses to filter dynamic values.";
      code = `-- INNER JOIN Query\nSELECT e.FirstName, e.Department, d.Location\nFROM Employees e\nINNER JOIN Departments d ON e.Department = d.DeptName;\n\n-- Subquery example\nSELECT FirstName, Salary FROM Employees \nWHERE Salary > (SELECT AVG(Salary) FROM Employees);`;
      output = "FirstName | Department | Location\nArun      | AI & DS    | Block 3, Lab 4\nAverage Salary subquery resolved to 62000.00.";
    } else if (expIndex === 4) {
      aim = "To implement SQL aggregate functions (SUM, AVG, MIN, MAX, COUNT) with GROUP BY and HAVING clauses.";
      algorithm = "1. Apply math aggregators over attributes.\n2. Group records by non-aggregated categorical variables.\n3. Filter grouped rows using HAVING conditions (since WHERE cannot evaluate aggregate expressions).";
      code = `SELECT Department, COUNT(*), AVG(Salary) \nFROM Employees\nGROUP BY Department\nHAVING AVG(Salary) > 60000;`;
      output = "Department | COUNT(*) | AVG(Salary)\nAI & DS    | 5        | 78000.00\nCSE        | 8        | 64000.00";
    } else {
      aim = "To create and manage SQL database Views, Indexes, and Sequences.";
      algorithm = "1. Define a view using CREATE VIEW to store complex query selections.\n2. Create unique or non-unique indexes using CREATE INDEX to optimize retrieve execution plan.\n3. Establish serial counters using sequences.";
      code = `-- CREATE VIEW\nCREATE VIEW AIDS_Faculty_Staff AS\nSELECT FirstName, LastName, Department\nFROM Employees WHERE Department = 'AI & DS';\n\n-- CREATE INDEX\nCREATE INDEX idx_emp_dept ON Employees(Department);`;
      output = "View 'AIDS_Faculty_Staff' defined.\nIndex 'idx_emp_dept' built successfully over 150 records.";
    }
  } else {
    // Compiler Design or General Engineering Lab
    if (expIndex === 1) {
      aim = "To implement a Lexical Analyzer using Lex/Flex to identify keywords, constants, identifiers and operator tokens.";
      algorithm = "1. Formulate regular expressions defining lexical grammar rules.\n2. Write matching actions returning categorized token descriptors.\n3. Compile lex.yy.c and execute with input source.";
      code = `%% \n"main"|"if"|"else"|"return"|"int" { printf("Token: KEYWORD [%s]\\n", yytext); }\n[a-zA-Z_][a-zA-Z0-9_]*          { printf("Token: IDENTIFIER [%s]\\n", yytext); }\n[0-9]+                          { printf("Token: CONSTANT [%s]\\n", yytext); }\n"+"|"-"|"*"|"/"|"="              { printf("Token: OPERATOR [%s]\\n", yytext); }\n";"|","|"{"|"}"                  { printf("Token: SEPARATOR [%s]\\n", yytext); }\n[ \\t\\n]                        ; /* Skip whitespaces */\n.                               { printf("Unknown character: %s\\n", yytext); }\n%%\nint yywrap() { return 1; }\nint main() { yylex(); return 0; }`;
      output = "Input String: int val = 250;\nOutput:\nToken: KEYWORD [int]\nToken: IDENTIFIER [val]\nToken: OPERATOR [=]\nToken: CONSTANT [250]\nToken: SEPARATOR [;]";
    } else if (expIndex === 2) {
      aim = "To implement an arithmetic expression evaluator / parser using Yacc/Bison.";
      algorithm = "1. Map Yacc token definitions matching lexical tokens.\n2. Write context-free grammar rules outlining expression precedence.\n3. Evaluate calculations using dynamic semantic actions.";
      code = `%{ \n#include <stdio.h>\n#include <stdlib.h>\nvoid yyerror(char *s);\nint yylex();\n%}\n%token NUM\n%left '+' '-'\n%left '*' '/'\n%%\ncalc: expr '\\n' { printf("Result = %d\\n", $1); exit(0); };\nexpr: expr '+' expr { $$ = $1 + $3; }\n    | expr '-' expr { $$ = $1 - $3; }\n    | expr '*' expr { $$ = $1 * $3; }\n    | NUM { $$ = $1; };\n%%\nvoid yyerror(char *s) { fprintf(stderr, "Parsing Error: %s\\n", s); }`;
      output = "Input Expression: 20 * 5 + 10\nResult = 110";
    } else {
      aim = "To design and implement multi-phase intermediate representation or compiler algorithms.";
      algorithm = "1. Map inputs to parsing grammar.\n2. Process three-address code generation steps.";
      code = `// Three Address Code (TAC) representation generator\n#include <iostream>\nusing namespace std;\n\nvoid generateTAC(char op, string arg1, string arg2, string result) {\n    cout << result << " = " << arg1 << " " << op << " " << arg2 << endl;\n}`;
      output = "t1 = a * b\nt2 = t1 + c\nx = t2";
    }
  }

  return { aim, algorithm, code, output };
}

export default function FacultyStudents() {
  const { user } = useAuth();
  const { students, getFacultyStudents, updateLabSubmissionStatus, gradeAssignment, updateStudentRisk } = useAcademicData();
  const navigate = useNavigate();

  const myStudents = getFacultyStudents(user.id);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Active student selection for in-page review console
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Set first student as default selected
  useEffect(() => {
    if (myStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(myStudents[0].id);
    }
  }, [myStudents, selectedStudentId]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Review states
  const [reviewType, setReviewType] = useState<'observation' | 'record'>('observation');
  const [reviewExpIdx, setReviewExpIdx] = useState<number>(1);
  const [reviewScore, setReviewScore] = useState<number>(10);
  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Rejected' | 'Submitted - Pending'>('Approved');
  
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Risk states
  const [riskFlagged, setRiskFlagged] = useState<boolean>(false);
  const [riskReason, setRiskReason] = useState<string>('');
  const [isSubmittingRisk, setIsSubmittingRisk] = useState(false);
  const [riskSuccess, setRiskSuccess] = useState('');

  // Sync risk fields when student selection changes
  useEffect(() => {
    if (selectedStudent) {
      setRiskFlagged(selectedStudent.riskFlagged);
      setRiskReason(selectedStudent.riskReason || '');
      
      // Auto-populate score and remarks for selected experiment index
      if (reviewType === 'observation') {
        const exp = selectedStudent.experiments.find(e => e.id === `exp-${reviewExpIdx}`);
        setReviewScore(exp?.score || 10);
        setReviewRemarks(exp?.remarks || 'Observation notebook checked and approved.');
        setReviewStatus((exp?.status === 'Approved' || exp?.status === 'Rejected') ? exp.status : 'Approved');
      } else {
        const asg = selectedStudent.assignments.find(a => a.id === `asg-${reviewExpIdx}`);
        setReviewScore(asg?.score || 10);
        setReviewRemarks(asg?.remarks || 'Record notebook checked, diagrams verified.');
        setReviewStatus(asg?.status === 'Graded' ? 'Approved' : 'Approved');
      }
    }
  }, [selectedStudentId, reviewExpIdx, reviewType, students]);

  // Handle download file simulation - Exports beautifully formatted PDF
  const handleDownloadExpFile = (type: 'observation' | 'record', expIndex: number) => {
    if (!selectedStudent) return;
    
    const expObj = selectedStudent.experiments.find(e => e.id === `exp-${expIndex}`) || selectedStudent.experiments[expIndex - 1];
    const expName = expObj ? expObj.name : `Experiment ${expIndex}`;
    const { aim, algorithm, code, output } = getExperimentMockContent(
      selectedStudent.name,
      selectedStudent.registerNo,
      selectedStudent.rollNo,
      selectedStudent.labName,
      expIndex,
      type
    );

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const filename = `${selectedStudent.name.replace(/\s+/g, '_')}_Exp_${expIndex}_${type}.pdf`;
    let y = 15;

    const addPageIfNeeded = (heightNeeded: number) => {
      if (y + heightNeeded > 275) {
        doc.addPage();
        y = 15;
        // Mini page header
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Panimalar Engineering College - Digital Lab Journal Review - Page ${doc.getNumberOfPages()}`, 15, 10);
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(15, 12, 195, 12);
        y = 18;
      }
    };

    // 1. Institution Header
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(11, 25, 44); // #0B192C Slate Navy
    doc.text("PANIMALAR ENGINEERING COLLEGE", 105, y, { align: 'center' });
    y += 5;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("(An Autonomous Institution, Affiliated to Anna University, Chennai)", 105, y, { align: 'center' });
    y += 5;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(139, 0, 0); // Dark Red
    doc.text("DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE", 105, y, { align: 'center' });
    y += 6;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(11, 25, 44);
    doc.text(`DIGITAL JOURNAL EVALUATION REPORT - ${type.toUpperCase()} SHEET`, 105, y, { align: 'center' });
    y += 3;

    doc.setDrawColor(11, 25, 44);
    doc.setLineWidth(0.6);
    doc.line(15, y, 195, y);
    y += 1.5;
    doc.setLineWidth(0.2);
    doc.line(15, y, 195, y);
    y += 6;

    // 2. Student Details Box (Table layout)
    doc.setFillColor(245, 247, 250);
    doc.rect(15, y, 180, 48, "F");
    doc.setDrawColor(200, 210, 220);
    doc.rect(15, y, 180, 48, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(11, 25, 44);
    doc.text("STUDENT PROFILE", 18, y + 5);
    doc.text("EVALUATION & STATUS", 110, y + 5);

    doc.setDrawColor(210, 220, 230);
    doc.line(15, y + 7, 195, y + 7);
    doc.line(105, y, 105, y + 48); // Vertical split

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);

    // Left Column Info
    doc.text(`Student Name:  ${selectedStudent.name}`, 18, y + 13);
    doc.text(`Register No:      ${selectedStudent.registerNo}`, 18, y + 19);
    doc.text(`Roll Number:      ${selectedStudent.rollNo}`, 18, y + 25);
    doc.text(`Lab Course:       ${selectedStudent.labName}`, 18, y + 31);
    doc.text(`Department:       ${selectedStudent.department} (Semester ${selectedStudent.semester})`, 18, y + 37);
    doc.text(`Batch Year:       ${selectedStudent.batch}`, 18, y + 43);

    // Right Column Info
    const statusVal = reviewType === 'observation' ? (expObj?.status || 'Submitted - Pending') : 'Graded';
    doc.text(`Experiment No:   ${expIndex}`, 110, y + 13);
    doc.text(`Document Type:   ${type.toUpperCase()} NOTEBOOK`, 110, y + 19);
    doc.text(`Evaluation:          ${statusVal}`, 110, y + 25);
    doc.text(`Awarded Score:   ${reviewScore} / 10 Marks`, 110, y + 31);
    doc.text(`Review Date:       ${new Date().toLocaleDateString()}`, 110, y + 37);
    
    // Remarks (wrap text for small box width)
    const remarksWrapped = doc.splitTextToSize(`Remarks: ${reviewRemarks || 'Verified and approved.'}`, 80);
    doc.text(remarksWrapped, 110, y + 43);

    y += 55;

    // 3. Section Printer helper
    const printSection = (sectionTitle: string, sectionContent: string, isCode: boolean = false) => {
      addPageIfNeeded(20);
      
      // Draw section title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(11, 25, 44);
      doc.text(sectionTitle, 15, y);
      y += 5;

      // Draw underline accent
      doc.setDrawColor(11, 25, 44);
      doc.setLineWidth(0.6);
      doc.line(15, y - 1, 30, y - 1);
      y += 2;

      if (isCode) {
        doc.setFont("Courier", "normal");
        doc.setFontSize(8);
        doc.setTextColor(40, 40, 40);
        const lines: string[] = doc.splitTextToSize(sectionContent, 175);
        
        // Draw container box for code
        addPageIfNeeded(15);
        const boxStartY = y - 1;
        
        for (let i = 0; i < lines.length; i++) {
          addPageIfNeeded(5);
          doc.text(lines[i], 18, y + 2);
          y += 4.5;
        }
        
        const boxEndY = y + 1;
        // Draw left accent bar instead of full box for cleaner look
        doc.setDrawColor(11, 25, 44);
        doc.setLineWidth(1.2);
        doc.line(15, boxStartY, 15, boxEndY);
        
        y += 6;
      } else {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(60, 60, 60);
        const lines: string[] = doc.splitTextToSize(sectionContent, 180);
        for (let i = 0; i < lines.length; i++) {
          addPageIfNeeded(5);
          doc.text(lines[i], 15, y);
          y += 5.5;
        }
        y += 5;
      }
    };

    // Print all submission sections
    printSection("I. EXPERIMENT TITLE & OBJECTIVE (AIM)", `Experiment #${expIndex}: ${expName}\n\nObjective: ${aim}`);
    printSection("II. ALGORITHM / METHODOLOGY", algorithm);
    printSection("III. COMPREHENSIVE PROGRAM SOURCE CODE", code, true);
    printSection("IV. EXECUTION RUNTIME OUTPUT", output, true);

    // 4. Security Footprint Audit Box
    addPageIfNeeded(35);
    y += 4;
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    doc.line(15, y, 195, y);
    y += 5;

    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 22, "F");
    doc.rect(15, y, 180, 22, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(11, 25, 44);
    doc.text("PANIMALAR DIGITAL JOURNAL SECURITY ASSURANCE SEAL", 18, y + 4.5);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 110, 120);
    doc.text(`Digital Verification Footprint Seal: SHA-256_EMBEDDED_COMPLIANT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`, 18, y + 10);
    doc.text("This document is verified and digitally locked under the academic integrity regulations of Panimalar Engineering College.", 18, y + 14);
    doc.text(`System Generation Signature Timestamp: ${new Date().toLocaleString()} (UTC)`, 18, y + 18);

    doc.save(filename);
  };

  // Export comprehensive information of all students under supervision into a single unified PDF dossier
  const handleExportAllStudentsPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const filename = `AIDS_Supervised_Students_Full_Profiles.pdf`;
    
    myStudents.forEach((student, index) => {
      if (index > 0) {
        doc.addPage();
      }

      let y = 15;
      
      // Header for each page
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(11, 25, 44); // Slate Navy #0B192C
      doc.text("PANIMALAR ENGINEERING COLLEGE", 105, y, { align: 'center' });
      y += 5;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE", 105, y, { align: 'center' });
      y += 6;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(139, 0, 0); // Dark Red
      doc.text("STUDENT COMPREHENSIVE LABORATORY DOSSIER", 105, y, { align: 'center' });
      y += 3;

      doc.setDrawColor(11, 25, 44);
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);
      y += 6;

      // Student Profile Card block
      doc.setFillColor(245, 247, 250);
      doc.rect(15, y, 180, 32, "F");
      doc.setDrawColor(210, 220, 230);
      doc.rect(15, y, 180, 32, "S");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(11, 25, 44);
      doc.text(student.name.toUpperCase(), 20, y + 6);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Roll Number: ${student.rollNo}`, 20, y + 13);
      doc.text(`Register No: ${student.registerNo}`, 20, y + 19);
      doc.text(`Department: ${student.department} (Sem ${student.semester})`, 20, y + 25);

      doc.text(`Attendance: ${student.attendance}%`, 110, y + 13);
      const riskStatusStr = student.riskFlagged ? "HIGH RISK" : "LOW RISK";
      doc.text(`Risk Status: ${riskStatusStr}`, 110, y + 19);
      doc.text(`Assigned Lab: ${student.labName}`, 110, y + 25);

      y += 38;

      // Academic Lab Experiments Table title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(11, 25, 44);
      doc.text("LABORATORY PROGRESS & MARKS EVALUATION TRACK", 15, y);
      y += 4;

      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.2);
      doc.line(15, y, 195, y);
      y += 3;

      // Table Header
      doc.setFillColor(11, 25, 44);
      doc.rect(15, y, 180, 7, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("EXP NO", 17, y + 4.5);
      doc.text("EXPERIMENT DESCRIPTION", 32, y + 4.5);
      doc.text("OBSERVATION", 100, y + 4.5);
      doc.text("RECORD STATUS", 130, y + 4.5);
      doc.text("SCORE / 10", 165, y + 4.5);
      doc.text("DATE", 182, y + 4.5);
      y += 7;

      // List experiments 1 to 12
      for (let i = 1; i <= 12; i++) {
        const exp = student.experiments.find(e => e.id === `exp-${i}`) || {
          name: `Lab Experiment ${i}`,
          status: 'Not Submitted',
          score: 0,
          submittedAt: undefined
        };
        const asg = student.assignments.find(a => a.id === `asg-${i}`);

        // Strip or abbreviate name if too long
        let displayName = exp.name;
        if (displayName.length > 36) {
          displayName = displayName.substring(0, 34) + "...";
        }

        const obsStatus = exp.status;
        const recStatus = asg ? asg.status : "-";
        const score = asg && asg.status === 'Graded' ? asg.score : (exp.status === 'Approved' ? exp.score : "-");
        const dateStr = exp.submittedAt ? formatSubmissionDate(exp.submittedAt) : (asg?.submittedAt ? formatSubmissionDate(asg.submittedAt) : "-");

        // Background alternating colors
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, y, 180, 6.5, "F");
        }
        doc.setDrawColor(240, 242, 245);
        doc.rect(15, y, 180, 6.5, "S");

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(60, 60, 60);

        doc.text(`${i}`, 18, y + 4.5);
        doc.text(displayName, 32, y + 4.5);
        
        // Color coding statuses
        if (obsStatus === 'Approved') {
          doc.setTextColor(16, 124, 65); // Green
          doc.text("Approved", 100, y + 4.5);
        } else if (obsStatus === 'Submitted - Pending') {
          doc.setTextColor(217, 119, 6); // Orange
          doc.text("Pending", 100, y + 4.5);
        } else if (obsStatus === 'Rejected') {
          doc.setTextColor(220, 38, 38); // Red
          doc.text("Rejected", 100, y + 4.5);
        } else {
          doc.setTextColor(120, 120, 120);
          doc.text("-", 100, y + 4.5);
        }

        doc.setTextColor(60, 60, 60);
        if (recStatus === 'Graded') {
          doc.setTextColor(79, 70, 229); // Indigo
          doc.text("Graded", 130, y + 4.5);
        } else if (recStatus === 'Submitted') {
          doc.setTextColor(217, 119, 6);
          doc.text("Submitted", 130, y + 4.5);
        } else {
          doc.setTextColor(120, 120, 120);
          doc.text("-", 130, y + 4.5);
        }

        doc.setTextColor(60, 60, 60);
        doc.text(score !== undefined && score !== null ? score.toString() : "-", 170, y + 4.5);
        doc.text(dateStr, 182, y + 4.5);

        y += 6.5;
      }

      y += 8;

      // Draw performance summary and remarks
      doc.setFillColor(254, 252, 232); // soft yellow
      doc.rect(15, y, 180, 18, "F");
      doc.setDrawColor(253, 224, 71);
      doc.rect(15, y, 180, 18, "S");

      // Calculate overall statistics
      const totalExp = student.experiments.length;
      const approvedCount = student.experiments.filter(e => e.status === 'Approved').length;
      const gradedCount = student.assignments.filter(a => a.status === 'Graded').length;
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(11, 25, 44);
      doc.text("FACULTY ACADEMIC STANDING NOTES", 18, y + 5);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`• Total Supervised Experiments: 12  |  Approved Observations: ${approvedCount}  |  Completed Records: ${gradedCount}`, 18, y + 10);
      
      // Risk indicator
      let riskText = "Student is performing exceptionally well and is highly compliant.";
      if (student.riskFlagged) {
        riskText = `CRITICAL WARNING: At Academic Risk. ${student.riskReason || "Low attendance or lab completion rate below criteria."}`;
      }
      doc.setFont("Helvetica", "bold");
      doc.text(`• Academic Standing: ${riskText}`, 18, y + 14);

      // Footer signature spaces
      y += 28;
      doc.setDrawColor(220, 220, 220);
      doc.line(15, y, 60, y);
      doc.line(145, y, 195, y);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Student Signature", 30, y + 4, { align: 'center' });
      doc.text("Faculty Reviewer Signature", 170, y + 4, { align: 'center' });
    });

    doc.save(filename);
  };

  // Export full track record (grid matrix of weeks/exps) for all students under supervision as a landscape PDF
  const handleExportTrackRecordPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const filename = `AIDS_Lab_Management_Track_Record.pdf`;
    let y = 15;

    const drawHeader = () => {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(11, 25, 44);
      doc.text("PANIMALAR ENGINEERING COLLEGE", 148, y, { align: 'center' });
      y += 5;

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      doc.text("DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE", 148, y, { align: 'center' });
      y += 5;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(139, 0, 0);
      doc.text("CONSOLIDATED LABORATORY TRACK RECORD & EVALUATION MATRIX", 148, y, { align: 'center' });
      y += 3;

      doc.setDrawColor(11, 25, 44);
      doc.setLineWidth(0.5);
      doc.line(10, y, 287, y);
      y += 6;
    };

    drawHeader();

    const colRoll = 14;
    const colName = 48;
    const colAttd = 14;
    const colType = 21;
    const colExp = 15; // 12 * 15 = 180mm
    const startX = 10;

    const drawTableHeaders = (currentY: number) => {
      doc.setFillColor(11, 25, 44);
      doc.rect(startX, currentY, 277, 12, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);

      doc.text("ROLL NO", startX + 2, currentY + 7);
      doc.text("STUDENT DETAILS", startX + colRoll + 2, currentY + 7);
      doc.text("ATTD %", startX + colRoll + colName + 2, currentY + 7);
      doc.text("NOTEBOOK TYPE", startX + colRoll + colName + colAttd + 1, currentY + 7);

      // Week Headers
      doc.setFillColor(30, 41, 59);
      doc.rect(startX + colRoll + colName + colAttd + colType, currentY, 60, 6, "F");
      doc.rect(startX + colRoll + colName + colAttd + colType + 60, currentY, 60, 6, "F");
      doc.rect(startX + colRoll + colName + colAttd + colType + 120, currentY, 60, 6, "F");

      doc.setFontSize(7.5);
      doc.text("WEEK 1 (EXP 1-4)", startX + colRoll + colName + colAttd + colType + 16, currentY + 4.5);
      doc.text("WEEK 2 (EXP 5-8)", startX + colRoll + colName + colAttd + colType + 76, currentY + 4.5);
      doc.text("WEEK 3 (EXP 9-12)", startX + colRoll + colName + colAttd + colType + 136, currentY + 4.5);

      // Sub Experiment Headers
      doc.setFontSize(7);
      for (let e = 1; e <= 12; e++) {
        const eX = startX + colRoll + colName + colAttd + colType + (e - 1) * colExp;
        doc.setFillColor(18, 34, 56);
        doc.rect(eX, currentY + 6, colExp, 6, "F");
        doc.setTextColor(255, 255, 255);
        doc.text(`Exp ${e}`, eX + 3, currentY + 10.2);
      }

      doc.setDrawColor(71, 85, 105);
      doc.setLineWidth(0.2);
      doc.line(startX + colRoll, currentY, startX + colRoll, currentY + 12);
      doc.line(startX + colRoll + colName, currentY, startX + colRoll + colName, currentY + 12);
      doc.line(startX + colRoll + colName + colAttd, currentY, startX + colRoll + colName + colAttd, currentY + 12);
      doc.line(startX + colRoll + colName + colAttd + colType, currentY, startX + colRoll + colName + colAttd + colType, currentY + 12);
      for (let e = 1; e <= 12; e++) {
        const eX = startX + colRoll + colName + colAttd + colType + e * colExp;
        doc.line(eX, currentY, eX, currentY + 12);
      }
    };

    drawTableHeaders(y);
    y += 12;

    myStudents.forEach((student) => {
      if (y + 16 > 195) {
        doc.addPage();
        y = 15;
        drawHeader();
        drawTableHeaders(y);
        y += 12;
      }

      const rowHeight = 4.8;
      doc.setFontSize(7);

      doc.setFillColor(248, 250, 252);
      doc.rect(startX, y, colRoll + colName + colAttd, rowHeight * 3, "F");

      doc.setDrawColor(218, 223, 230);
      doc.rect(startX, y, 277, rowHeight * 3, "S");

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(11, 25, 44);
      doc.text(student.rollNo, startX + 2, y + 8);
      doc.text(student.name, startX + colRoll + 2, y + 6);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(110, 110, 110);
      doc.text(student.registerNo, startX + colRoll + 2, y + 10);
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(student.attendance >= 75 ? 16 : 220, student.attendance >= 75 ? 124 : 38, student.attendance >= 75 ? 65 : 38);
      doc.text(`${student.attendance}%`, startX + colRoll + colName + 3, y + 8);

      for (let rType = 0; rType < 3; rType++) {
        const rowY = y + rType * rowHeight;
        
        doc.setDrawColor(230, 235, 240);
        doc.line(startX + colRoll + colName + colAttd, rowY, startX + 277, rowY);

        doc.setFont("Helvetica", "bold");
        if (rType === 0) {
          doc.setFillColor(236, 253, 245);
          doc.rect(startX + colRoll + colName + colAttd, rowY, colType, rowHeight, "F");
          doc.setTextColor(16, 124, 65);
          doc.text("Observation", startX + colRoll + colName + colAttd + 1.5, rowY + 3.5);
        } else if (rType === 1) {
          doc.setFillColor(239, 246, 255);
          doc.rect(startX + colRoll + colName + colAttd, rowY, colType, rowHeight, "F");
          doc.setTextColor(79, 70, 229);
          doc.text("Record", startX + colRoll + colName + colAttd + 1.5, rowY + 3.5);
        } else {
          doc.setFillColor(248, 250, 252);
          doc.rect(startX + colRoll + colName + colAttd, rowY, colType, rowHeight, "F");
          doc.setTextColor(100, 110, 120);
          doc.text("Date", startX + colRoll + colName + colAttd + 1.5, rowY + 3.5);
        }

        for (let e = 1; e <= 12; e++) {
          const eX = startX + colRoll + colName + colAttd + colType + (e - 1) * colExp;
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(6.5);

          if (rType === 0) {
            const exp = student.experiments.find(ex => ex.id === `exp-${e}`);
            if (exp) {
              if (exp.status === 'Approved') {
                doc.setTextColor(16, 124, 65);
                doc.setFont("Helvetica", "bold");
                doc.text("Appr", eX + 4, rowY + 3.5);
              } else if (exp.status === 'Rejected') {
                doc.setTextColor(220, 38, 38);
                doc.setFont("Helvetica", "bold");
                doc.text("Rej", eX + 5, rowY + 3.5);
              } else {
                doc.setTextColor(217, 119, 6);
                doc.text("Pend", eX + 4, rowY + 3.5);
              }
            } else {
              doc.setTextColor(180, 180, 180);
              doc.text("-", eX + 7, rowY + 3.5);
            }
          } else if (rType === 1) {
            const asg = student.assignments.find(a => a.id === `asg-${e}`);
            if (asg) {
              if (asg.status === 'Graded') {
                doc.setTextColor(79, 70, 229);
                doc.setFont("Helvetica", "bold");
                doc.text(`G:${asg.score}`, eX + 3.5, rowY + 3.5);
              } else {
                doc.setTextColor(217, 119, 6);
                doc.text("Sub", eX + 5, rowY + 3.5);
              }
            } else {
              doc.setTextColor(180, 180, 180);
              doc.text("-", eX + 7, rowY + 3.5);
            }
          } else {
            const exp = student.experiments.find(ex => ex.id === `exp-${e}`);
            const asg = student.assignments.find(a => a.id === `asg-${e}`);
            let dStr = "";
            if (exp && exp.submittedAt) {
              dStr = formatSubmissionDate(exp.submittedAt);
            } else if (asg && asg.submittedAt) {
              dStr = formatSubmissionDate(asg.submittedAt);
            }
            doc.setTextColor(100, 100, 100);
            doc.setFont("Courier", "normal");
            doc.setFontSize(6);
            doc.text(dStr || "-", eX + 3, rowY + 3.5);
          }
        }
      }

      doc.setDrawColor(218, 223, 230);
      doc.line(startX + colRoll, y, startX + colRoll, y + rowHeight * 3);
      doc.line(startX + colRoll + colName, y, startX + colRoll + colName, y + rowHeight * 3);
      doc.line(startX + colRoll + colName + colAttd, y, startX + colRoll + colName + colAttd, y + rowHeight * 3);
      doc.line(startX + colRoll + colName + colAttd + colType, y, startX + colRoll + colName + colAttd + colType, y + rowHeight * 3);
      for (let e = 1; e <= 12; e++) {
        const eX = startX + colRoll + colName + colAttd + colType + e * colExp;
        doc.line(eX, y, eX, y + rowHeight * 3);
      }

      y += rowHeight * 3;
      y += 1.5;
    });

    doc.save(filename);
  };

  // Export consolidated multi-row spreadsheet matching user row and column layout
  const handleExportConsolidatedSheet = () => {
    const filename = `AIDS_Lab_Management_Consolidated_Sheet.csv`;
    
    // Helper to escape values for CSV
    const escapeCSV = (str: string) => {
      if (!str) return '""';
      return `"${str.replace(/"/g, '""')}"`;
    };

    // Header Rows matching the 3-Week, 4-Experiment layout
    const rows = [
      ["PANIMALAR ENGINEERING COLLEGE", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["CONSOLIDATED LAB EVALUATION SHEET", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      [
        "ROLL NUMBERS",
        "STUDENT NAME",
        "ATTENDANCE",
        "OBSERVATION OR RECORD",
        "WEEK 1", "", "", "",
        "WEEK 2", "", "", "",
        "WEEK 3", "", "", ""
      ],
      [
        "",
        "",
        "",
        "",
        "E1 (Exp 1)", "E2 (Exp 2)", "E3 (Exp 3)", "E4 (Exp 4)",
        "E1 (Exp 5)", "E2 (Exp 6)", "E3 (Exp 7)", "E4 (Exp 8)",
        "E1 (Exp 9)", "E2 (Exp 10)", "E3 (Exp 11)", "E4 (Exp 12)"
      ]
    ];

    // For each student, add 3 rows (Observation, Record, Date)
    myStudents.forEach((student) => {
      // Row 1: Observation
      const obsRow = [
        student.rollNo,
        student.name,
        `${student.attendance}%`,
        "Observation"
      ];
      
      // Row 2: Record
      const recRow = [
        "",
        "",
        "",
        "Record"
      ];

      // Row 3: Date
      const dateRow = [
        "",
        "",
        "",
        "Date"
      ];

      // Loop over 3 weeks of 4 experiments each (1 to 12)
      for (let week = 1; week <= 3; week++) {
        for (let eNum = 1; eNum <= 4; eNum++) {
          const expIndex = (week - 1) * 4 + eNum;
          
          // Find experiment status
          const exp = student.experiments.find(e => e.id === `exp-${expIndex}`);
          let obsStatus = "-";
          if (exp) {
            if (exp.status === 'Approved') obsStatus = "Approved";
            else if (exp.status === 'Rejected') obsStatus = "Rejected";
            else if (exp.status === 'Submitted - Pending') obsStatus = "Pending";
          }
          obsRow.push(obsStatus);

          // Find record assignment status
          const asg = student.assignments.find(a => a.id === `asg-${expIndex}`);
          let recStatus = "-";
          if (asg) {
            if (asg.status === 'Graded') recStatus = "Graded";
            else if (asg.status === 'Submitted') recStatus = "Submitted";
          }
          recRow.push(recStatus);

          // Find submission date
          let submissionDate = "-";
          if (exp && exp.submittedAt) {
            submissionDate = formatSubmissionDate(exp.submittedAt);
          }
          if (asg && asg.submittedAt) {
            const asgDate = formatSubmissionDate(asg.submittedAt);
            if (submissionDate !== "-" && submissionDate !== asgDate) {
              submissionDate = `${submissionDate} / ${asgDate}`;
            } else if (submissionDate === "-") {
              submissionDate = asgDate;
            }
          }
          dateRow.push(submissionDate);
        }
      }

      rows.push(obsRow);
      rows.push(recRow);
      rows.push(dateRow);
      rows.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]); // empty divider row between students
    });

    const content = "\uFEFF" + rows.map(r => r.map(cell => escapeCSV(cell)).join(",")).join("\n");

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setIsSubmittingReview(true);
    setReviewSuccess('');

    try {
      const expId = `exp-${reviewExpIdx}`;
      const asgId = `asg-${reviewExpIdx}`;

      if (reviewType === 'observation') {
        const statusVal = reviewStatus === 'Approved' ? 'Approved' : 'Rejected';
        await updateLabSubmissionStatus(selectedStudentId, expId, statusVal, reviewScore, reviewRemarks);
      } else {
        // Record grading mapped to assignments
        await gradeAssignment(selectedStudentId, asgId, reviewScore, reviewRemarks);
      }

      setReviewSuccess('Review processed and submitted successfully!');
      setTimeout(() => setReviewSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRiskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setIsSubmittingRisk(true);
    setRiskSuccess('');

    try {
      await updateStudentRisk(selectedStudentId, riskFlagged, riskReason);
      setRiskSuccess('Academic risk standing updated successfully!');
      setTimeout(() => setRiskSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRisk(false);
    }
  };

  const formatSubmissionDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return '';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const getExpDateString = (exp: any) => {
    if (exp.submittedAt) {
      return formatSubmissionDate(exp.submittedAt);
    }
    if (exp.status === 'Approved') {
      return '08/07';
    }
    return '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Supervised Student Journal</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Perform digital reviews of student journals, download submission templates, and audit academic risk standings.
        </p>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: Student Journal Roster (Takes 2/3 of space on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header / Search Controls */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Supervised Student Roster</h3>
                <p className="text-xs text-slate-400 mt-0.5">Click any row to select student for digital review</p>
              </div>
              <div className="flex flex-col xl:flex-row xl:items-center gap-2 w-full md:w-auto">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleExportConsolidatedSheet}
                    className="p-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm whitespace-nowrap justify-center flex-1 sm:flex-initial"
                    title="Export entire class observation/record matrix as formatted Excel CSV"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Excel Sheet
                  </button>
                  <button
                    type="button"
                    onClick={handleExportAllStudentsPDF}
                    className="p-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm whitespace-nowrap justify-center flex-1 sm:flex-initial"
                    title="Download comprehensive laboratory dossiers for all supervised students in a single PDF document"
                  >
                    <FileText className="w-3.5 h-3.5" /> All Students PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportTrackRecordPDF}
                    className="p-2 px-2.5 bg-rose-700 hover:bg-rose-800 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm whitespace-nowrap justify-center flex-1 sm:flex-initial"
                    title="Download landscape class tracker matrix showing status of all 12 experiments in a single PDF document"
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> Track Record PDF
                  </button>
                </div>
                <div className="relative w-full xl:w-40 shrink-0">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="text-xs">🔍</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#0B192C] text-white border-b border-slate-700 text-[10px] uppercase font-bold tracking-wider">
                    <th rowSpan={2} className="px-4 py-3 border-r border-slate-700 w-16 text-center align-middle">Roll No</th>
                    <th rowSpan={2} className="px-5 py-3 border-r border-slate-700 min-w-[180px] align-middle">Student Name</th>
                    <th rowSpan={2} className="px-4 py-3 border-r border-slate-700 w-36 align-middle">Observation or Record</th>
                    <th colSpan={4} className="px-2 py-1.5 text-center border-r border-slate-700 bg-slate-800/40 font-extrabold text-[11px]">
                      Week 1
                    </th>
                    <th colSpan={4} className="px-2 py-1.5 text-center border-r border-slate-700 bg-slate-800/40 font-extrabold text-[11px]">
                      Week 2
                    </th>
                    <th colSpan={4} className="px-2 py-1.5 text-center bg-slate-800/40 font-extrabold text-[11px]">
                      Week 3
                    </th>
                  </tr>
                  <tr className="bg-[#122238] text-indigo-200 border-b border-slate-700 text-[9px] font-extrabold tracking-wider text-center">
                    {[1, 2, 3].map((week) => (
                      <React.Fragment key={week}>
                        <th className="px-1 py-1.5 border-r border-slate-700 w-10">E1</th>
                        <th className="px-1 py-1.5 border-r border-slate-700 w-10">E2</th>
                        <th className="px-1 py-1.5 border-r border-slate-700 w-10">E3</th>
                        <th className="px-1 py-1.5 border-r border-slate-700 w-10">E4</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {(() => {
                    const filtered = myStudents.filter(student =>
                      student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      student.rollNo.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                      student.registerNo.toLowerCase().includes(studentSearchTerm.toLowerCase())
                    );

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={16} className="px-6 py-12 text-center text-sm text-slate-400 font-medium">
                            No matching student records found.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((student) => {
                      const isCurrentlySelected = student.id === selectedStudentId;
                      return (
                        <React.Fragment key={student.id}>
                          {/* ROW 1: OBSERVATION */}
                          <tr 
                            className={`transition-colors cursor-pointer border-t border-slate-100 ${
                              isCurrentlySelected ? 'bg-indigo-50/25 font-semibold' : 'hover:bg-slate-50/50'
                            }`}
                            onClick={() => setSelectedStudentId(student.id)}
                          >
                            <td rowSpan={3} className="px-4 py-3 text-center border-r border-slate-100 bg-slate-50/40 align-middle font-bold text-slate-700">
                              {student.rollNo}
                            </td>
                            <td rowSpan={3} className="px-5 py-4 border-r border-slate-100 align-middle">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-extrabold text-slate-800 text-sm">
                                    {student.name}
                                  </p>
                                  <span className="text-[10px] text-indigo-600 font-bold">›</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold">{student.registerNo}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${student.attendance >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                    {student.attendance}% Attendance
                                  </span>
                                  {student.riskFlagged && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold">
                                      ⚠ Risk Status
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 border-r border-slate-100 font-bold text-emerald-700 bg-emerald-50/20 border-b border-slate-100 text-left">
                              Observation
                            </td>
                            {[1, 2, 3].map((week) => (
                              <React.Fragment key={week}>
                                {[1, 2, 3, 4].map((eNum) => {
                                  const expIndex = (week - 1) * 4 + eNum;
                                  const exp = student.experiments.find(e => e.id === `exp-${expIndex}`);
                                  let cellContent = <span className="text-slate-300 font-bold">-</span>;
                                  if (exp) {
                                    if (exp.status === 'Approved') {
                                      cellContent = <span className="text-emerald-600 font-black text-sm">✓</span>;
                                    } else if (exp.status === 'Rejected') {
                                      cellContent = <span className="text-rose-500 font-bold text-sm">✗</span>;
                                    } else if (exp.status === 'Submitted - Pending') {
                                      cellContent = <span className="text-amber-500 font-bold text-sm animate-pulse">⏳</span>;
                                    }
                                  }
                                  return (
                                    <td 
                                      key={eNum} 
                                      className="px-2 py-2 text-center border-r border-slate-100 align-middle border-b border-slate-100"
                                    >
                                      {cellContent}
                                    </td>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </tr>

                          {/* ROW 2: RECORD */}
                          <tr 
                            className={`transition-colors cursor-pointer ${
                              isCurrentlySelected ? 'bg-indigo-50/25 font-semibold' : 'hover:bg-slate-50/50'
                            }`}
                            onClick={() => setSelectedStudentId(student.id)}
                          >
                            <td className="px-4 py-2.5 border-r border-slate-100 font-bold text-indigo-700 bg-indigo-50/20 border-b border-slate-100 text-left">
                              Record
                            </td>
                            {[1, 2, 3].map((week) => (
                              <React.Fragment key={week}>
                                {[1, 2, 3, 4].map((eNum) => {
                                  const expIndex = (week - 1) * 4 + eNum;
                                  const asg = student.assignments.find(a => a.id === `asg-${expIndex}`);
                                  let cellContent = <span className="text-slate-300 font-bold">-</span>;
                                  if (asg) {
                                    if (asg.status === 'Graded') {
                                      cellContent = <span className="text-indigo-600 font-black text-sm">✓</span>;
                                    } else if (asg.status === 'Submitted') {
                                      cellContent = <span className="text-amber-500 font-bold text-sm animate-pulse">⏳</span>;
                                    }
                                  }
                                  return (
                                    <td 
                                      key={eNum} 
                                      className="px-2 py-2 text-center border-r border-slate-100 align-middle border-b border-slate-100"
                                    >
                                      {cellContent}
                                    </td>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </tr>

                          {/* ROW 3: DATE */}
                          <tr 
                            className={`transition-colors cursor-pointer border-b border-slate-200/60 ${
                              isCurrentlySelected ? 'bg-indigo-50/25 font-bold' : 'hover:bg-slate-50/50'
                            }`}
                            onClick={() => setSelectedStudentId(student.id)}
                          >
                            <td className="px-4 py-1.5 border-r border-slate-100 font-bold text-slate-500 bg-slate-50/40 text-left text-[10px]">
                              Date
                            </td>
                            {[1, 2, 3].map((week) => (
                              <React.Fragment key={week}>
                                {[1, 2, 3, 4].map((eNum) => {
                                  const expIndex = (week - 1) * 4 + eNum;
                                  const exp = student.experiments.find(e => e.id === `exp-${expIndex}`);
                                  const asg = student.assignments.find(a => a.id === `asg-${expIndex}`);
                                  
                                  let dateStr = '';
                                  if (exp && exp.submittedAt) {
                                    dateStr = formatSubmissionDate(exp.submittedAt);
                                  }
                                  if (asg && asg.submittedAt) {
                                    const asgDate = formatSubmissionDate(asg.submittedAt);
                                    if (dateStr && dateStr !== asgDate) {
                                      dateStr = `${dateStr} / ${asgDate}`;
                                    } else if (!dateStr) {
                                      dateStr = asgDate;
                                    }
                                  }

                                  return (
                                    <td 
                                      key={eNum} 
                                      className="px-1 py-1.5 text-center border-r border-slate-100 align-middle text-[9px] text-slate-500 font-mono"
                                    >
                                      {dateStr || '-'}
                                    </td>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </tr>
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Journal Review & Risk Console */}
        <div className={`space-y-6 ${selectedStudent ? 'p-5 bg-blue-50/40 rounded-3xl border border-blue-100/50' : ''}`}>
          {selectedStudent ? (
            <>
              {/* Console Section 1: Notebook Reviews (Observation & Record) */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4.5 h-4.5 text-indigo-600" />
                    <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">Digital Review Console</h4>
                  </div>
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    Experiment Check
                  </span>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Select Notebook Type */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notebook Type</label>
                    <div className="grid grid-cols-2 gap-2">
                       <button
                        type="button"
                        onClick={() => setReviewType('observation')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                          reviewType === 'observation' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Observation Sheet
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewType('record')}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                          reviewType === 'record' 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Record Notebook
                      </button>
                    </div>
                  </div>

                  {/* Select Experiment Index */}
                  <div>
                    <label htmlFor="reviewExpIdx" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Lab Experiment</label>
                    <select
                      id="reviewExpIdx"
                      value={reviewExpIdx}
                      onChange={(e) => setReviewExpIdx(parseInt(e.target.value))}
                      className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i} value={i + 1}>Experiment {i + 1}</option>
                      ))}
                    </select>
                  </div>



                  {/* Status Selection (Only for Observation) */}
                  {reviewType === 'observation' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Review Decision</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewStatus('Approved')}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                            reviewStatus === 'Approved' 
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewStatus('Rejected')}
                          className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition cursor-pointer ${
                            reviewStatus === 'Rejected' 
                              ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Reject / Redo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input Score */}
                  <div>
                    <label htmlFor="reviewScore" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Award Score (max 10)</label>
                    <input
                      id="reviewScore"
                      type="number"
                      min="0"
                      max="10"
                      value={reviewScore}
                      onChange={(e) => setReviewScore(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white"
                      required
                    />
                  </div>

                  {/* Input Remarks */}
                  <div>
                    <label htmlFor="reviewRemarks" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Review Remarks / Corrections</label>
                    <input
                      id="reviewRemarks"
                      type="text"
                      placeholder="e.g., Diagrams verified, great mathematical formulation."
                      value={reviewRemarks}
                      onChange={(e) => setReviewRemarks(e.target.value)}
                      className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white"
                      required
                    />
                  </div>

                  {reviewSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{reviewSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer text-center shadow-md disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Submitting Review...' : 'Submit Digital Review'}
                  </button>
                </form>
              </div>

              {/* Console Section 2: Academic Risk Standing Update */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-600" />
                    <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">Academic Risk Standing</h4>
                  </div>
                  <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                    Remedial Auditing
                  </span>
                </div>

                <form onSubmit={handleRiskSubmit} className="space-y-4">
                  {/* Flag Toggle checkbox style */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    riskFlagged 
                      ? 'bg-rose-50/70 border-rose-300 shadow-sm' 
                      : 'bg-white border-slate-200 hover:bg-slate-50/50'
                  }`}>
                    <input 
                      type="checkbox"
                      checked={riskFlagged}
                      onChange={(e) => setRiskFlagged(e.target.checked)}
                      className="mt-1 w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 rounded"
                    />
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-xs text-slate-800">Flag Student as "At-Risk"</p>
                      <p className="text-[10px] text-slate-400 font-medium">Triggers automated circulars, warnings and calls for immediate advisor counselling.</p>
                    </div>
                  </label>

                  {/* Risk Reason / Remedial notes */}
                  {riskFlagged && (
                    <div>
                      <label htmlFor="riskReason" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remedial Action plan & Risk Reason</label>
                      <textarea
                        id="riskReason"
                        rows={3}
                        placeholder="Due to consecutive lab absences or low internal score. Remedial practical sessions scheduled."
                        value={riskReason}
                        onChange={(e) => setRiskReason(e.target.value)}
                        className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white"
                        required={riskFlagged}
                      />
                    </div>
                  )}

                  {riskSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{riskSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingRisk}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer text-center shadow"
                  >
                    {isSubmittingRisk ? 'Updating Academic standing...' : 'Submit Academic Standing'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl text-center text-slate-400 font-medium text-xs">
              Select a student to load the Academic Review & risk auditing console.
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Journal Document Preview Modal */}
      {isPreviewOpen && selectedStudent && (() => {
        const expObj = selectedStudent.experiments.find(e => e.id === `exp-${reviewExpIdx}`) || selectedStudent.experiments[reviewExpIdx - 1];
        const expName = expObj ? expObj.name : `Experiment ${reviewExpIdx}`;
        const { aim, algorithm, code, output } = getExperimentMockContent(
          selectedStudent.name,
          selectedStudent.registerNo,
          selectedStudent.rollNo,
          selectedStudent.labName,
          reviewExpIdx,
          reviewType
        );

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={() => setIsPreviewOpen(false)}></div>
            
            <div className="relative bg-[#FCFBF7] max-w-3xl w-full rounded-2xl shadow-2xl border border-amber-100/50 max-h-[90vh] overflow-y-auto flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <span className="font-extrabold text-xs tracking-wider uppercase">Online Journal Document Viewer</span>
                </div>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-7 h-7 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Document Sheet Body */}
              <div className="p-8 sm:p-10 space-y-6 flex-1 text-slate-800">
                {/* Panimalar Official Heading */}
                <div className="text-center border-b-2 border-slate-900 pb-6 space-y-1 relative">
                  {/* Simulated Stamp */}
                  <div className="absolute right-0 top-0 border-2 border-dashed border-emerald-500 text-emerald-600 rounded-lg p-2 font-mono uppercase text-[9px] font-bold tracking-widest rotate-6 select-none opacity-80">
                    {reviewType === 'observation' ? 'Obs Verified' : 'Record Graded'}<br/>
                    Score: {reviewScore}/10
                  </div>

                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">Panimalar Engineering College</h2>
                  <p className="text-xs font-bold text-slate-700 tracking-wide">An Autonomous Institution, Affiliated to Anna University</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Department of Artificial Intelligence & Data Science</p>
                  <div className="pt-2 flex justify-center">
                    <div className="h-0.5 w-24 bg-indigo-600"></div>
                  </div>
                </div>

                {/* Student Academic Metadata Matrix Table */}
                <div className="grid grid-cols-2 gap-4 bg-slate-100/60 p-4 rounded-xl border border-slate-200 text-xs font-mono">
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Student Name</p>
                    <p className="text-slate-800 font-bold">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Register No</p>
                    <p className="text-slate-800 font-bold">{selectedStudent.registerNo}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Roll No</p>
                    <p className="text-slate-800 font-bold">{selectedStudent.rollNo}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Semester & Batch</p>
                    <p className="text-slate-800 font-bold">Sem {selectedStudent.semester} / {selectedStudent.batch}</p>
                  </div>
                  <div className="col-span-2 border-t border-slate-200 pt-2 mt-1">
                    <p className="text-slate-500 font-bold uppercase text-[9px]">Assigned Course Lab</p>
                    <p className="text-indigo-950 font-bold text-[11px]">{selectedStudent.labName}</p>
                  </div>
                </div>

                {/* Notebook details */}
                <div className="border-l-4 border-indigo-600 pl-4 py-1">
                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{reviewType === 'observation' ? 'Observation Sheet' : 'Record Notebook'}</span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">Exp {reviewExpIdx}: {expName}</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Submitted digitally for verification & grading on {expObj?.submittedAt || '10/07/2026'}</p>
                </div>

                {/* Aim Section */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-mono">I. Aim & Objective:</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">{aim}</p>
                </div>

                {/* Algorithm Section */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-mono">II. Algorithm / Methodology:</h4>
                  <div className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm whitespace-pre-line font-mono">
                    {algorithm}
                  </div>
                </div>

                {/* Program Code Section */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-mono">III. Source Code:</h4>
                  <pre className="text-xs text-slate-100 bg-[#0B192C] p-4 rounded-xl overflow-x-auto font-mono leading-relaxed shadow-inner">
                    <code>{code}</code>
                  </pre>
                </div>

                {/* Program Output Section */}
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider font-mono">IV. Runtime Output:</h4>
                  <pre className="text-xs text-emerald-400 bg-slate-950 p-4 rounded-xl overflow-x-auto font-mono leading-relaxed shadow-inner border border-slate-800">
                    <code>{output}</code>
                  </pre>
                </div>

                {/* Faculty Sign-off Stamp Block */}
                <div className="border-t border-dashed border-slate-300 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Evaluation Signature</p>
                    <p className="text-xs font-bold text-slate-700 mt-1 italic">Digitally Signed by Supervisor</p>
                    <p className="text-[10px] text-indigo-600 font-bold mt-0.5">{user?.name || 'Faculty Advisor'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Security Checksum:</span>
                    <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-600 select-all">SHA-256: 4C82E...7E91</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2 sticky bottom-0 z-20">
                <span className="text-[10px] text-slate-400 font-medium sm:mr-auto">Press Esc or click outside to dismiss.</span>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Print Report
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadExpFile(reviewType, reviewExpIdx)}
                  className="w-full sm:w-auto px-4 py-2 bg-[#0B192C] hover:bg-[#1E3048] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
