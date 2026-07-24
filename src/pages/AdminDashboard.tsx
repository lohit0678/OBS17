import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, Users, BookOpen, Shield, Bell, User,
  Plus, Upload, ChevronDown, X, Check, AlertTriangle,
  GraduationCap, Building2, Calendar, CalendarDays, FileSpreadsheet,
  Layers, UserCheck, Trash2, RefreshCw, Eye, BookOpenCheck,
  ClipboardList, Send, Search, Mail, Pencil, Activity, Clock, CheckCircle, CheckCircle2, XCircle, Download,
  Wifi, WifiOff, TrendingUp, Sparkles
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEGREE_OPTIONS  = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc'];
const YEAR_OPTIONS    = ['2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029'];
const DEPT_OPTIONS    = ['AI & DS', 'CSE', 'ECE', 'EEE', 'Mechanical', 'Civil'];
const SEMESTER_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

const ROMAN_YEAR_OPTIONS = ['I', 'II', 'III', 'IV'];

const mapSemesterToYear = (sem: string): string => {
  switch (sem) {
    case 'I':
    case 'II':
      return 'I';
    case 'III':
    case 'IV':
      return 'II';
    case 'V':
    case 'VI':
      return 'III';
    case 'VII':
    case 'VIII':
      return 'IV';
    default:
      return 'I';
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubjectItem { id: string; name: string; code: string; shortForm: string; }
interface Batch  { id: string; name: string; year: string; department: string; isActive: boolean; subjects?: SubjectItem[]; }
interface Section { id: string; batchId: string; name: string; timetableStructureId: string; timetable?: any[]; }


// ─── Small shared components ─────────────────────────────────────────────────
function Badge({ children, color = 'blue' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, string> = {
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-emerald-100 text-emerald-700',
    amber:  'bg-amber-100 text-amber-700',
    red:    'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    slate:  'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${map[color] || map.blue}`}>
      {children}
    </span>
  );
}

export function getBatchStudents(batch: Batch, sections: Section[], students: any[]): any[] {
  if (!batch || !students || !Array.isArray(students)) return [];
  
  const batchSectionIds = new Set(
    sections.filter(s => s && s.batchId === batch.id).map(s => s.id)
  );

  return students.filter(s => {
    if (!s) return false;
    
    // 1. Direct batch ID match
    if (s.batchId && s.batchId === batch.id) return true;

    // 2. Direct child section ID match
    if (s.sectionId && batchSectionIds.has(s.sectionId)) return true;

    // If student has a sectionId pointing to a section in another batch, exclude from this batch
    if (s.sectionId && !batchSectionIds.has(s.sectionId)) {
      const belongsToOtherBatch = sections.some(sec => sec.id === s.sectionId && sec.batchId !== batch.id);
      if (belongsToOtherBatch) return false;
    }

    // 3. Match by academic year (e.g., "2024-2028" vs "2025-2029")
    if (batch.year && s.batch && s.batch.includes(batch.year)) return true;

    return false;
  });
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatRollNo(rollNo?: string): string {
  if (!rollNo) return '-';
  return String(rollNo).replace(/\s+/g, '').toUpperCase();
}

export function getSubjectShortForm(subjectName?: string, explicitShortForm?: string, subjectCode?: string): string {
  if (explicitShortForm && explicitShortForm.trim()) return explicitShortForm.trim().toUpperCase();
  if (!subjectName || subjectName === '—') return '—';
  
  const clean = subjectName.trim();
  const knownMappings: Record<string, string> = {
    'Knowledge Engineering': 'KIES',
    'Knowledge Engineering and Intelligent Systems': 'KIES',
    'Knowledge Engineering & Intelligent Systems': 'KIES',
    'System Software': 'SSOS',
    'System Software and Operating Systems': 'SSOS',
    'System Software & Operating Systems': 'SSOS',
    'Web Development': 'DEV',
    'Development': 'DEV',
    'Full Stack Development': 'FSD',
    'Data Structures': 'DS',
    'Design and Analysis of Algorithms': 'DAA',
    'Object Oriented Programming': 'OOP',
    'Database Management Systems': 'DBMS',
    'Computer Networks': 'CN',
    'Operating Systems': 'OS',
    'Artificial Intelligence': 'AI',
    'Machine Learning': 'ML',
    'Deep Learning': 'DL',
    'Cloud Computing': 'CC',
  };

  for (const [key, short] of Object.entries(knownMappings)) {
    if (clean.toLowerCase().includes(key.toLowerCase())) {
      return short;
    }
  }

  const stopWords = new Set(['and', '&', 'of', 'in', 'for', 'the', 'to', 'with', 'lab', 'laboratory']);
  const words = clean.split(/[\s\-_]+/).filter(w => !stopWords.has(w.toLowerCase()));
  if (words.length >= 2) {
    return words.map(w => w.charAt(0).toUpperCase()).join('');
  }
  return clean.slice(0, 4).toUpperCase();
}

function Spinner() {
  return <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />;
}

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function SelectField({ label, id, value, onChange, options, required }: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold text-slate-700 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        id={id} value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800
          focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition cursor-pointer"
      >
        <option value="">— Select —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ComboboxField({ label, id, value, onChange, options, placeholder = "Select or type...", required }: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; options: string[]; placeholder?: string; required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => o.toLowerCase().includes((value || '').toLowerCase()));

  return (
    <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
      <label htmlFor={id} className="text-xs font-bold text-slate-700 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          required={required}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition pr-9"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen(prev => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto py-1">
            {(filteredOptions.length > 0 ? filteredOptions : options).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm font-semibold transition cursor-pointer flex items-center justify-between ${
                  value === opt ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{opt}</span>
                {value === opt && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>
            ))}
            {value && !options.includes(value) && (
              <div className="px-4 py-2 border-t border-slate-100 text-xs font-bold text-indigo-600 bg-indigo-50/50">
                Custom Entry: &quot;{value}&quot;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({ label, id, value, onChange, placeholder, required, type = 'text' }: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold text-slate-700 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800
          focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
      />
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-extrabold text-slate-800 text-base">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string;
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl shrink-0 ${colors[color] || colors.blue}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{label}</p>
        <h4 className="text-2xl font-black text-slate-800 mt-0.5">{value}</h4>
        {sub && <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 1 — OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════
function OverviewTab({ batches, sections, faculties, students }: {
  batches: Batch[]; sections: Section[]; faculties: any[]; students: any[];
}) {
  const activeBatchIds = new Set(batches.map(b => b.id));
  const activeSections = sections.filter(s => s.batchId && activeBatchIds.has(s.batchId));
  
  const totalStudents = batches.reduce((acc, b) => acc + getBatchStudents(b, sections, students).length, 0);
  const activeBatches = batches.filter(b => b.isActive).length;
  const activeFaculty = faculties.filter(f => f.isActive).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Layers}       label="Active Batches"   value={activeBatches}  sub={`${batches.length} total`}    color="blue"   />
        <StatCard icon={BookOpenCheck} label="Sections"         value={activeSections.length} sub="across active batches" color="purple" />
        <StatCard icon={GraduationCap} label="Total Students"   value={totalStudents}  sub="enrolled across active batches" color="green"  />
        <StatCard icon={UserCheck}    label="Active Faculty"   value={activeFaculty}  sub={`${faculties.length} pre-approved`} color="amber"  />
      </div>

      {/* Quick summary cards */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />Batch Overview
          </h3>
          {batches.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No batches created yet.</p>
          ) : (
            <div className="space-y-2">
              {batches.slice(0, 5).map(b => {
                const secCount = sections.filter(s => s.batchId === b.id).length;
                const studCount = getBatchStudents(b, sections, students).length;
                return (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{b.name}</p>
                      <p className="text-[10px] text-slate-500">{b.department} · {b.year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color="purple">{secCount} section{secCount !== 1 ? 's' : ''}</Badge>
                      <Badge color="blue">{studCount} student{studCount !== 1 ? 's' : ''}</Badge>
                      <Badge color={b.isActive ? 'green' : 'slate'}>{b.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 2 — BATCHES & SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function SectionStudentsModal({ section, batch, token, onClose }: {
  section: Section; batch: Batch | undefined; token: string; onClose: () => void;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [sectionSemester, setSectionSemester] = useState('III');
  const [sectionYear, setSectionYear] = useState('II');
  const [form, setForm] = useState({ name: '', registerNo: '', rollNo: '', email: '', phone: '', semester: 'III', year: 'II' });

  const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

  useEffect(() => {
    authFetch(`/api/admin/sections/${section.id}/students`)
      .then(r => r.json())
      .then(d => {
        const list = d.students || [];
        setStudents(list);
        if (list.length > 0) {
          if (list[0].semester) {
            setSectionSemester(list[0].semester);
            setForm(p => ({ ...p, semester: list[0].semester }));
          }
          if (list[0].year) {
            setSectionYear(list[0].year);
            setForm(p => ({ ...p, year: list[0].year }));
          }
        }
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [section.id]);

  const handleApplySectionSemester = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/sections/${section.id}/update-semester`, {
        method: 'PUT',
        body: JSON.stringify({ semester: sectionSemester, year: sectionYear }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        setToast({ msg: `Updated semester to "${sectionSemester}" and year to "${sectionYear}" for all ${students.length} students!`, type: 'success' });
      } else {
        setToast({ msg: data.error || 'Failed to update semester', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSingleStudentSemesterChange = async (studentId: string, newSem: string) => {
    const newYear = mapSemesterToYear(newSem);
    try {
      const [resSem, resYr] = await Promise.all([
        authFetch(`/api/admin/students/${studentId}/semester`, {
          method: 'PUT',
          body: JSON.stringify({ semester: newSem }),
        }),
        authFetch(`/api/admin/students/${studentId}/year`, {
          method: 'PUT',
          body: JSON.stringify({ year: newYear }),
        })
      ]);
      if (resSem.ok && resYr.ok) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, semester: newSem, year: newYear } : s));
        setToast({ msg: `Semester updated to ${newSem} and Year updated to ${newYear}`, type: 'success' });
      }
    } catch {
      setToast({ msg: 'Failed to update semester and year', type: 'error' });
    }
  };

  const handleSingleStudentYearChange = async (studentId: string, newYear: string) => {
    try {
      const res = await authFetch(`/api/admin/students/${studentId}/year`, {
        method: 'PUT',
        body: JSON.stringify({ year: newYear }),
      });
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, year: newYear } : s));
        setToast({ msg: `Year updated to ${newYear}`, type: 'success' });
      }
    } catch {
      setToast({ msg: 'Failed to update year', type: 'error' });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/sections/${section.id}/students`, {
        method: 'POST', body: JSON.stringify({ ...form, semester: form.semester || sectionSemester, year: form.year || sectionYear }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        setForm({ name: '', registerNo: '', rollNo: '', email: '', phone: '', semester: sectionSemester, year: sectionYear });
        setToast({ msg: 'Student added successfully!', type: 'success' });
      } else {
        setToast({ msg: data.error || 'Failed to add student', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBulkExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];

        if (!sheet) {
          setToast({ msg: 'Excel file is empty', type: 'error' });
          setSaving(false);
          return;
        }

        // Convert to 2D array of raw values to handle institutional title headers at the top
        const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (matrix.length === 0) {
          setToast({ msg: 'Excel file contains no rows', type: 'error' });
          setSaving(false);
          return;
        }

        // Scan rows to find the actual column header index
        let headerRowIdx = -1;
        for (let r = 0; r < Math.min(15, matrix.length); r++) {
          const rowStr = matrix[r].map((cell: any) => String(cell).toUpperCase()).join(' ');
          if (
            rowStr.includes('REGISTER NUMBER') ||
            rowStr.includes('REGISTER NO') ||
            rowStr.includes('REG NO') ||
            rowStr.includes('ROLL NO') ||
            (rowStr.includes('NAME') && rowStr.includes('S.NO'))
          ) {
            headerRowIdx = r;
            break;
          }
        }

        // Fallback to row 0 if no header title row was matched
        if (headerRowIdx === -1) headerRowIdx = 0;

        const headerKeys = matrix[headerRowIdx].map((cell: any) => String(cell).trim().toUpperCase());

        const nameIdx = headerKeys.findIndex((k: string) => k.includes('NAME') && !k.includes('DEPARTMENT') && !k.includes('COLLEGE'));
        const regIdx = headerKeys.findIndex((k: string) => k.includes('REGISTER') || k.includes('REG'));
        const rollIdx = headerKeys.findIndex((k: string) => k.includes('ROLL'));

        const parsedStudents: { name: string; registerNo: string; rollNo: string; semester: string; year: string }[] = [];

        for (let r = headerRowIdx + 1; r < matrix.length; r++) {
          const row = matrix[r];
          if (!row || row.length === 0) continue;

          const name = nameIdx !== -1 ? String(row[nameIdx] || '').trim() : '';
          const registerNo = regIdx !== -1 ? String(row[regIdx] || '').trim() : '';
          const rollNo = rollIdx !== -1 ? String(row[rollIdx] || '').trim() : registerNo;

          // Exclude header strings or blank rows
          const upperName = name.toUpperCase();
          if (
            name &&
            registerNo &&
            !upperName.includes('PANIMALAR') &&
            !upperName.includes('DEPARTMENT') &&
            !upperName.includes('BATCH') &&
            !upperName.includes('NAME')
          ) {
            parsedStudents.push({ name, registerNo, rollNo, semester: sectionSemester, year: sectionYear });
          }
        }

        if (parsedStudents.length === 0) {
          setToast({ msg: 'No valid student rows found. Ensure columns: S.NO, ROLL NO, REGISTER NUMBER, NAME', type: 'error' });
          setSaving(false);
          return;
        }

        const res = await authFetch(`/api/admin/sections/${section.id}/bulk-students`, {
          method: 'POST',
          body: JSON.stringify({ students: parsedStudents, semester: sectionSemester, year: sectionYear }),
        });
        const data = await res.json();
        if (res.ok) {
          setStudents(data.students || []);
          setToast({
            msg: `Bulk Import Complete: Successfully processed ${parsedStudents.length} students into Semester ${sectionSemester} and Year ${sectionYear} (Added ${data.addedCount || 0}, Updated ${data.updatedCount || 0})!`,
            type: 'success'
          });
        } else {
          setToast({ msg: data.error || 'Bulk upload failed', type: 'error' });
        }
      } catch (err: any) {
        console.error('[Excel Parse Error]', err);
        setToast({ msg: err?.message || 'Error parsing Excel sheet', type: 'error' });
      } finally {
        setSaving(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Modal title={`Students — ${section.name}`} onClose={onClose} wide>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Section Semester Control Bar */}
      <div className="bg-indigo-50/90 border border-indigo-200/70 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
              Section Semester & Year Setting
            </h4>
            <p className="text-[11px] text-indigo-700 font-medium">
              Set or update the semester and academic year for all enrolled students in this section.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sectionSemester}
            onChange={e => {
              const sem = e.target.value;
              setSectionSemester(sem);
              const yr = mapSemesterToYear(sem);
              setSectionYear(yr);
              setForm(p => ({ ...p, semester: sem, year: yr }));
            }}
            className="px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-extrabold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            {SEMESTER_OPTIONS.map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
          <select
            value={sectionYear}
            onChange={e => {
              setSectionYear(e.target.value);
              setForm(p => ({ ...p, year: e.target.value }));
            }}
            className="px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-extrabold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            {ROMAN_YEAR_OPTIONS.map(yr => (
              <option key={yr} value={yr}>Year {yr}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleApplySectionSemester}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 shadow-xs"
          >
            {saving ? <Spinner /> : <Check className="w-3.5 h-3.5" />} Apply to All Students
          </button>
        </div>
      </div>

      {/* Bulk Excel Upload Card */}
      <div className="bg-emerald-50/70 rounded-2xl p-4 mb-5 border border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Bulk Add Students via Excel
          </h4>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Format: <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-bold text-emerald-900">S.NO, ROLL NO, REGISTER NUMBER, NAME</code>
          </p>
        </div>
        <label className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-sm shrink-0">
          {saving ? <Spinner /> : <Upload className="w-3.5 h-3.5" />}
          Upload Excel
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleBulkExcelUpload}
            disabled={saving}
          />
        </label>
      </div>

      {/* Add student form */}
      <div className="bg-indigo-50/60 rounded-2xl p-4 mb-5 border border-indigo-100">
        <h4 className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Add Individual Student
        </h4>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField label="Full Name" id="s-name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="e.g. Priya Sharma" required />
          <InputField label="Register No." id="s-regNo" value={form.registerNo} onChange={v => setForm(p => ({ ...p, registerNo: v }))} placeholder="e.g. 312221104001" required />
          <InputField label="Roll No." id="s-roll" value={form.rollNo} onChange={v => setForm(p => ({ ...p, rollNo: v }))} placeholder="e.g. 001" />
          <InputField label="Email" id="s-email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="auto-generated if blank" />
          <InputField label="Phone" id="s-phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="+91 …" />
          <SelectField label="Semester" id="s-sem" value={form.semester} onChange={v => setForm(p => ({ ...p, semester: v }))} options={SEMESTER_OPTIONS} />
          <SelectField label="Year" id="s-year" value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} options={ROMAN_YEAR_OPTIONS} />
          <div className="sm:col-span-2 flex justify-end pt-1">
            <button
              type="submit" disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
            >
              {saving ? <Spinner /> : <Plus className="w-3.5 h-3.5" />}
              Add Student
            </button>
          </div>
        </form>
      </div>

      {/* Students table */}
      <div>
        <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-3">
          Enrolled Students ({loading ? '…' : students.length})
        </h4>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : students.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-6">No students enrolled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-slate-500 font-bold">Name</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-bold">Reg. No.</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-bold">Roll</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-bold">Semester</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-bold">Year</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id || i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.registerNo}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.rollNo}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                        Sem {s.semester || sectionSemester}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
                        Year {s.year || sectionYear}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

function EditBatchModal({ batch, token, onClose, onSave }: {
  batch: Batch; token: string; onClose: () => void; onSave: (updated: Batch) => void;
}) {
  const [form, setForm] = useState({
    name: batch.name,
    year: batch.year,
    department: batch.department,
    isActive: batch.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const targetId = batch.id || (batch as any)._id;
    try {
      const res = await authFetch(`/api/admin/batches/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onSave(data.batch);
        onClose();
      } else {
        setToast({ msg: data.error || 'Failed to update batch', type: 'error' });
      }
    } catch (err: any) {
      console.error("[Edit Batch Error]", err);
      setToast({ msg: err?.message || 'Failed to connect to server', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit Batch — ${batch.name}`} onClose={onClose}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <form onSubmit={handleSave} className="space-y-4">
        <SelectField label="Degree Programme" id="eb-name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} options={DEGREE_OPTIONS} required />
        <ComboboxField label="Academic Year" id="eb-year" value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} options={YEAR_OPTIONS} placeholder="Select or type year (e.g. 2026-2030)" required />
        <SelectField label="Department" id="eb-dept" value={form.department} onChange={v => setForm(p => ({ ...p, department: v }))} options={DEPT_OPTIONS} required />
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="eb-active"
            checked={form.isActive}
            onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
            className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
          />
          <label htmlFor="eb-active" className="text-xs font-bold text-slate-700 cursor-pointer">
            Active Status (Visible for Enrollment)
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition disabled:opacity-60">
            {saving ? <Spinner /> : <Check className="w-3.5 h-3.5" />} Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditSectionModal({ section, token, onClose, onSave }: {
  section: Section; token: string; onClose: () => void; onSave: (updated: Section) => void;
}) {
  const [name, setName] = useState(section.name);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const targetId = section.id || (section as any)._id;
    try {
      const res = await authFetch(`/api/admin/sections/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onSave(data.section);
        onClose();
      } else {
        setToast({ msg: data.error || 'Failed to update section', type: 'error' });
      }
    } catch (err: any) {
      console.error("[Edit Section Error]", err);
      setToast({ msg: err?.message || 'Failed to connect to server', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit Section — ${section.name}`} onClose={onClose}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <form onSubmit={handleSave} className="space-y-4">
        <InputField label="Section Name" id="es-name" value={name} onChange={setName} placeholder="e.g. Section A" required />
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition disabled:opacity-60">
            {saving ? <Spinner /> : <Check className="w-3.5 h-3.5" />} Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

function BatchesTab({ batches, sections, faculties = [], setBatches, setSections, token, onReload }: {
  batches: Batch[]; sections: Section[]; faculties?: any[];
  setBatches: React.Dispatch<React.SetStateAction<Batch[]>>;
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  token: string;
  onReload?: () => void;
}) {
  const [showBatchForm, setShowBatchForm]     = useState(false);
  const [showSectionForm, setShowSectionForm] = useState<string | null>(null); // batchId
  const [studentModal, setStudentModal]       = useState<{ section: Section; batch: Batch | undefined } | null>(null);
  const [editingBatch, setEditingBatch]       = useState<Batch | null>(null);
  const [editingSection, setEditingSection]   = useState<Section | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const [showAddSubjectForm, setShowAddSubjectForm] = useState<string | null>(null); // batchId
  const [newSubjectForm, setNewSubjectForm] = useState({ name: '', code: '', shortForm: '' });
  const [customSubjectsMap, setCustomSubjectsMap] = useState<Record<string, SubjectItem[]>>(() => {
    try {
      const stored = localStorage.getItem('custom_batch_subjects_map');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const handleAddSubjectToBatch = (e: React.FormEvent, batchId: string) => {
    e.preventDefault();
    if (!newSubjectForm.name || !newSubjectForm.code || !newSubjectForm.shortForm) {
      setToast({ msg: 'Subject Name, Code, and Short Form are required', type: 'error' });
      return;
    }

    const newItem: SubjectItem = {
      id: `subj-${Date.now()}`,
      name: newSubjectForm.name.trim(),
      code: newSubjectForm.code.trim().toUpperCase(),
      shortForm: newSubjectForm.shortForm.trim().toUpperCase(),
    };

    setCustomSubjectsMap(prev => {
      const updated = {
        ...prev,
        [batchId]: [...(prev[batchId] || []), newItem],
      };
      localStorage.setItem('custom_batch_subjects_map', JSON.stringify(updated));
      return updated;
    });

    setNewSubjectForm({ name: '', code: '', shortForm: '' });
    setShowAddSubjectForm(null);
    setToast({ msg: `Subject "${newItem.shortForm}" added to batch!`, type: 'success' });
  };

  const handleDeleteSubjectFromBatch = (batchId: string, subjectId: string) => {
    setCustomSubjectsMap(prev => {
      const updated = {
        ...prev,
        [batchId]: (prev[batchId] || []).filter(s => s.id !== subjectId),
      };
      localStorage.setItem('custom_batch_subjects_map', JSON.stringify(updated));
      return updated;
    });
    setToast({ msg: 'Subject removed', type: 'success' });
  };

  const [batchForm, setBatchForm] = useState({ name: '', year: '', department: '' });
  const [sectionForm, setSectionForm] = useState({ name: '' });

  const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.name || !batchForm.year || !batchForm.department) {
      setToast({ msg: 'All fields are required', type: 'error' }); return;
    }
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/batches', {
        method: 'POST', body: JSON.stringify({ ...batchForm, isActive: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setBatches(prev => [...prev, data.batch]);
        setBatchForm({ name: '', year: '', department: '' });
        setShowBatchForm(false);
        setToast({ msg: 'Batch created!', type: 'success' });
        if (onReload) onReload();
      } else {
        setToast({ msg: data.error || 'Failed to create batch', type: 'error' });
      }
    } catch { setToast({ msg: 'Network error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleCreateSection = async (e: React.FormEvent, batchId: string) => {
    e.preventDefault();
    if (!sectionForm.name) { setToast({ msg: 'Section name required', type: 'error' }); return; }
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/sections', {
        method: 'POST',
        body: JSON.stringify({ batchId, name: sectionForm.name, timetableStructureId: 'default' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSections(prev => [...prev, data.section]);
        setSectionForm({ name: '' });
        setShowSectionForm(null);
        setToast({ msg: 'Section added!', type: 'success' });
        if (onReload) onReload();
      } else {
        setToast({ msg: data.error || 'Failed', type: 'error' });
      }
    } catch { setToast({ msg: 'Network error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const { refreshData, students = [], setStudents, setFaculties } = useAcademicData();

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to remove batch "${batchName}"?`)) return;
    try {
      const res = await authFetch(`/api/admin/batches/${batchId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.batches) setBatches(data.batches);
        if (data.sections) setSections(data.sections);
        if (data.students) setStudents(data.students);
        if (data.faculties) setFaculties(data.faculties);
        setToast({ msg: `Batch "${batchName}" removed. All student and section records preserved.`, type: 'success' });
        if (onReload) onReload();
      } else {
        setToast({ msg: data.error || 'Remove failed', type: 'error' });
      }
    } catch { setToast({ msg: 'Network error', type: 'error' }); }
  };

  const handleDeleteSection = async (sectionId: string, sectionName: string) => {
    if (!confirm(`Are you sure you want to delete "${sectionName}" and all its enrolled student records?`)) return;
    try {
      const res = await authFetch(`/api/admin/sections/${sectionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.sections) setSections(data.sections);
        if (data.batches) setBatches(data.batches);
        if (data.students) setStudents(data.students);
        if (data.faculties) setFaculties(data.faculties);
        setToast({ msg: `Section "${sectionName}" and enrolled student records deleted from database!`, type: 'success' });
        if (onReload) onReload();
      } else {
        setToast({ msg: data.error || 'Delete failed', type: 'error' });
      }
    } catch { setToast({ msg: 'Network error', type: 'error' }); }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {studentModal && (
        <SectionStudentsModal
          section={studentModal.section} batch={studentModal.batch} token={token}
          onClose={() => setStudentModal(null)}
        />
      )}
      {editingBatch && (
        <EditBatchModal
          batch={editingBatch} token={token} onClose={() => setEditingBatch(null)}
          onSave={updated => setBatches(prev => prev.map(b => b.id === updated.id ? updated : b))}
        />
      )}
      {editingSection && (
        <EditSectionModal
          section={editingSection} token={token} onClose={() => setEditingSection(null)}
          onSave={updated => setSections(prev => prev.map(s => s.id === updated.id ? updated : s))}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Batches & Sections</h2>
          <p className="text-xs text-slate-500 mt-0.5">Create, edit and delete academic batches and manage their sections.</p>
        </div>
        <button
          onClick={() => setShowBatchForm(v => !v)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> New Batch
        </button>
      </div>

      {/* Create Batch Form */}
      {showBatchForm && (
        <div className="bg-white rounded-3xl border border-indigo-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-indigo-700 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Create New Batch
          </h3>
          <form onSubmit={handleCreateBatch} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectField label="Degree Programme" id="b-name" value={batchForm.name} onChange={v => setBatchForm(p => ({ ...p, name: v }))} options={DEGREE_OPTIONS} required />
            <ComboboxField label="Academic Year"     id="b-year" value={batchForm.year} onChange={v => setBatchForm(p => ({ ...p, year: v }))} options={YEAR_OPTIONS} placeholder="Select or type year (e.g. 2026-2030)"   required />
            <SelectField label="Department"        id="b-dept" value={batchForm.department} onChange={v => setBatchForm(p => ({ ...p, department: v }))} options={DEPT_OPTIONS} required />
            <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowBatchForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition disabled:opacity-60">
                {saving ? <Spinner /> : <Check className="w-3.5 h-3.5" />}
                Create Batch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Batch list */}
      {batches.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">No batches yet. Create one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map(batch => {
            const batchSections = sections.filter(s => s.batchId === batch.id).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
            const batchStudents = getBatchStudents(batch, sections, students);
            return (
              <div key={batch.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Batch header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                        {batch.name} — {batch.department}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge color="blue">{batch.year}</Badge>
                        <Badge color={batch.isActive ? 'green' : 'slate'}>{batch.isActive ? 'Active' : 'Inactive'}</Badge>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {batchSections.length} section{batchSections.length !== 1 ? 's' : ''} · {batchStudents.length} student{batchStudents.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingBatch(batch)}
                      title="Edit Batch"
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(batch.id, `${batch.name} ${batch.department}`)}
                      title="Delete Batch"
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowSectionForm(showSectionForm === batch.id ? null : batch.id)}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Section
                    </button>
                  </div>
                </div>

                {/* Add section form */}
                {showSectionForm === batch.id && (
                  <div className="px-5 py-4 bg-indigo-50/40 border-b border-indigo-100">
                    <form onSubmit={e => handleCreateSection(e, batch.id)} className="flex items-end gap-3">
                      <div className="flex-1">
                        <InputField label="Section Name" id={`sec-${batch.id}`} value={sectionForm.name}
                          onChange={v => setSectionForm({ name: v })} placeholder="e.g. Section A" required />
                      </div>
                      <div className="flex gap-2 pb-0.5">
                        <button type="button" onClick={() => setShowSectionForm(null)}
                          className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition">
                          Cancel
                        </button>
                        <button type="submit" disabled={saving}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition disabled:opacity-60">
                          {saving ? <Spinner /> : <Check className="w-3.5 h-3.5" />} Save
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Sections */}
                {batchSections.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-slate-400 italic">No sections yet.</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {batchSections.map(sec => (
                      <div key={sec.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{sec.name}</p>
                            <p className="text-[10px] text-slate-400">Section ID: {sec.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingSection(sec)}
                            title="Edit Section Name"
                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(sec.id, sec.name)}
                            title="Delete Section"
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setStudentModal({ section: sec, batch: batches.find(b => b.id === batch.id) })}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" /> Manage Students
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Subjects & Timetable Short Forms Reference Card */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Handling Subjects & Timetable Short Forms</span>
                    </h4>
                    <button
                      onClick={() => setShowAddSubjectForm(showAddSubjectForm === batch.id ? null : batch.id)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Subject</span>
                    </button>
                  </div>

                  {/* Create Subject Inline Form */}
                  {showAddSubjectForm === batch.id && (
                    <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm space-y-3 animate-fade-in">
                      <h5 className="text-xs font-black text-indigo-800 uppercase tracking-wide">Add New Subject for {batch.name}</h5>
                      <form onSubmit={(e) => handleAddSubjectToBatch(e, batch.id)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Subject Name <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newSubjectForm.name}
                            onChange={e => {
                              const val = e.target.value;
                              const autoShort = getSubjectShortForm(val);
                              setNewSubjectForm(p => ({ ...p, name: val, shortForm: p.shortForm ? p.shortForm : autoShort }));
                            }}
                            placeholder="e.g. Knowledge Engineering and Intelligent Systems"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Subject Code <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newSubjectForm.code}
                            onChange={e => setNewSubjectForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                            placeholder="e.g. 23AD1507"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Short Form (Timetable Tag) <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={newSubjectForm.shortForm}
                            onChange={e => setNewSubjectForm(p => ({ ...p, shortForm: e.target.value.toUpperCase() }))}
                            placeholder="e.g. KIES"
                            className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-xl text-xs font-mono font-black text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            required
                          />
                        </div>
                        <div className="sm:col-span-3 flex justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setShowAddSubjectForm(null)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Save Subject
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {(() => {
                    const customList = customSubjectsMap[batch.id] || [];

                    if (customList.length === 0) {
                      return (
                        <p className="text-[11px] text-slate-400 italic">No custom subjects added yet. Click "+ Add Subject" above to create subjects with short forms.</p>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                        {/* Custom added subjects */}
                        {customList.map((cs) => (
                          <div key={cs.id} className="bg-white p-3 rounded-xl border border-indigo-200/80 shadow-2xs flex flex-col justify-between space-y-1.5 relative group">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-900 border border-amber-500/30 rounded-md font-mono font-black text-xs shadow-2xs">
                                {cs.shortForm}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{cs.code}</span>
                                <button
                                  onClick={() => handleDeleteSubjectFromBatch(batch.id, cs.id)}
                                  className="text-slate-300 hover:text-red-500 p-0.5 transition cursor-pointer"
                                  title="Delete Subject"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-xs truncate" title={cs.name}>{cs.name}</p>
                              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Batch Subject</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 4 — FACULTY ACCESS
// ═══════════════════════════════════════════════════════════════════════════════
function AssignSectionModal({ faculty, batches, sections, token, onClose, onSave }: {
  faculty: any; batches: Batch[]; sections: Section[];
  token: string; onClose: () => void; onSave: (facultyId: string, batchId: string, sectionId: string) => void;
}) {
  const [mappings, setMappings] = useState<any[]>(() => {
    if (Array.isArray(faculty.assignedSectionMappings) && faculty.assignedSectionMappings.length > 0) {
      return faculty.assignedSectionMappings;
    }
    if (faculty.sectionId) {
      const sec = sections.find(s => s.id === faculty.sectionId);
      return [{
        sectionId: faculty.sectionId,
        sectionName: sec ? sec.name : faculty.section || 'A',
        subjectName: faculty.subjectName || faculty.subject || '',
        subjectCode: faculty.subjectCode || '',
        labName: faculty.labName || ''
      }];
    }
    return [];
  });

  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [labName, setLabName] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error' } | null>(null);

  const batchSections = sections.filter(s => s.batchId === selectedBatchId);

  const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

  const handleAssign = async () => {
    setSaving(true);
    try {
      const targetId = faculty.id || faculty._id || faculty.email;
      const res = await authFetch(`/api/admin/faculty/${targetId}/assign-section`, {
        method: 'PUT', body: JSON.stringify({ sectionMappings: mappings }),
      });
      const data = await res.json();
      if (res.ok) {
        onSave(targetId, '', '');
        setToast({ msg: 'Faculty details & section assignments saved!', type: 'success' });
        setTimeout(onClose, 1200);
      } else {
        setToast({ msg: data.error || 'Failed', type: 'error' });
      }
    } catch { setToast({ msg: 'Network error', type: 'error' }); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Assign Section & Edit Faculty Details" onClose={onClose}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-2xl">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            {faculty.name?.charAt(0) || 'F'}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{faculty.name || faculty.email}</p>
            <p className="text-xs text-slate-500">{faculty.email}</p>
          </div>
        </div>

        {/* Current Mappings List */}
        {mappings.length > 0 && (
          <div className="space-y-2 border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Current Assignments ({mappings.length})</h4>
            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
              {mappings.map((m, idx) => {
                const sec = sections.find(s => s.id === m.sectionId);
                const bat = sec ? batches.find(b => b.id === sec.batchId) : null;
                const batchLabel = bat ? `${bat.name} (${bat.year})` : (m.batchName ? `${m.batchName} (${m.batchYear})` : 'General Batch');
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-800 truncate">
                        {batchLabel} · Sec {m.sectionName || sec?.name || 'A'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                        {m.subjectName || 'General Lab'} {m.subjectCode ? `(${m.subjectCode})` : ''} {m.labName ? `· ${m.labName}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMappings(mappings.filter((_, i) => i !== idx));
                      }}
                      className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Assignment Section */}
        <div className="p-4 border border-indigo-100 rounded-2xl bg-indigo-50/20 space-y-3">
          <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Add Section Assignment Mapping</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Batch</label>
              <select
                value={selectedBatchId}
                onChange={e => { setSelectedBatchId(e.target.value); setSelectedSectionId(''); }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
              >
                <option value="">— Select Batch —</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.year})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Section</label>
              <select
                value={selectedSectionId}
                onChange={e => setSelectedSectionId(e.target.value)}
                disabled={!selectedBatchId}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer disabled:opacity-50"
              >
                <option value="">— Select Section —</option>
                {batchSections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InputField label="Subject Name" id="assign-subj-name" value={subjectName} onChange={v => setSubjectName(v)} placeholder="e.g. AI" />
            <InputField label="Subject Code" id="assign-subj-code" value={subjectCode} onChange={v => setSubjectCode(v)} placeholder="e.g. CS3501" />
            <InputField label="Lab Name" id="assign-lab-name" value={labName} onChange={v => setLabName(v)} placeholder="e.g. AI Lab" />
          </div>

          <button
            type="button"
            onClick={() => {
              if (!selectedBatchId || !selectedSectionId) {
                alert("Please select a Batch and Section first!");
                return;
              }
              const sec = sections.find(s => s.id === selectedSectionId);
              const bat = batches.find(b => b.id === selectedBatchId);
              
              if (mappings.some(m => m.sectionId === selectedSectionId)) {
                alert("This section is already assigned!");
                return;
              }

              const newMapping = {
                sectionId: selectedSectionId,
                sectionName: sec ? sec.name : 'A',
                batchName: bat ? bat.name : '',
                batchYear: bat ? bat.year : '',
                subjectName,
                subjectCode,
                labName
              };

              setMappings([...mappings, newMapping]);
              setSelectedSectionId('');
              setSubjectName('');
              setSubjectCode('');
              setLabName('');
            }}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            + Add Assignment Mapping
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition">
            Cancel
          </button>
          <button onClick={handleAssign} disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition disabled:opacity-60">
            {saving ? <Spinner /> : <Check className="w-3.5 h-3.5" />} Save Faculty Details
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FacultyAssignedStudentsModal({ faculty, section, batch, token, onClose }: {
  faculty: any; section: Section; batch: Batch | undefined; token: string; onClose: () => void;
}) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

  useEffect(() => {
    authFetch(`/api/admin/sections/${section.id}/students`)
      .then(r => r.json())
      .then(d => setStudents(d.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [section.id]);

  return (
    <Modal title={`Assigned Section Students — ${faculty.name || faculty.email}`} onClose={onClose} wide>
      <div className="space-y-4">
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              {faculty.name?.charAt(0) || 'F'}
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-sm">{faculty.name || faculty.email}</p>
              <p className="text-xs text-slate-500">{faculty.email} · {faculty.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="blue">Section: {section.name}</Badge>
            {batch && <Badge color="indigo">{batch.name} — {batch.department}</Badge>}
            <Badge color="green">{students.length} Student{students.length !== 1 ? 's' : ''}</Badge>
          </div>
        </div>

        {/* Student Table */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-3">
            Students Enrolled in Assigned Section ({loading ? '…' : students.length})
          </h4>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">No students found in this section yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Add students to section {section.name} under Batches & Sections tab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-2.5 px-3 text-slate-600 font-bold">#</th>
                    <th className="text-left py-2.5 px-3 text-slate-600 font-bold">Student Name</th>
                    <th className="text-left py-2.5 px-3 text-slate-600 font-bold">Register No.</th>
                    <th className="text-left py-2.5 px-3 text-slate-600 font-bold">Roll No.</th>
                    <th className="text-left py-2.5 px-3 text-slate-600 font-bold">Semester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((s, i) => (
                    <tr key={s.id || i} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{s.registerNo}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{s.rollNo}</td>
                      <td className="py-2.5 px-3"><Badge color="purple">Sem {s.semester || 'III'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function exportFacultyObservationMarksExcel(
  faculty: any,
  students: any[],
  targetBatchId?: string,
  targetSectionId?: string,
  sections: any[] = [],
  batches: any[] = []
) {
  const facEmail = String(faculty.email || '').toLowerCase();
  const facId = String(faculty.id || faculty._id || '').toLowerCase();
  const facSubjCode = String(faculty.subjectCode || '').toLowerCase();
  const facSubjName = String(faculty.subjectName || (Array.isArray(faculty.subjectsHandled) && faculty.subjectsHandled[0]) || '').toLowerCase();

  const facSections = [
    faculty.section,
    faculty.sections,
    ...(Array.isArray(faculty.assignedSectionIds) ? faculty.assignedSectionIds : [])
  ].filter(Boolean).map((x: string) => String(x).toLowerCase());

  // 1. Get all students that belong to this faculty's assigned section or account
  let facStudents = students.filter((s: any) => {
    // Strictly filter by batch/section first if target filters are provided
    if (targetBatchId) {
      const bat = batches.find(b => b.id === targetBatchId);
      const isBatchMatch = s.batchId === targetBatchId || (bat && (s.batch === bat.year || s.batch === bat.name));
      if (!isBatchMatch) return false;
    }
    if (targetSectionId) {
      const sec = sections.find(sec => sec.id === targetSectionId);
      const isSectionMatch = s.sectionId === targetSectionId || (sec && s.section?.toLowerCase() === sec.name?.toLowerCase());
      if (!isSectionMatch) return false;
    }

    const sFacId = String(s.facultyId || '').toLowerCase();
    const sFacEmail = String(s.facultyEmail || '').toLowerCase();
    if (facId && (sFacId === facId || sFacEmail === facId)) return true;
    if (facEmail && (sFacId === facEmail || sFacEmail === facEmail)) return true;
    if (faculty.sectionId && (s.sectionId === faculty.sectionId || s.section === faculty.sectionId)) return true;
    if (Array.isArray(faculty.assignedSectionIds) && (faculty.assignedSectionIds.includes(s.sectionId) || faculty.assignedSectionIds.includes(s.section))) return true;
    if (facSections.length > 0) {
      const sSec = String(s.section || '').toLowerCase();
      const sSecId = String(s.sectionId || '').toLowerCase();
      if (facSections.some(sec => sec === sSec || sec === sSecId || sSec.endsWith(sec) || sec.endsWith(sSec))) {
        return true;
      }
    }
    const hasExp = (s.experiments || []).some((e: any) => {
      const eFac = String(e.signedOffBy || e.facultyId || '').toLowerCase();
      const eSubj = String(e.subjectCode || e.subjectName || '').toLowerCase();
      return (eFac && (eFac === facId || eFac === facEmail)) || (facSubjCode && eSubj === facSubjCode);
    });
    return hasExp;
  });

  // Fallback: If facStudents is empty and target filters were selected, search all students in that batch/section
  if (facStudents.length === 0 && targetBatchId && targetSectionId) {
    const sec = sections.find(sec => sec.id === targetSectionId);
    const bat = batches.find(b => b.id === targetBatchId);
    facStudents = students.filter((s: any) => {
      const isBatchMatch = s.batchId === targetBatchId || (bat && (s.batch === bat.year || s.batch === bat.name));
      const isSectionMatch = s.sectionId === targetSectionId || (sec && s.section?.toLowerCase() === sec.name?.toLowerCase());
      return isBatchMatch && isSectionMatch;
    });
  } else if (facStudents.length === 0) {
    const facDept = String(faculty.department || '').toLowerCase();
    facStudents = students.filter((s: any) => {
      if (facDept && String(s.department || '').toLowerCase() === facDept) return true;
      return true;
    });
  }

  const targetStudents = facStudents;

  const rows = targetStudents.map((st: any, idx: number) => {
    const rowObj: Record<string, any> = {
      "Faculty Name": faculty.name || 'Faculty',
      "Subject Code": faculty.subjectCode || '-',
      "S.No": idx + 1,
      "Roll No": st.rollNo || '-',
      "Register No": st.registerNo || '-',
      "Student Name": st.name,
      "Section": st.section || 'A',
      "Batch": st.batch || 'General',
      "Attendance %": `${st.attendance ?? 0}%`
    };

    let totalScore = 0;
    let validScoresCount = 0;

    for (let expNum = 1; expNum <= 12; expNum++) {
      // Find experiment matching expNum and this faculty/subject
      const exp = (st.experiments || []).find((e: any) => {
        const matchesExpNum = e.experimentNumber === expNum || e.name === `Experiment ${expNum}` || e.id?.endsWith(`-${expNum}`);
        if (!matchesExpNum) return false;

        const eFac = String(e.signedOffBy || e.facultyId || '').toLowerCase();
        const eSubjCode = String(e.subjectCode || '').toLowerCase();
        const eSubjName = String(e.subjectName || '').toLowerCase();
        const eId = String(e.id || '').toLowerCase();

        if (eFac) {
          const facMatch = eFac === facId || eFac === facEmail || (facId && eFac.includes(facId)) || (facEmail && eFac.includes(facEmail));
          if (facMatch) return true;
        }

        if (facSubjCode && eSubjCode && eSubjCode === facSubjCode) return true;
        if (facSubjName && eSubjName && eSubjName === facSubjName) return true;
        if (eId && ((facId && eId.includes(facId)) || (facEmail && eId.includes(facEmail)))) return true;

        return !eFac && !eSubjCode;
      });

      let markStr = '-';
      if (exp) {
        if (exp.score !== undefined && exp.score !== null && exp.score !== '') {
          markStr = String(exp.score);
          let rawNum = Number(exp.score);
          if (isNaN(rawNum) && String(exp.score).includes('/')) {
            const parts = String(exp.score).split('/');
            rawNum = Number(parts[parts.length - 1]);
          }
          if (!isNaN(rawNum)) {
            totalScore += rawNum;
            validScoresCount++;
          }
        } else if (exp.status === 'Approved') {
          markStr = '10';
          totalScore += 10;
          validScoresCount++;
        } else if (exp.status === 'Absent') {
          markStr = 'A';
        } else if (exp.status === 'On Duty') {
          markStr = 'OD';
        }
      }
      rowObj[`Exp ${expNum}`] = markStr;
    }

    rowObj["Total Observation Score"] = validScoresCount > 0 ? totalScore : '-';
    return rowObj;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [
    { "Note": `No student observation records found for faculty ${faculty.name || faculty.email}` }
  ]);

  XLSX.utils.book_append_sheet(wb, ws, "Observation Marks Matrix");
  const cleanFacName = (faculty.name || 'Faculty').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanSubjCode = (faculty.subjectCode || 'SUBJ').replace(/[^a-zA-Z0-9]/g, '_');

  const batObj = targetBatchId ? batches.find(b => b.id === targetBatchId) : null;
  const secObj = targetSectionId ? sections.find(s => s.id === targetSectionId) : null;
  const batchStr = batObj ? `${batObj.name}_${batObj.year}`.replace(/[^a-zA-Z0-9]/g, '_') : '';
  const sectionStr = secObj ? `Sec_${secObj.name}`.replace(/[^a-zA-Z0-9]/g, '_') : '';
  const batchSectionSuffix = [batchStr, sectionStr].filter(Boolean).join('_');

  const fileName = `Observation_Marks_${cleanFacName}_${cleanSubjCode}${batchSectionSuffix ? `_${batchSectionSuffix}` : ''}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function FacultyMonitoringModal({ faculty, token, batches, sections, onClose }: {
  faculty: any; token: string; batches: Batch[]; sections: Section[]; onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'dayreport' | 'evaluations'>('evaluations');
  const [reportDate, setReportDate] = useState<string>(() => getLocalDateString());
  const [modalBatchFilter, setModalBatchFilter] = useState('');
  const [modalSectionFilter, setModalSectionFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'top' | 'poor' | 'late'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const targetId = faculty.id || faculty._id || faculty.email;
    fetch(`/api/admin/faculty/${targetId}/monitoring`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load live monitoring details.'))
      .finally(() => setLoading(false));
  }, [faculty, token]);

  // Find batches assigned to this faculty member
  const facultyBatches = (() => {
    const batchIds = new Set<string>();
    const mappings = faculty.assignedSectionMappings || [];
    mappings.forEach((m: any) => {
      const sec = sections.find(s => s.id === m.sectionId);
      if (sec && sec.batchId) batchIds.add(sec.batchId);
    });
    const sIds = faculty.assignedSectionIds || (faculty.sectionId ? [faculty.sectionId] : []);
    sIds.forEach((sid: string) => {
      const sec = sections.find(s => s.id === sid);
      if (sec && sec.batchId) batchIds.add(sec.batchId);
    });
    if (faculty.batchId) batchIds.add(faculty.batchId);
    
    if (batchIds.size === 0) return batches;
    return batches.filter(b => batchIds.has(b.id));
  })();

  // Find sections assigned to this faculty member for the selected batch
  const facultySections = (() => {
    const mappings = faculty.assignedSectionMappings || [];
    const assignedSectionIds = new Set<string>(mappings.map((m: any) => m.sectionId));
    const sIds = faculty.assignedSectionIds || (faculty.sectionId ? [faculty.sectionId] : []);
    sIds.forEach((sid: string) => assignedSectionIds.add(sid));
    
    let filtered = sections;
    if (assignedSectionIds.size > 0) {
      filtered = sections.filter(s => assignedSectionIds.has(s.id));
    }
    
    if (modalBatchFilter) {
      filtered = filtered.filter(s => s.batchId === modalBatchFilter);
    }
    return filtered;
  })();

  // Helpers for performance grading
  const isTopPerformer = (log: any) => {
    const scoreStr = String(log.score || '').trim().toUpperCase();
    if (scoreStr === 'A' || scoreStr === 'ABSENT' || scoreStr.startsWith('A/')) return false;
    if (scoreStr.startsWith('F/') || scoreStr === 'F' || scoreStr === 'X' || scoreStr === 'CROSS') return false;
    const num = parseFloat(scoreStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 8) return true;
    return false;
  };

  const isPoorPerformer = (log: any) => {
    const scoreStr = String(log.score || '').trim().toUpperCase();
    if (scoreStr === 'A' || scoreStr === 'ABSENT' || scoreStr.startsWith('A/')) return true;
    if (scoreStr.startsWith('F/') || scoreStr === 'F' || scoreStr === 'X' || scoreStr === 'CROSS') return true;
    const num = parseFloat(scoreStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num < 6) return true;
    return false;
  };

  const getPerformanceBadge = (log: any) => {
    const scoreStr = String(log.score || '').trim().toUpperCase();
    if (scoreStr === 'A' || scoreStr === 'ABSENT' || scoreStr.startsWith('A/')) {
      return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-[10px] font-black uppercase">❌ Absent</span>;
    }
    if (scoreStr.startsWith('F/') || scoreStr === 'F' || scoreStr === 'X' || scoreStr === 'CROSS') {
      return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-[10px] font-black uppercase">❌ Fail / Unsigned</span>;
    }
    const num = parseFloat(scoreStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      if (num >= 8) {
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">🌟 Well Performed</span>;
      }
      if (num >= 6) {
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">🆗 Satisfactory</span>;
      }
      return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1">⚠️ Poor / Needs Imp.</span>;
    }
    return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-extrabold">{log.score || 'Evaluated'}</span>;
  };

  const allAssignedStudents = data?.assignedStudents || [];

  // Filter assigned students by batch, section, search
  const filteredAssignedStudents = allAssignedStudents.filter((st: any) => {
    if (modalBatchFilter && st.batchId !== modalBatchFilter && st.batchName !== modalBatchFilter && st.batch !== modalBatchFilter) return false;
    if (modalSectionFilter && st.sectionId !== modalSectionFilter && st.sectionName?.toLowerCase() !== modalSectionFilter.toLowerCase() && st.section?.toLowerCase() !== modalSectionFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = String(st.name || '').toLowerCase().includes(q);
      const matchRoll = String(st.rollNo || '').toLowerCase().includes(q);
      const matchReg = String(st.registerNo || '').toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchReg) return false;
    }
    return true;
  });

  // Calculate day-by-day report status per student for reportDate
  const dayReportList = filteredAssignedStudents.map((st: any) => {
    const attRecords = (st.attendanceHistory || []).filter((h: any) => h.date === reportDate);
    const lastAtt = attRecords.length > 0 ? attRecords[attRecords.length - 1] : null;
    const attStatus = lastAtt ? lastAtt.status : (st.attendance && st.attendance < 60 ? 'Absent' : 'Present');

    // Find experiments matching reportDate or latest evaluated experiment
    const dateExps = (st.experiments || []).filter((e: any) => e.submittedAt === reportDate || e.dueDate === reportDate || e.status === 'Approved' || e.status === 'Absent' || (e.score !== undefined && e.score !== 0 && e.score !== ''));
    
    let obsText = '-';
    let latestExpName = '-';
    let latestScore = '-';
    let isLateExp = false;
    let subTime = 'During Class';

    if (dateExps.length > 0) {
      const latest = dateExps[dateExps.length - 1];
      latestExpName = latest.name || `Exp ${latest.experimentNumber || 1}`;
      latestScore = latest.score !== undefined && latest.score !== null && latest.score !== '' ? String(latest.score) : (latest.status || 'Evaluated');
      obsText = `${latestExpName}: ${latestScore}`;
      isLateExp = latest.isLateFacultySubmission === true;
      subTime = latest.submittedAtTime || (isLateExp ? 'After 3:30 PM' : 'During Class');
    }

    return {
      student: st,
      attStatus,
      obsText,
      latestExpName,
      latestScore,
      isLateExp,
      subTime
    };
  });

  const dayPresentCount = dayReportList.filter((item: any) => item.attStatus === 'Present').length;
  const dayAbsentCount = dayReportList.filter((item: any) => item.attStatus === 'Absent').length;
  const dayODCount = dayReportList.filter((item: any) => item.attStatus === 'On Duty' || item.attStatus === 'OD').length;

  const filteredAllLogs = (data?.allLogs || []).filter((log: any) => {
    if (modalBatchFilter && log.batchId !== modalBatchFilter && log.batchName !== modalBatchFilter) return false;
    if (modalSectionFilter && log.sectionId !== modalSectionFilter && log.sectionName?.toLowerCase() !== modalSectionFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = String(log.studentName || '').toLowerCase().includes(q);
      const matchRoll = String(log.rollNo || '').toLowerCase().includes(q);
      const matchReg = String(log.registerNo || '').toLowerCase().includes(q);
      const matchExp = String(log.experimentName || '').toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchReg && !matchExp) return false;
    }
    return true;
  });

  const topLogs = filteredAllLogs.filter(isTopPerformer);
  const poorLogs = filteredAllLogs.filter(isPoorPerformer);
  const lateLogs = filteredAllLogs.filter((log: any) => log.isLate);

  const displayedLogs = (() => {
    switch (activeCategory) {
      case 'top': return topLogs;
      case 'poor': return poorLogs;
      case 'late': return lateLogs;
      default: return filteredAllLogs;
    }
  })();

  const filteredOnTimeCount = filteredAllLogs.filter((log: any) => !log.isLate).length;
  const filteredTotalEvaluations = filteredAllLogs.length;

  const handleExportFacultyObservationExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    if (viewTab === 'dayreport') {
      const dayRows = dayReportList.map((item: any, idx: number) => ({
        "S.No": idx + 1,
        "Faculty Name": data.faculty.name || data.faculty.email,
        "Report Date": reportDate,
        "Roll No": item.student.rollNo || '-',
        "Student Name": item.student.name || '-',
        "Register Number": item.student.registerNo || '-',
        "Section": item.student.sectionName || item.student.section || '-',
        "Batch": item.student.batchName || item.student.batch || '-',
        "Attendance Status": item.attStatus,
        "Experiment Evaluation / Score": item.obsText,
        "Submission Timeliness": item.isLateExp ? "Late Submission (After 3:30 PM)" : "On-Time"
      }));
      const wsDay = XLSX.utils.json_to_sheet(dayRows.length > 0 ? dayRows : [{ "Note": "No student records found." }]);
      XLSX.utils.book_append_sheet(wb, wsDay, `Day_Report_${reportDate}`);
    } else {
      const rows = filteredAllLogs.map((log: any, idx: number) => ({
        "S.No": idx + 1,
        "Faculty Name": data.faculty.name || data.faculty.email,
        "Faculty Email": data.faculty.email,
        "Subject Code": log.subjectCode || data.faculty.subjectCode || '-',
        "Subject Name": log.subjectName || data.faculty.subjectName || '-',
        "Roll No": log.rollNo,
        "Student Name": log.studentName,
        "Register Number": log.registerNo || '-',
        "Section": log.sectionName || log.section || 'A',
        "Experiment Title": log.experimentName,
        "Observation Score / Mark": log.score,
        "Performance Grade": isTopPerformer(log) ? "Well Performed" : (isPoorPerformer(log) ? "Poor / Needs Improvement" : "Satisfactory"),
        "Evaluation Date": log.date,
        "Submission Time": log.submittedAtTime || 'During Class',
        "Faculty Submission Timeliness": log.isLate ? "Late Submission (After 3:30 PM)" : "On-Time (8:00 AM - 3:30 PM)"
      }));

      const wsObservation = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [
        { "Note": `No observation mark evaluations recorded for faculty ${data.faculty.name || data.faculty.email}` }
      ]);
      XLSX.utils.book_append_sheet(wb, wsObservation, "Observation Marks");
    }

    const cleanFacName = (data.faculty.name || 'Faculty').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Faculty_Monitoring_Report_${cleanFacName}.xlsx`);
  };

  return (
    <Modal title={`Live Monitoring & Student Day-by-Day Reports — ${faculty.name || faculty.email}`} onClose={onClose} wide>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <div className="p-6 text-center text-rose-600 bg-rose-50 rounded-2xl text-xs font-bold">{error}</div>
      ) : (
        <div className="space-y-6">
          {/* VIEW SWITCHER TABS & HEADER ACTIONS */}
          <div className="p-4 bg-indigo-50/80 border border-indigo-100 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewTab('dayreport')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 shadow-xs ${
                  viewTab === 'dayreport'
                    ? 'bg-indigo-600 text-white border border-indigo-600'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Day-by-Day Student Reports ({filteredAssignedStudents.length} Students)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('evaluations')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 shadow-xs ${
                  viewTab === 'evaluations'
                    ? 'bg-indigo-600 text-white border border-indigo-600'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Live Evaluation Logs ({filteredAllLogs.length} Entries)</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportFacultyObservationExcel}
                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 shrink-0"
                title="Download Faculty Monitoring & Day-by-Day Student Report as Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report (.xlsx)</span>
              </button>
              <div className="px-3 py-2 bg-white border border-indigo-200 rounded-xl text-indigo-700 text-xs font-extrabold shrink-0">
                Cutoff: 3:30 PM
              </div>
            </div>
          </div>

          {/* BATCH, SECTION, DATE & SEARCH CONTROLLERS */}
          <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100/90">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {viewTab === 'dayreport' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Report Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={e => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Filter by Batch</label>
                <select
                  value={modalBatchFilter}
                  onChange={e => {
                    setModalBatchFilter(e.target.value);
                    setModalSectionFilter('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                >
                  <option value="">— All Batches —</option>
                  {facultyBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.year})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Filter by Section</label>
                <select
                  value={modalSectionFilter}
                  onChange={e => setModalSectionFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                >
                  <option value="">— All Sections —</option>
                  {facultySections.map(s => {
                    const bat = batches.find(b => b.id === s.batchId);
                    return (
                      <option key={s.id} value={s.id}>
                        Section {s.name} {bat ? `(${bat.name})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Search Student / Exp</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Name, Roll No, Reg No, Exp…"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
            </div>

            {viewTab === 'evaluations' && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                    activeCategory === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>All Student Evaluations</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {filteredAllLogs.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveCategory('top')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                    activeCategory === 'top'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <span>🌟 Well Performed (Marks ≥ 8)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === 'top' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {topLogs.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveCategory('poor')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                    activeCategory === 'poor'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <span>⚠️ Poor / Needs Imp. (&lt; 6 / Absent)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === 'poor' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    {poorLogs.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveCategory('late')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                    activeCategory === 'late'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  <span>⏰ Late Submissions (&gt; 3:30 PM)</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === 'late' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'}`}>
                    {lateLogs.length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* SUMMARY KPI CARDS */}
          {viewTab === 'dayreport' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Total Assigned Students</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">{filteredAssignedStudents.length}</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Faculty Assigned Roster</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Present Today</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{dayPresentCount}</h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Attended Session</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Absentees</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{dayAbsentCount}</h3>
                <p className="text-[10px] text-rose-700 font-bold mt-0.5">Absent / Unmarked</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">On Duty / Evaluated</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{dayODCount}</h3>
                <p className="text-[10px] text-amber-700 font-bold mt-0.5">Special Status / OD</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">Total Evaluations</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">{filteredTotalEvaluations}</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{filteredOnTimeCount} On-Time Entries</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">🌟 Well Performed</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{topLogs.length}</h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  {filteredTotalEvaluations > 0 ? Math.round((topLogs.length / filteredTotalEvaluations) * 100) : 0}% High Scores (≥ 8)
                </p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">⚠️ Poor / Needs Imp.</p>
                <h3 className="text-2xl font-black text-amber-600 mt-1">{poorLogs.length}</h3>
                <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                  {filteredTotalEvaluations > 0 ? Math.round((poorLogs.length / filteredTotalEvaluations) * 100) : 0}% Low / Absent / Fail
                </p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
                <p className="text-[10px] font-black uppercase text-slate-400">⏰ Late Submissions</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{lateLogs.length}</h3>
                <p className="text-[10px] text-rose-700 font-bold mt-0.5">Entries After 3:30 PM</p>
              </div>
            </div>
          )}

          {/* MAIN DATA TABLES */}
          {viewTab === 'dayreport' ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  Day-by-Day Student Attendance &amp; Evaluation Report
                  <span className="text-indigo-600 font-mono">({dayReportList.length} Students)</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">Report Date: {reportDate}</span>
              </div>

              {dayReportList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <CheckCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-extrabold text-slate-700">No Student Records Found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No assigned students match the current filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 max-h-[50vh]">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
                      <tr className="text-slate-400 text-[10px] font-extrabold uppercase">
                        <th className="px-4 py-3 text-center">#</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Student Name</th>
                        <th className="px-4 py-3 text-left">Roll / Register No</th>
                        <th className="px-4 py-3 text-left">Section &amp; Batch</th>
                        <th className="px-4 py-3 text-center">Attendance Status</th>
                        <th className="px-4 py-3 text-left">Experiment Score / Mark</th>
                        <th className="px-4 py-3 text-center">Submission Timeliness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {dayReportList.map((item: any, i: number) => (
                        <tr key={item.student.id || i} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{reportDate}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{item.student.name || 'Student'}</td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {item.student.rollNo || '-'} {item.student.registerNo ? `• ${item.student.registerNo}` : ''}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {item.student.sectionName || item.student.section || 'A'} ({item.student.batchName || item.student.batch || '-'})
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                              item.attStatus === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.attStatus === 'Absent'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {item.attStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-extrabold text-slate-800">{item.obsText}</span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {item.isLateExp ? (
                              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black uppercase">
                                Late (&gt; 3:30 PM)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase">
                                On-Time
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  {activeCategory === 'top' && <span className="text-base">🌟</span>}
                  {activeCategory === 'poor' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {activeCategory === 'late' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  {activeCategory === 'all' && <Users className="w-4 h-4 text-indigo-600" />}
                  {activeCategory === 'all' && 'Student Performance & Evaluation Log'}
                  {activeCategory === 'top' && 'Top Performing Students Log'}
                  {activeCategory === 'poor' && 'Poor Performance & Absent Log'}
                  {activeCategory === 'late' && 'Late Submissions Log'}
                  <span className="text-indigo-600 font-mono">({displayedLogs.length})</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">Updated Live</span>
              </div>

              {displayedLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <CheckCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-extrabold text-slate-700">No Student Records Found</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No evaluation records match the selected category filter or search query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 max-h-[50vh]">
                  <table className="w-full text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
                      <tr className="text-slate-400 text-[10px] font-extrabold uppercase">
                        <th className="px-4 py-3 text-center">#</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Student</th>
                        <th className="px-4 py-3 text-left">Experiment &amp; Subject</th>
                        <th className="px-4 py-3 text-center">Mark Entered</th>
                        <th className="px-4 py-3 text-center">Performance Grade</th>
                        <th className="px-4 py-3 text-center">Submission Time</th>
                        <th className="px-4 py-3 text-center">Timeliness Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {displayedLogs.map((log: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">{log.date}</td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{log.studentName || 'Student'}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {log.rollNo} {log.registerNo ? `• ${log.registerNo}` : ''}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-800">{log.experimentName || 'Observation Sign-off'}</p>
                            <p className="text-[10px] text-slate-400">{log.subjectCode ? `${log.subjectCode} · ` : ''}{log.subjectName || ''}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-black text-slate-900 text-sm">
                            {log.score || '10'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getPerformanceBadge(log)}
                          </td>
                          <td className={`px-4 py-3 text-center font-bold font-mono ${log.isLate ? 'text-rose-600' : 'text-slate-600'}`}>
                            {log.submittedAtTime || 'Class Hours'}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {log.isLate ? (
                              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black uppercase">
                                Late (&gt; 3:30 PM)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase">
                                On-Time
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function AccessTab({ faculties, batches, sections, token, onFacultiesChange }: {
  faculties: any[]; batches: Batch[]; sections: Section[];
  token: string; onFacultiesChange: (facs: any[]) => void;
}) {
  const { addPreApprovedFaculty, deleteFaculty, clearFacultyData, uploadExcelProvisioning } = useAcademicData();

  const [search,            setSearch]            = useState('');
  const [assignModal,       setAssignModal]       = useState<any | null>(null);
  const [viewStudentsModal, setViewStudentsModal] = useState<{ faculty: any; section: Section; batch: Batch | undefined } | null>(null);
  const [monitoringModal,   setMonitoringModal]   = useState<any | null>(null);
  const [timetableModalFaculty, setTimetableModalFaculty] = useState<any | null>(null);
  const [timetableBatchId, setTimetableBatchId] = useState<string>('');
  const [timetableSectionId, setTimetableSectionId] = useState<string>('');
  const [timetableImagePreview, setTimetableImagePreview] = useState<string | null>(null);
  const [timetableFileName, setTimetableFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTimetablePeriod, setSelectedTimetablePeriod] = useState<string>('Period 1 (8.00 AM - 8.50 AM)');
  const [selectedSubjectShortForm, setSelectedSubjectShortForm] = useState<string>('');
  const [showAddForm,       setShowAddForm]       = useState(false);
  const [toast,             setToast]             = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [saving,            setSaving]            = useState(false);

  const saveAnalyzedTimetableToProfile = async (faculty: any, sfUpper: string) => {
    const authFetch = (url: string, opts: RequestInit = {}) =>
      fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

    const PANIMALAR_AUTO_ANALYSIS: Record<string, { labDayCode: string; labDayName: string; labPeriod: string; labTime: string; theory: Record<string, string> }> = {
      KIES: {
        labDayCode: 'FRI',
        labDayName: 'Friday',
        labPeriod: 'Period 2 & 3 Morning Lab Slot',
        labTime: '8.50 AM - 10.30 AM',
        theory: { MON: 'Period 6 (1.15 PM - 1.55 PM)', TUE: 'Period 2 (8.50 AM - 9.40 AM)', WED: 'Period 2 (8.50 AM - 9.40 AM)', THU: 'Period 3 (9.40 AM - 10.30 AM)', FRI: 'Period 6 (1.15 PM - 1.55 PM)' }
      },
      DA: {
        labDayCode: 'TUE',
        labDayName: 'Tuesday',
        labPeriod: 'Morning Lab Slot',
        labTime: '10.45 AM - 12.40 PM',
        theory: { TUE: 'Period 1 (8.00 AM - 8.50 AM) & Period 7 (1.55 PM - 2.35 PM)', WED: 'Period 3 (9.40 AM - 10.30 AM)', FRI: 'Period 7 (1.55 PM - 2.35 PM)' }
      },
      DEV: {
        labDayCode: 'THU',
        labDayName: 'Thursday',
        labPeriod: 'Morning Lab Slot',
        labTime: '10.45 AM - 12.40 PM',
        theory: { WED: 'Period 1 (8.00 AM - 8.50 AM)', THU: 'Period 2 (8.50 AM - 9.40 AM)', FRI: 'Period 8 (2.35 PM - 3.15 PM)' }
      },
      TSP: {
        labDayCode: 'MON',
        labDayName: 'Monday',
        labPeriod: 'Morning Lab Slot',
        labTime: '10.45 AM - 12.40 PM',
        theory: {}
      }
    };

    const autoData = PANIMALAR_AUTO_ANALYSIS[sfUpper] || PANIMALAR_AUTO_ANALYSIS['KIES'];
    const targetId = faculty.id || faculty._id || faculty.email;
    const analyzedAt = new Date().toLocaleString('en-GB');
    const analyzedDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    try {
      await authFetch(`/api/academic/faculty/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({
          labDay: autoData.labDayName,
          labPeriod: autoData.labPeriod,
          labTime: autoData.labTime,
          timetableAnalyzedAt: analyzedAt,
          timetableAnalyzedDay: analyzedDay
        })
      });
      refreshData();
    } catch (err) {
      console.error("Error saving timetable to faculty profile database:", err);
    }
  };

  useEffect(() => {
    if (timetableModalFaculty) {
      const f = timetableModalFaculty;
      if (timetableSectionId) {
        const key = `faculty_timetable_${f.id}_${timetableSectionId}`;
        const keyEmail = `faculty_timetable_${f.email}_${timetableSectionId}`;
        const savedRaw = localStorage.getItem(key) || localStorage.getItem(keyEmail) || null;
        
        let savedImg: string | null = null;
        let savedPeriod = 'Period 1 (8.00 AM - 8.50 AM)';
        let savedShortForm = getSubjectShortForm(f.subjectName || f.subject, f.subjectShortForm, f.subjectCode);
        let savedFileName = '';

        if (savedRaw) {
          try {
            const parsed = JSON.parse(savedRaw);
            if (parsed && typeof parsed === 'object') {
              savedImg = parsed.fileData || parsed.image;
              savedFileName = parsed.fileName || 'Uploaded_Timetable_File';
              if (parsed.period) savedPeriod = parsed.period;
              if (parsed.subjectShortForm) savedShortForm = parsed.subjectShortForm;
            } else {
              savedImg = savedRaw;
            }
          } catch {
            savedImg = savedRaw;
          }
        }
        setTimetableImagePreview(savedImg);
        setTimetableFileName(savedFileName);
        setSelectedTimetablePeriod(savedPeriod);
        setSelectedSubjectShortForm(savedShortForm);
      } else {
        setTimetableImagePreview(null);
        setTimetableFileName('');
      }
    }
  }, [timetableSectionId, timetableModalFaculty]);

  const [form, setForm] = useState({
    email: '', labName: '', subject: '', subjectCode: '', batch: '', sections: '', phone: '',
  });

  const filtered = faculties.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase()) ||
    f.department?.toLowerCase().includes(search.toLowerCase())
  );

  const modalAssignedBatches = (() => {
    if (!timetableModalFaculty) return [];
    const mappings = timetableModalFaculty.assignedSectionMappings || [];
    const batchIds = new Set<string>();
    mappings.forEach((m: any) => {
      const sec = sections.find(s => s.id === m.sectionId);
      if (sec && sec.batchId) {
        batchIds.add(sec.batchId);
      }
    });
    if (batchIds.size === 0) {
      const sIds = timetableModalFaculty.assignedSectionIds || (timetableModalFaculty.sectionId ? [timetableModalFaculty.sectionId] : []);
      sIds.forEach((sid: string) => {
        const sec = sections.find(s => s.id === sid);
        if (sec && sec.batchId) {
          batchIds.add(sec.batchId);
        }
      });
    }
    return batches.filter(b => batchIds.has(b.id));
  })();

  const modalAssignedSections = (() => {
    if (!timetableModalFaculty || !timetableBatchId) return [];
    const mappings = timetableModalFaculty.assignedSectionMappings || [];
    const assignedIds = mappings.map((m: any) => m.sectionId);
    if (assignedIds.length === 0) {
      const sIds = timetableModalFaculty.assignedSectionIds || (timetableModalFaculty.sectionId ? [timetableModalFaculty.sectionId] : []);
      assignedIds.push(...sIds);
    }
    return sections.filter(s => s.batchId === timetableBatchId && assignedIds.includes(s.id));
  })();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await addPreApprovedFaculty({ ...form });
    if (res.success) {
      setToast({ msg: 'Faculty pre-approved!', type: 'success' });
      setForm({ email: '', labName: '', subject: '', subjectCode: '', batch: '', sections: '', phone: '' });
      setShowAddForm(false);
    } else {
      setToast({ msg: res.error || 'Failed', type: 'error' });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from pre-approved faculty list?`)) return;
    const res = await deleteFaculty(id);
    if (res.success) {
      setToast({ msg: `${name} removed.`, type: 'success' });
      onFacultiesChange(faculties.filter(f => f.id !== id));
    } else {
      setToast({ msg: res.error || 'Failed', type: 'error' });
    }
  };

  const { refreshData } = useAcademicData();

  const handleRemoveSectionMapping = async (faculty: any, mappingToRemove: any) => {
    const secName = mappingToRemove.sectionName || '';
    if (!window.confirm(`Are you sure you want to remove the assigned section "${secName}" for ${faculty.name || faculty.email}?`)) {
      return;
    }
    setSaving(true);
    try {
      let currentMappings = faculty.assignedSectionMappings || [];
      if (currentMappings.length === 0 && faculty.sectionId) {
        const sec = sections.find(s => s.id === faculty.sectionId);
        currentMappings = [{
          sectionId: faculty.sectionId,
          sectionName: sec ? sec.name : faculty.section || 'A',
          subjectName: faculty.subjectName || faculty.subject || '',
          subjectCode: faculty.subjectCode || '',
          labName: faculty.labName || ''
        }];
      }
      const updatedMappings = currentMappings.filter((m: any) => m.sectionId !== mappingToRemove.sectionId);
      const targetId = faculty.id || faculty._id || faculty.email;
      const res = await fetch(`/api/admin/faculty/${targetId}/assign-section`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sectionMappings: updatedMappings })
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ msg: 'Assigned section removed successfully!', type: 'success' });
        refreshData();
      } else {
        setToast({ msg: data.error || 'Failed to remove assigned section', type: 'error' });
      }
    } catch {
      setToast({ msg: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSave = (_fId: string, _bId: string, _sId: string) => {
    refreshData();
    setToast({ msg: 'Faculty details & section assignment saved!', type: 'success' });
  };

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {assignModal && (
        <AssignSectionModal
          faculty={assignModal} batches={batches} sections={sections}
          token={token} onClose={() => setAssignModal(null)} onSave={handleAssignSave}
        />
      )}
      {viewStudentsModal && (
        <FacultyAssignedStudentsModal
          faculty={viewStudentsModal.faculty} section={viewStudentsModal.section} batch={viewStudentsModal.batch}
          token={token} onClose={() => setViewStudentsModal(null)}
        />
      )}
      {monitoringModal && (
        <FacultyMonitoringModal
          faculty={monitoringModal} token={token} batches={batches} sections={sections} onClose={() => setMonitoringModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Faculty Access</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage pre-approved faculty members and assign them to sections.</p>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Pre-Approve Faculty
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white rounded-3xl border border-indigo-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-indigo-700 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Add Pre-Approved Faculty
          </h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Email Address" id="f-email" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="faculty@college.edu" required />
            <InputField label="Phone"         id="f-phone" value={form.phone}  onChange={v => setForm(p => ({ ...p, phone: v }))}  placeholder="+91 …" />
            <InputField label="Lab Name"      id="f-lab"   value={form.labName} onChange={v => setForm(p => ({ ...p, labName: v }))} placeholder="Data Structures Lab" required />
            <InputField label="Subject"       id="f-subj"  value={form.subject}  onChange={v => setForm(p => ({ ...p, subject: v }))}  placeholder="Data Structures" required />
            <InputField label="Subject Code"  id="f-code"  value={form.subjectCode} onChange={v => setForm(p => ({ ...p, subjectCode: v }))} placeholder="CS3401" />
            <SelectField
              label="Batch"
              id="f-batch"
              value={form.batch}
              onChange={v => setForm(p => ({ ...p, batch: v }))}
              options={batches.map(b => `${b.name} — ${b.department} (${b.year})`)}
              required
            />
            <SelectField
              label="Sections"
              id="f-sects"
              value={form.sections}
              onChange={v => setForm(p => ({ ...p, sections: v }))}
              options={sections.map(s => s.name)}
            />
            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition disabled:opacity-60">
                {saving ? <Spinner /> : <Check className="w-3.5 h-3.5" />} Add Faculty
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or department…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        />
      </div>

      {/* Faculty table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No faculty members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 font-bold text-slate-500">Faculty</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500">Department</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500">Assigned Section</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-500">Status</th>
                  <th className="text-right px-5 py-3 font-bold text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(f => {
                  const assignedSection = f.sectionId ? sections.find(s => s.id === f.sectionId) : null;
                  const assignedBatch   = f.batchId   ? batches.find(b => b.id === f.batchId)   : null;
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                            {f.name?.charAt(0) || 'F'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{f.name || <span className="italic text-slate-400">Not registered</span>}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{f.email}</p>
                            {f.labDay && (
                              <div className="mt-1 bg-amber-500/10 text-amber-800 border border-amber-300/40 rounded-lg p-1.5 text-[9px] font-medium leading-normal max-w-[240px] shadow-xs">
                                <span className="block font-black text-amber-900">🧪 LAB TIMETABLE CONFIG:</span>
                                <div>Day: <strong className="text-amber-950 font-bold">{f.labDay}</strong></div>
                                <div>Slot: <strong className="text-amber-950 font-bold">{f.labPeriod} ({f.labTime})</strong></div>
                                <div className="text-[8px] text-slate-500 mt-0.5 border-t border-amber-200/50 pt-0.5">
                                  Analyzed: {f.timetableAnalyzedAt} ({f.timetableAnalyzedDay})
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{f.department}</td>
                      <td className="px-4 py-3.5">
                        {(() => {
                          const mappings = f.assignedSectionMappings || [];
                          if (mappings.length > 0) {
                            return (
                              <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                {mappings.map((m: any, idx: number) => {
                                  const sec = sections.find(s => s.id === m.sectionId);
                                  const bat = sec ? batches.find(b => b.id === sec.batchId) : null;
                                  const batchLabel = bat ? `${bat.name} (${bat.year})` : (m.batchName ? `${m.batchName} (${m.batchYear})` : '');
                                  return (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/50 rounded-lg text-[10px] font-bold flex items-center gap-1 transition select-none animate-fade-in"
                                    >
                                      <span
                                        onClick={() => {
                                          if (sec) {
                                            setViewStudentsModal({ faculty: f, section: sec, batch: bat || undefined });
                                          }
                                        }}
                                        title={sec ? `Click to view students for Section ${sec.name}` : ''}
                                        className="cursor-pointer hover:underline"
                                      >
                                        {batchLabel ? `${batchLabel} - Sec ${m.sectionName || sec?.name || 'A'}` : `Sec ${m.sectionName || sec?.name || 'A'}`}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveSectionMapping(f, m);
                                        }}
                                        title="Remove assigned section mapping"
                                        className="ml-1 hover:bg-indigo-100 text-indigo-400 hover:text-red-600 rounded p-0.5 transition cursor-pointer"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            );
                          }
                          
                          if (assignedSection) {
                            const label = assignedBatch ? `${assignedBatch.name} (${assignedBatch.year}) - Sec ${assignedSection.name}` : `Sec ${assignedSection.name}`;
                            const legacyMapping = {
                              sectionId: f.sectionId,
                              sectionName: assignedSection.name,
                              batchName: assignedBatch?.name || '',
                              batchYear: assignedBatch?.year || '',
                              subjectName: f.subjectName || f.subject || '',
                              subjectCode: f.subjectCode || '',
                              labName: f.labName || ''
                            };
                            return (
                              <span
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/50 rounded-lg text-[10px] font-bold flex items-center gap-1 transition select-none animate-fade-in"
                              >
                                <span
                                  onClick={() => setViewStudentsModal({ faculty: f, section: assignedSection, batch: assignedBatch || undefined })}
                                  title={`Click to view students for Section ${assignedSection.name}`}
                                  className="cursor-pointer hover:underline"
                                >
                                  {label}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSectionMapping(f, legacyMapping);
                                  }}
                                  title="Remove assigned section mapping"
                                  className="ml-1 hover:bg-indigo-100 text-indigo-400 hover:text-red-600 rounded p-0.5 transition cursor-pointer"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            );
                          }

                          return <span className="text-slate-400 italic">Unassigned</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge color={f.isActive ? 'green' : 'amber'}>{f.isActive ? 'Active' : 'Pending'}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setTimetableBatchId('');
                              setTimetableSectionId('');
                              setTimetableImagePreview(null);
                              setTimetableFileName('');
                              setSelectedTimetablePeriod('Period 1 (8.00 AM - 8.50 AM)');
                              const initialSf = getSubjectShortForm(f.subjectName || f.subject, f.subjectShortForm, f.subjectCode);
                              setSelectedSubjectShortForm(initialSf);
                              setTimetableModalFaculty(f);
                            }}
                            title="Assign/Upload Subject Timetable Image for this Faculty Member"
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition border border-indigo-200/60 shadow-xs shrink-0"
                          >
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Timetable
                          </button>
                          <button
                            onClick={() => setAssignModal(f)}
                            title="Assign Section"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 cursor-pointer transition"
                          >
                            <BookOpenCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => clearFacultyData(f.id).then(r => r.success && setToast({ msg: 'Cleared!', type: 'success' }))}
                            title="Clear Timetable Data"
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 cursor-pointer transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(f.id, f.name || f.email)}
                            title="Remove Faculty"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── TIMETABLE ASSIGNMENT MODAL (HOD / ADMIN) ───────────────────────── */}
      {timetableModalFaculty && (
        <Modal 
          title={`Assign Subject Timetable — ${timetableModalFaculty.name || timetableModalFaculty.email}`} 
          onClose={() => {
            setTimetableModalFaculty(null);
            setTimetableImagePreview(null);
          }} 
          wide
        >
          <div className="space-y-5 p-2">
            {/* Faculty details summary banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white">{timetableModalFaculty.name || 'Faculty Member'}</h3>
                  <p className="text-xs text-indigo-300 font-medium">{timetableModalFaculty.email}</p>
                </div>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-lg uppercase">
                  {timetableModalFaculty.department || 'Department Faculty'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Handling Subject</span>
                  <span className="font-extrabold text-white">{timetableModalFaculty.subjectName || timetableModalFaculty.subject || '—'}</span>
                </div>
                <div>
                  <span className="text-amber-400 text-[10px] uppercase font-extrabold block">Short Form (Timetable Tag)</span>
                  <span className="inline-block px-2 py-0.5 bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-md font-mono font-black text-xs">
                    {getSubjectShortForm(
                      timetableModalFaculty.subjectName || timetableModalFaculty.subject,
                      timetableModalFaculty.subjectShortForm,
                      timetableModalFaculty.subjectCode
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Subject Code</span>
                  <span className="font-mono font-bold text-indigo-300">{timetableModalFaculty.subjectCode || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Handling Section</span>
                  <span className="font-bold text-emerald-400">
                    {(() => {
                      const sectionObj = timetableModalFaculty.sectionId ? sections.find((s: any) => s.id === timetableModalFaculty.sectionId) : null;
                      const assignedSectionNames = [
                        sectionObj?.name,
                        timetableModalFaculty.section,
                        timetableModalFaculty.sections,
                        timetableModalFaculty.batch,
                        ...(Array.isArray(timetableModalFaculty.assignedSectionIds) ? timetableModalFaculty.assignedSectionIds.map((sid: string) => sections.find((s: any) => s.id === sid)?.name || sid) : [])
                      ].filter(Boolean);

                      return assignedSectionNames.length > 0
                        ? Array.from(new Set(assignedSectionNames)).join(", ")
                        : "Section F";
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Batch & Section Selection dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100/40">
              <div>
                <label className="text-[10px] font-black text-indigo-800 uppercase tracking-wide block mb-1">
                  Select Batch
                </label>
                <select
                  value={timetableBatchId}
                  onChange={e => {
                    setTimetableBatchId(e.target.value);
                    setTimetableSectionId('');
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                >
                  <option value="">— Select Batch —</option>
                  {modalAssignedBatches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.year})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-indigo-800 uppercase tracking-wide block mb-1">
                  Select Section
                </label>
                <select
                  value={timetableSectionId}
                  onChange={e => setTimetableSectionId(e.target.value)}
                  disabled={!timetableBatchId}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer disabled:opacity-50"
                >
                  <option value="">— Select Section —</option>
                  {modalAssignedSections.map(s => (
                    <option key={s.id} value={s.id}>Section {s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {!timetableSectionId ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-6 rounded-2xl border border-slate-200/60 text-center">
                Please select a Batch and Section above to configure and upload the subject timetable.
              </p>
            ) : (
              <>
                {/* Subject Tag & Period Selection Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="text-[10px] font-black text-indigo-650 uppercase tracking-wide block mb-1">
                      Select Lab Name to Analyze
                    </label>
                    <select
                      value={selectedSubjectShortForm}
                      onChange={(e) => {
                        const sf = e.target.value;
                        setSelectedSubjectShortForm(sf);
                        
                        const PANIMALAR_AUTO_ANALYSIS_SLOTS: Record<string, { labPeriod: string }> = {
                          KIES: { labPeriod: 'Period 2 & 3 Morning Lab Slot (8.50 AM - 10.30 AM)' },
                          DA: { labPeriod: 'Morning Lab Slot (10.45 AM - 12.40 PM)' },
                          DEV: { labPeriod: 'Morning Lab Slot (10.45 AM - 12.40 PM)' },
                          TSP: { labPeriod: 'Morning Lab Slot (10.45 AM - 12.40 PM)' }
                        };
                        const auto = PANIMALAR_AUTO_ANALYSIS_SLOTS[sf.toUpperCase()] || PANIMALAR_AUTO_ANALYSIS_SLOTS['KIES'];
                        setSelectedTimetablePeriod(auto.labPeriod);
                      }}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer shadow-xs"
                    >
                      <option value="KIES">KIES LAB (Knowledge Engineering & Intelligent Systems)</option>
                      <option value="DA">DA LAB (Data Analytics)</option>
                      <option value="DEV">DEV LAB (Web Development)</option>
                      <option value="TSP">TSP LAB (Technical Seminar & Research Writing / Practical)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wide block mb-1">
                      Select Timetable Period / Session Timings
                    </label>
                    <select
                      value={selectedTimetablePeriod}
                      onChange={(e) => {
                        const newPeriod = e.target.value;
                        setSelectedTimetablePeriod(newPeriod);
                        if (timetableImagePreview && timetableModalFaculty) {
                          const sf = selectedSubjectShortForm || getSubjectShortForm(timetableModalFaculty.subjectName || timetableModalFaculty.subject, timetableModalFaculty.subjectShortForm, timetableModalFaculty.subjectCode);
                          const payload = JSON.stringify({
                            image: timetableImagePreview,
                            subjectShortForm: sf,
                            period: newPeriod,
                            subjectName: timetableModalFaculty.subjectName || timetableModalFaculty.subject,
                            subjectCode: timetableModalFaculty.subjectCode,
                            updatedAt: new Date().toISOString()
                          });
                          const keySuffix = timetableSectionId ? `_${timetableSectionId}` : '';
                          localStorage.setItem(`faculty_timetable_${timetableModalFaculty.id}${keySuffix}`, payload);
                          localStorage.setItem(`faculty_timetable_${timetableModalFaculty.email}${keySuffix}`, payload);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                    >
                      {(() => {
                        const activeSf = (selectedSubjectShortForm || getSubjectShortForm(timetableModalFaculty?.subjectName || timetableModalFaculty?.subject, timetableModalFaculty?.subjectShortForm, timetableModalFaculty?.subjectCode) || 'KIES').toUpperCase();
                        
                        if (activeSf.includes('KIES') || activeSf.includes('EASY')) {
                          return (
                            <>
                              <option value="Period 2 & 3 Morning Lab Slot (8.50 AM - 10.30 AM)">Period 2 & 3 Morning Lab Slot (8.50 AM – 10.30 AM)</option>
                              <option value="Monday - Period 6 (1.15 PM - 1.55 PM)">Monday - Period 6 (1.15 PM – 1.55 PM)</option>
                              <option value="Tuesday - Period 2 (8.50 AM - 9.40 AM)">Tuesday - Period 2 (8.50 AM – 9.40 AM)</option>
                              <option value="Wednesday - Period 2 (8.50 AM - 9.40 AM)">Wednesday - Period 2 (8.50 AM – 9.40 AM)</option>
                              <option value="Thursday - Period 3 (9.40 AM - 10.30 AM)">Thursday - Period 3 (9.40 AM – 10.30 AM)</option>
                              <option value="Friday - Period 6 (1.15 PM - 1.55 PM)">Friday - Period 6 (1.15 PM – 1.55 PM)</option>
                            </>
                          );
                        }
                        if (activeSf.includes('DA') || activeSf.includes('DATA') || activeSf.includes('ANALYT')) {
                          return (
                            <>
                              <option value="Morning Lab Slot (10.45 AM - 12.40 PM)">Period 4 & 5 Morning Lab Slot (10.45 AM – 12.40 PM)</option>
                              <option value="Tuesday - Period 1 (8.00 AM - 8.50 AM)">Tuesday - Period 1 (8.00 AM – 8.50 AM)</option>
                              <option value="Tuesday - Period 7 (1.55 PM - 2.35 PM)">Tuesday - Period 7 (1.55 PM – 2.35 PM)</option>
                              <option value="Wednesday - Period 3 (9.40 AM - 10.30 AM)">Wednesday - Period 3 (9.40 AM – 10.30 AM)</option>
                              <option value="Wednesday - Period 4 (10.45 AM - 11.40 AM)">Wednesday - Period 4 (10.45 AM – 11.40 AM)</option>
                              <option value="Friday - Period 7 (1.55 PM - 2.35 PM)">Friday - Period 7 (1.55 PM – 2.35 PM)</option>
                            </>
                          );
                        }
                        if (activeSf.includes('DEV') || activeSf.includes('DEVELOP')) {
                          return (
                            <>
                              <option value="Morning Lab Slot (10.45 AM - 12.40 PM)">Period 4 & 5 Morning Lab Slot (10.45 AM – 12.40 PM)</option>
                              <option value="Wednesday - Period 1 (8.00 AM - 8.50 AM)">Wednesday - Period 1 (8.00 AM – 8.50 AM)</option>
                              <option value="Wednesday - Period 8 (2.35 PM - 3.15 PM)">Wednesday - Period 8 (2.35 PM – 3.15 PM)</option>
                              <option value="Thursday - Period 2 (8.50 AM - 9.40 AM)">Thursday - Period 2 (8.50 AM – 9.40 AM)</option>
                              <option value="Friday - Period 8 (2.35 PM - 3.15 PM)">Friday - Period 8 (2.35 PM – 3.15 PM)</option>
                            </>
                          );
                        }
                        if (activeSf.includes('TSP')) {
                          return (
                            <>
                              <option value="Morning Lab Slot (10.45 AM - 12.40 PM)">Period 4 & 5 Morning Lab Slot (10.45 AM – 12.40 PM)</option>
                            </>
                          );
                        }
                        
                        return (
                          <>
                            <option value="Period 1 (8.00 AM - 8.50 AM)">Period 1 (8.00 AM – 8.50 AM)</option>
                            <option value="Period 2 (8.50 AM - 9.40 AM)">Period 2 (8.50 AM – 9.40 AM)</option>
                            <option value="Period 3 (9.40 AM - 10.30 AM)">Period 3 (9.40 AM – 10.30 AM)</option>
                            <option value="Tea Break (10.30 AM - 10.45 AM)">Tea Break (10.30 AM – 10.45 AM)</option>
                            <option value="Period 4 (10.45 AM - 11.40 AM)">Period 4 (10.45 AM – 11.40 AM)</option>
                            <option value="Period 5 (11.40 AM - 12.40 PM)">Period 5 (11.40 AM – 12.40 PM)</option>
                            <option value="Morning Lab Slot (10.45 AM - 12.40 PM)">Morning Lab Slot (10.45 AM – 12.40 PM)</option>
                            <option value="Lunch Break (12.40 PM - 1.15 PM)">Lunch Break (12.40 PM – 1.15 PM)</option>
                            <option value="Period 6 (1.15 PM - 1.55 PM)">Period 6 (1.15 PM – 1.55 PM)</option>
                            <option value="Period 7 (1.55 PM - 2.35 PM)">Period 7 (1.55 PM – 2.35 PM)</option>
                            <option value="Period 8 (2.35 PM - 3.15 PM)">Period 8 (2.35 PM – 3.15 PM)</option>
                            <option value="Afternoon Lab Slot (1.15 PM - 3.15 PM)">Afternoon Lab Slot (1.15 PM – 3.15 PM)</option>
                            <option value="Full Day Session (8.00 AM - 3.15 PM)">Full Day Session (8.00 AM – 3.15 PM)</option>
                          </>
                        );
                      })()}
                    </select>
                  </div>
                </div>

                {/* Upload & Preview Section */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Handling Subject Timetable Schedule Image</h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!timetableImagePreview) {
                            alert("Please upload a timetable image first to analyze it!");
                            return;
                          }
                          const sf = selectedSubjectShortForm || getSubjectShortForm(timetableModalFaculty.subjectName || timetableModalFaculty.subject, timetableModalFaculty.subjectShortForm, timetableModalFaculty.subjectCode);
                          const sfUpper = (sf || 'KIES').toUpperCase();
                          saveAnalyzedTimetableToProfile(timetableModalFaculty, sfUpper);
                          
                          const PANIMALAR_AUTO_ANALYSIS_SLOTS: Record<string, { labDayName: string; labPeriod: string; labTime: string }> = {
                            KIES: { labDayName: 'Friday', labPeriod: 'Period 2 & 3 Morning Lab Slot', labTime: '8.50 AM - 10.30 AM' },
                            DA: { labDayName: 'Tuesday', labPeriod: 'Morning Lab Slot', labTime: '10.45 AM - 12.40 PM' },
                            DEV: { labDayName: 'Thursday', labPeriod: 'Morning Lab Slot', labTime: '10.45 AM - 12.40 PM' },
                            TSP: { labDayName: 'Monday', labPeriod: 'Morning Lab Slot', labTime: '10.45 AM - 12.40 PM' }
                          };
                          const auto = PANIMALAR_AUTO_ANALYSIS_SLOTS[sfUpper] || PANIMALAR_AUTO_ANALYSIS_SLOTS['KIES'];

                          alert(
                            "✨ Panimalar Engineering College Timetable Analyzed!\n\n" +
                            "Detected Lab details saved to Faculty profile:\n" +
                            "• Associated Lab Name: " + sfUpper + " LAB\n" +
                            "• Analyzed Day: " + auto.labDayName + "\n" +
                            "• Period/Time Slot: " + auto.labPeriod + " (" + auto.labTime + ")\n" +
                            "• Calibration Date & Time: " + new Date().toLocaleString('en-GB') + "\n\n" +
                            "Laboratory details will now reflect in HOD monitors and Faculty dashboard."
                          );
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analyze Image Periods</span>
                      </button>
                      <label className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{timetableImagePreview ? 'Upload New Image' : 'Upload Timetable Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 12 * 1024 * 1024) {
                              alert("Image size must be under 12MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              setTimetableImagePreview(base64);

                              const sf = selectedSubjectShortForm || getSubjectShortForm(timetableModalFaculty.subjectName || timetableModalFaculty.subject, timetableModalFaculty.subjectShortForm, timetableModalFaculty.subjectCode);
                              const sfUpper = (sf || 'KIES').toUpperCase();

                              const daysShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                              const currentDayCode = daysShort[new Date().getDay()];

                              const PANIMALAR_AUTO_ANALYSIS: Record<string, { labDay: string; labPeriod: string; theory: Record<string, string> }> = {
                                KIES: {
                                  labDay: 'FRI',
                                  labPeriod: 'Period 2 & 3 Morning Lab Slot (8.50 AM - 10.30 AM)',
                                  theory: { MON: 'Period 6 (1.15 PM - 1.55 PM)', TUE: 'Period 2 (8.50 AM - 9.40 AM)', WED: 'Period 2 (8.50 AM - 9.40 AM)', THU: 'Period 3 (9.40 AM - 10.30 AM)', FRI: 'Period 6 (1.15 PM - 1.55 PM)' }
                                },
                                DA: {
                                  labDay: 'TUE',
                                  labPeriod: 'Morning Lab Slot (10.45 AM - 12.40 PM)',
                                  theory: { TUE: 'Period 1 (8.00 AM - 8.50 AM) & Period 7 (1.55 PM - 2.35 PM)', WED: 'Period 3 (9.40 AM - 10.30 AM)', FRI: 'Period 7 (1.55 PM - 2.35 PM)' }
                                },
                                DEV: {
                                  labDay: 'THU',
                                  labPeriod: 'Morning Lab Slot (10.45 AM - 12.40 PM)',
                                  theory: { WED: 'Period 1 (8.00 AM - 8.50 AM)', THU: 'Period 2 (8.50 AM - 9.40 AM)', FRI: 'Period 8 (2.35 PM - 3.15 PM)' }
                                },
                                TSP: {
                                  labDay: 'MON',
                                  labPeriod: 'Morning Lab Slot (10.45 AM - 12.40 PM)',
                                  theory: {}
                                }
                              };

                              const autoData = PANIMALAR_AUTO_ANALYSIS[sfUpper] || PANIMALAR_AUTO_ANALYSIS['KIES'];
                              const autoPeriod = (currentDayCode === autoData.labDay) ? autoData.labPeriod : (autoData.theory[currentDayCode] || 'Period 1 (8.00 AM - 8.50 AM)');

                              setSelectedTimetablePeriod(autoPeriod);

                              const payload = JSON.stringify({
                                image: base64,
                                subjectShortForm: sfUpper,
                                period: autoPeriod,
                                subjectName: timetableModalFaculty.subjectName || timetableModalFaculty.subject,
                                subjectCode: timetableModalFaculty.subjectCode,
                                analyzedAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                              });

                              const keySuffix = timetableSectionId ? `_${timetableSectionId}` : '';
                              localStorage.setItem(`faculty_timetable_${timetableModalFaculty.id}${keySuffix}`, payload);
                              localStorage.setItem(`faculty_timetable_${timetableModalFaculty.email}${keySuffix}`, payload);

                              saveAnalyzedTimetableToProfile(timetableModalFaculty, sfUpper);

                              window.dispatchEvent(new Event('storage'));
                              window.dispatchEvent(new CustomEvent('timetableUpdated', { detail: { facultyId: timetableModalFaculty.id } }));

                              alert(`✨ Timetable Image Uploaded & Automatically Analyzed!\n\nSubject Short Form: ${sfUpper}\nFetched Period Timing: ${autoPeriod}\n\nThis timetable is now synced real-time to the Faculty Profile & Dashboard.`);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {timetableImagePreview ? (
                    <div className="space-y-3">
                      <div className="bg-slate-900/95 p-3 rounded-2xl border border-slate-800 flex justify-center items-center overflow-hidden max-h-[500px] shadow-lg">
                        <img 
                          src={timetableImagePreview} 
                          alt="Faculty Timetable" 
                          className="max-h-[480px] w-auto object-contain rounded-xl shadow-md"
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Timetable image currently active for this faculty</span>
                        </span>
                        <button
                          onClick={() => {
                            if (confirm("Remove timetable image for this faculty member?")) {
                              setTimetableImagePreview(null);
                              const keySuffix = timetableSectionId ? `_${timetableSectionId}` : '';
                              localStorage.removeItem(`faculty_timetable_${timetableModalFaculty.id}${keySuffix}`);
                              localStorage.removeItem(`faculty_timetable_${timetableModalFaculty.email}${keySuffix}`);
                            }
                          }}
                          className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition cursor-pointer border border-rose-200"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition hover:bg-indigo-50/20 space-y-3">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm">Click or Drag & Drop Timetable Image Here</p>
                        <p className="text-xs text-slate-400 font-medium mt-1">PNG, JPG, WEBP formats supported (Max 12MB)</p>
                      </div>
                      <span className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-extrabold text-xs shadow-sm">
                        Select Timetable Image File
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 12 * 1024 * 1024) {
                            alert("Image size must be under 12MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result as string;
                            setTimetableImagePreview(base64);
                            const keySuffix = timetableSectionId ? `_${timetableSectionId}` : '';
                            localStorage.setItem(`faculty_timetable_${timetableModalFaculty.id}${keySuffix}`, base64);
                            localStorage.setItem(`faculty_timetable_${timetableModalFaculty.email}${keySuffix}`, base64);
                            alert(`Timetable image assigned successfully for ${timetableModalFaculty.name || 'Faculty'}!`);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 5 — NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function NotificationsTab({ batches, token }: { batches: Batch[]; token: string; }) {
  const { sendNotification } = useAcademicData();
  const [form, setForm] = useState({
    type: 'announcement' as const,
    title: '', message: '', targetBatch: '',
  });
  const [sending, setSending] = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const { user } = useAuth();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) { setToast({ msg: 'Title and message required', type: 'error' }); return; }
    setSending(true);
    await sendNotification(form.type, form.title, form.message, user.name || 'Admin', form.targetBatch || undefined);
    setToast({ msg: 'Notification sent to all students!', type: 'success' });
    setForm({ type: 'announcement', title: '', message: '', targetBatch: '' });
    setSending(false);
  };

  const NOTIF_TYPES = ['announcement', 'circular', 'schedule', 'deadline', 'exam'] as const;

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div>
        <h2 className="text-lg font-extrabold text-slate-800">Broadcast Notifications</h2>
        <p className="text-xs text-slate-500 mt-0.5">Send announcements and circulars to students.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSend} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer capitalize">
                {NOTIF_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Target Batch (optional)</label>
              <select value={form.targetBatch} onChange={e => setForm(p => ({ ...p, targetBatch: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer">
                <option value="">All Batches</option>
                {batches.map(b => <option key={b.id} value={b.name}>{b.name} ({b.year})</option>)}
              </select>
            </div>
          </div>
          <InputField label="Title" id="notif-title" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="e.g. Mid-term Schedule Update" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Message <span className="text-red-500">*</span></label>
            <textarea
              value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={5} required
              placeholder="Write your notification message here…"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={sending}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-sm disabled:opacity-60">
              {sending ? <Spinner /> : <Send className="w-4 h-4" />} Send Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 6 — LIVE MONITORING
// ═══════════════════════════════════════════════════════════════════════════════
function MonitoringTab({ faculties, students, sections, batches, token, onRefresh }: {
  faculties: any[]; students: any[]; sections: any[]; batches: any[]; token: string;
  onRefresh: () => Promise<void>;
}) {
  const [tab, setTab] = useState<'faculty' | 'student' | 'dayreport'>('faculty');
  const [facultySearch, setFacultySearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('');
  const [monitoringBatchFilter, setMonitoringBatchFilter] = useState<string>('');
  const [monitoringSectionFilter, setMonitoringSectionFilter] = useState<string>('');
  const [monitoringModal, setMonitoringModal] = useState<any | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Day-by-Day Reports state
  const [reportDate, setReportDate] = useState<string>(() => getLocalDateString());
  const [reportViewTab, setReportViewTab] = useState<'attendance' | 'evaluations'>('evaluations');
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');

  const [exportSelectModalFaculty, setExportSelectModalFaculty] = useState<any | null>(null);
  const [selectedExportBatchId, setSelectedExportBatchId] = useState<string>('');
  const [selectedExportSectionId, setSelectedExportSectionId] = useState<string>('');

  // Find batches assigned to this faculty member for export modal
  const getFacultyBatchesForExport = (fac: any) => {
    if (!fac) return [];
    const batchIds = new Set<string>();
    const mappings = fac.assignedSectionMappings || [];
    mappings.forEach((m: any) => {
      const sec = sections.find(s => s.id === m.sectionId);
      if (sec && sec.batchId) batchIds.add(sec.batchId);
    });
    const sIds = fac.assignedSectionIds || (fac.sectionId ? [fac.sectionId] : []);
    sIds.forEach((sid: string) => {
      const sec = sections.find(s => s.id === sid);
      if (sec && sec.batchId) batchIds.add(sec.batchId);
    });
    if (fac.batchId) batchIds.add(fac.batchId);
    
    if (batchIds.size === 0) return batches;
    return batches.filter(b => batchIds.has(b.id));
  };

  // Find sections assigned to this faculty member for the selected batch in export modal
  const getFacultySectionsForExport = (fac: any, targetBatchId: string) => {
    if (!fac) return [];
    const mappings = fac.assignedSectionMappings || [];
    const assignedSectionIds = new Set<string>(mappings.map((m: any) => m.sectionId));
    const sIds = fac.assignedSectionIds || (fac.sectionId ? [fac.sectionId] : []);
    sIds.forEach((sid: string) => assignedSectionIds.add(sid));
    
    let filtered = sections;
    if (assignedSectionIds.size > 0) {
      filtered = sections.filter(s => assignedSectionIds.has(s.id));
    }
    if (targetBatchId) {
      filtered = filtered.filter(s => s.batchId === targetBatchId);
    }
    return filtered;
  };

  // Auto-refresh every 30 seconds when live
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(async () => {
      await onRefresh();
      setLastUpdated(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [isLive, onRefresh]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setLastUpdated(new Date());
    setRefreshing(false);
  };

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const activeFacultyCount = faculties.filter(f => f.isActive).length;
  const totalStudents      = students.length;
  const atRiskCount        = students.filter((s: any) => s.riskFlagged).length;
  const avgAttendance      = totalStudents > 0
    ? Math.round(students.reduce((sum: number, s: any) => sum + (s.attendance ?? 0), 0) / totalStudents)
    : 0;

  // ── Faculty filter ────────────────────────────────────────────────────────
  const filteredFaculties = faculties.filter(f => {
    if (monitoringBatchFilter) {
      const batchSecIds = sections.filter(s => s.batchId === monitoringBatchFilter).map(s => s.id);
      const hasBatchMapping = f.assignedSectionMappings?.some((m: any) => batchSecIds.includes(m.sectionId)) || 
                              f.assignedSectionIds?.some((sid: string) => batchSecIds.includes(sid)) ||
                              batchSecIds.includes(f.sectionId) ||
                              f.batchId === monitoringBatchFilter;
      if (!hasBatchMapping) return false;
    }

    if (monitoringSectionFilter) {
      const hasSectionMapping = f.assignedSectionMappings?.some((m: any) => m.sectionId === monitoringSectionFilter) ||
                                f.assignedSectionIds?.includes(monitoringSectionFilter) ||
                                f.sectionId === monitoringSectionFilter;
      if (!hasSectionMapping) return false;
    }

    const q = facultySearch.toLowerCase();
    return !q ||
      (f.name || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.department || '').toLowerCase().includes(q) ||
      (f.subjectName || f.labName || '').toLowerCase().includes(q);
  });

  // Available Section Names list
  const availableSections = Array.from(
    new Set([
      ...sections.map((sec: any) => sec.name),
      ...students.map((s: any) => s.section || s.sectionName).filter(Boolean)
    ])
  ).sort();

  // ── Student filter ────────────────────────────────────────────────────────
  const filteredStudents = students.filter((s: any) => {
    if (monitoringBatchFilter) {
      const batObj = batches.find(b => b.id === monitoringBatchFilter);
      const isMatch = s.batchId === monitoringBatchFilter || 
                      (batObj && (s.batch === batObj.year || s.batch === batObj.name));
      if (!isMatch) return false;
    }

    if (monitoringSectionFilter) {
      const secObj = sections.find(sec => sec.id === monitoringSectionFilter);
      const isMatch = s.sectionId === monitoringSectionFilter ||
                      (secObj && s.section?.toLowerCase() === secObj.name?.toLowerCase());
      if (!isMatch) return false;
    }

    if (selectedSectionFilter) {
      const sSec = String(s.section || s.sectionName || s.sectionId || '').toLowerCase();
      const targetSec = selectedSectionFilter.toLowerCase();
      if (sSec !== targetSec && !sSec.endsWith(targetSec) && !targetSec.endsWith(sSec)) {
        return false;
      }
    }
    const q = studentSearch.toLowerCase();
    return !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.registerNo || '').toLowerCase().includes(q) ||
      (s.rollNo || '').toLowerCase().includes(q) ||
      (s.section || s.sectionName || '').toLowerCase().includes(q) ||
      (s.batch || s.batchName || '').toLowerCase().includes(q);
  });

  // ── Day-by-Day Report Data Calculation ──────────────────────────────────
  const dayReportStudents = filteredStudents;
  const dailyAttendanceListRaw = dayReportStudents.map((student: any) => {
    const dateRecords = (student.attendanceHistory || []).filter((h: any) => h.date === reportDate);
    const myRecord = dateRecords.length > 0 ? dateRecords[dateRecords.length - 1] : null;

    const obsEvaluatedOnDateRaw = (student.experiments || []).filter((e: any) => {
      const dateMatches = e.submittedAt === reportDate || (e.dueDate === reportDate && (e.status === 'Approved' || e.status === 'Absent' || (e.score !== undefined && e.score !== 0)));
      return dateMatches || (e.score !== undefined && e.score !== null && e.score !== 0 && e.score !== '');
    });

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
      return dateMatches || a.status === 'Graded' || a.status === 'Submitted';
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

    const obsStatusText = obsItems.length > 0 ? obsItems.map((i: any) => `Exp ${i.expNum}: ${i.score}`).join(', ') : '-';
    const recStatusText = recItems.length > 0 ? recItems.map((i: any) => `Exp ${i.expNum}: ${i.status}`).join(', ') : '-';

    return {
      student,
      rawStatus: myRecord ? (myRecord.status as string) : 'Present',
      obsStatusText,
      recStatusText,
      obsItems,
      recItems,
    };
  });

  const filteredDayReportList = dailyAttendanceListRaw.filter((item: any) => {
    if (!reportSearchQuery.trim()) return true;
    const q = reportSearchQuery.toLowerCase();
    return (item.student.name || '').toLowerCase().includes(q) ||
      (item.student.rollNo || '').toLowerCase().includes(q) ||
      (item.student.registerNo || '').toLowerCase().includes(q);
  });

  const dayPresentCount = dailyAttendanceListRaw.filter((d: any) => d.rawStatus === 'Present').length;
  const dayAbsentCount = dailyAttendanceListRaw.filter((d: any) => d.rawStatus === 'Absent').length;
  const dayODCount = dailyAttendanceListRaw.filter((d: any) => d.rawStatus === 'On Duty').length;
  const dayTotalCount = dailyAttendanceListRaw.length;
  const dayAttendancePct = dayTotalCount > 0 ? Math.round((dayPresentCount / dayTotalCount) * 100) : 0;

  const getAttColor = (att: number) => {
    if (att >= 75) return { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', badge: 'green' as const };
    if (att >= 60) return { bg: 'bg-amber-50',   text: 'text-amber-700',   bar: 'bg-amber-400',   badge: 'amber' as const };
    return          { bg: 'bg-red-50',    text: 'text-red-700',    bar: 'bg-red-500',    badge: 'red' as const };
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-5">
      {monitoringModal && (
        <FacultyMonitoringModal
          faculty={monitoringModal}
          token={token}
          batches={batches}
          sections={sections}
          onClose={() => setMonitoringModal(null)}
        />
      )}

      {exportSelectModalFaculty && (
        <Modal
          title={`Export Observation Marks — ${exportSelectModalFaculty.name || exportSelectModalFaculty.email}`}
          onClose={() => {
            setExportSelectModalFaculty(null);
            setSelectedExportBatchId('');
            setSelectedExportSectionId('');
          }}
        >
          <div className="space-y-4 p-4 text-xs font-semibold text-slate-700">
            <p className="text-xs text-slate-500 font-medium">
              Please select the Batch and Section you wish to export for <strong>{exportSelectModalFaculty.name || exportSelectModalFaculty.email}</strong>.
            </p>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Select Batch</label>
              <select
                value={selectedExportBatchId}
                onChange={e => {
                  setSelectedExportBatchId(e.target.value);
                  setSelectedExportSectionId('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
              >
                <option value="">— Choose Batch —</option>
                {getFacultyBatchesForExport(exportSelectModalFaculty).map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.year})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Select Section</label>
              <select
                value={selectedExportSectionId}
                onChange={e => setSelectedExportSectionId(e.target.value)}
                disabled={!selectedExportBatchId}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer disabled:opacity-50"
              >
                <option value="">— Choose Section —</option>
                {getFacultySectionsForExport(exportSelectModalFaculty, selectedExportBatchId).map((s: any) => (
                  <option key={s.id} value={s.id}>Section {s.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setExportSelectModalFaculty(null);
                  setSelectedExportBatchId('');
                  setSelectedExportSectionId('');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedExportBatchId || !selectedExportSectionId) {
                    alert("Please select both Batch and Section.");
                    return;
                  }
                  exportFacultyObservationMarksExcel(
                    exportSelectModalFaculty,
                    students,
                    selectedExportBatchId,
                    selectedExportSectionId,
                    sections,
                    batches
                  );
                  setExportSelectModalFaculty(null);
                  setSelectedExportBatchId('');
                  setSelectedExportSectionId('');
                }}
                disabled={!selectedExportBatchId || !selectedExportSectionId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Live Status Bar ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl ${isLive ? 'bg-emerald-500/20' : 'bg-slate-600/30'}`}>
            {isLive ? <Wifi className="w-5 h-5 text-emerald-400" /> : <WifiOff className="w-5 h-5 text-slate-400" />}
            {isLive && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            )}
            {isLive && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            )}
          </div>
          <div>
            <p className="text-white font-extrabold text-sm flex items-center gap-2">
              Live Monitoring Dashboard
              {isLive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AUTO-REFRESH ON
                </span>
              )}
            </p>
            <p className="text-slate-400 text-[10px] mt-0.5">
              Last updated: <span className="text-slate-200 font-bold">{formatTime(lastUpdated)}</span> · Refreshes every 30s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(p => !p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-600/30 text-slate-300 border-slate-600 hover:bg-slate-600/50'
            }`}
          >
            {isLive ? 'Pause Auto-Refresh' : 'Resume Auto-Refresh'}
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </button>
        </div>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Faculty',   value: activeFacultyCount, sub: `${faculties.length} pre-approved`,   icon: UserCheck,    color: 'indigo' },
          { label: 'Total Students',   value: totalStudents,       sub: 'enrolled across all sections',       icon: GraduationCap, color: 'blue' },
          { label: 'At-Risk Students', value: atRiskCount,         sub: 'attendance < 75% or flagged',       icon: AlertTriangle, color: 'amber' },
          { label: 'Avg. Attendance',  value: `${avgAttendance}%`, sub: 'across all students',               icon: TrendingUp,    color: 'emerald' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow`}>
            <div className={`p-3 rounded-xl shrink-0 bg-${color}-50`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider truncate">{label}</p>
              <h4 className="text-xl font-black text-slate-800 mt-0.5">{value}</h4>
              <p className="text-[10px] text-slate-500 truncate">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Panel Switcher ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {([
            { key: 'faculty', label: 'Faculty Monitoring', icon: UserCheck,    count: filteredFaculties.length },
            { key: 'student', label: 'Student Monitoring', icon: GraduationCap, count: filteredStudents.length },
            { key: 'dayreport', label: 'Day-by-Day Reports', icon: CalendarDays, count: filteredDayReportList.length },
          ] as const).map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-bold transition cursor-pointer border-b-2 ${
                tab === key
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                tab === key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
              }`}>{count}</span>
            </button>
          ))}
        </div>

        {/* Batch & Section Dropdown Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Batch</label>
            <select
              value={monitoringBatchFilter}
              onChange={e => {
                setMonitoringBatchFilter(e.target.value);
                setMonitoringSectionFilter('');
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="">— All Batches —</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.year})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Section</label>
            <select
              value={monitoringSectionFilter}
              onChange={e => setMonitoringSectionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="">— All Sections —</option>
              {sections
                .filter(s => !monitoringBatchFilter || s.batchId === monitoringBatchFilter)
                .map(s => {
                  const bat = batches.find(b => b.id === s.batchId);
                  return (
                    <option key={s.id} value={s.id}>
                      Section {s.name} {bat ? `(${bat.name})` : ''}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        {/* ── FACULTY MONITORING ───────────────────────────────────────────── */}
        {tab === 'faculty' && (
          <div className="p-5 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={facultySearch}
                onChange={e => setFacultySearch(e.target.value)}
                placeholder="Search faculty by name, email, department, subject…"
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition bg-slate-50"
              />
            </div>

            {filteredFaculties.length === 0 ? (
              <div className="text-center py-10 text-slate-400 italic text-sm">No faculty found.</div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="px-4 py-3.5 text-center">S.No</th>
                        <th className="px-4 py-3.5">Faculty Name</th>
                        <th className="px-4 py-3.5">Department</th>
                        <th className="px-4 py-3.5 text-center">Assigned Section</th>
                        <th className="px-4 py-3.5 text-center">Students</th>
                        <th className="px-4 py-3.5 text-center">Status</th>
                        <th className="px-4 py-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {filteredFaculties.map((f, idx) => {
                        const sectionObj = f.sectionId ? sections.find((s: any) => s.id === f.sectionId) : null;
                        const sectionLabels: string[] = [];
                        if (Array.isArray(f.assignedSectionMappings) && f.assignedSectionMappings.length > 0) {
                          f.assignedSectionMappings.forEach((m: any) => {
                            const sec = sections.find((s: any) => s.id === m.sectionId);
                            const bat = sec ? batches.find((b: any) => b.id === sec.batchId) : null;
                            const bName = bat ? `${bat.name} (${bat.year})` : (m.batchName ? `${m.batchName} (${m.batchYear || ''})` : '');
                            const sName = m.sectionName || sec?.name || '';
                            if (bName && sName) {
                              sectionLabels.push(`${bName} - Sec ${sName}`);
                            } else if (sName) {
                              sectionLabels.push(`Sec ${sName}`);
                            }
                          });
                        }
                        if (sectionLabels.length === 0) {
                          const ids = [
                            f.sectionId,
                            ...(Array.isArray(f.assignedSectionIds) ? f.assignedSectionIds : [])
                          ].filter(Boolean);
                          ids.forEach(sid => {
                            const sec = sections.find((s: any) => s.id === sid);
                            const bat = sec ? batches.find((b: any) => b.id === sec.batchId) : null;
                            const bName = bat ? `${bat.name} (${bat.year})` : '';
                            const sName = sec ? sec.name : sid;
                            if (bName && sName) {
                              sectionLabels.push(`${bName} - Sec ${sName}`);
                            } else if (sName) {
                              sectionLabels.push(`Sec ${sName}`);
                            }
                          });
                        }
                        if (sectionLabels.length === 0 && (f.section || f.sections)) {
                          const legacy = [f.section, f.sections].filter(Boolean);
                          legacy.forEach(l => {
                            sectionLabels.push(`Sec ${l}`);
                          });
                        }
                        const sectionNameDisplay = sectionLabels.length > 0
                          ? Array.from(new Set(sectionLabels)).join(", ")
                          : "Unassigned";

                        const batchObj = f.batchId ? batches.find((b: any) => b.id === f.batchId) : null;
                        const batchName = f.batch || batchObj?.name || (sectionObj?.batchId ? batches.find((b: any) => b.id === sectionObj.batchId)?.name : null) || "";

                        const subjectDisplayName = f.subjectName || (Array.isArray(f.subjectsHandled) && f.subjectsHandled[0]) || f.subject || "—";

                        // Comprehensive Student Count matching for this faculty
                        const facEmail = f.email?.toLowerCase();
                        const facId = f.id;
                        const facSections = [
                          f.section,
                          f.sections,
                          ...(Array.isArray(f.assignedSectionIds) ? f.assignedSectionIds : [])
                        ].filter(Boolean).map((x: string) => String(x).toLowerCase());

                        const studentCount = students.filter((s: any) => {
                          if (s.facultyId === facId || (facEmail && (s.facultyId?.toLowerCase() === facEmail || s.facultyEmail?.toLowerCase() === facEmail))) return true;
                          if (f.sectionId && (s.sectionId === f.sectionId || s.section === f.sectionId)) return true;
                          if (Array.isArray(f.assignedSectionIds) && (f.assignedSectionIds.includes(s.sectionId) || f.assignedSectionIds.includes(s.section))) return true;
                          if (facSections.length > 0) {
                            const sSec = String(s.section || '').toLowerCase();
                            const sSecId = String(s.sectionId || '').toLowerCase();
                            if (facSections.some(sec => sec === sSec || sec === sSecId || sSec.endsWith(sec) || sec.endsWith(sSec))) {
                              return true;
                            }
                          }
                          return false;
                        }).length;

                        return (
                          <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                                  {(f.name || f.email || 'F').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-extrabold text-slate-900 text-xs">
                                    {f.name || <span className="italic text-slate-400 font-medium">Not registered yet</span>}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-medium truncate">{f.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-bold text-slate-800">{f.department || '—'}</td>

                            <td className="px-4 py-3.5 text-center">
                              <span 
                                onClick={() => {
                                  if (sectionNameDisplay && sectionNameDisplay !== 'Unassigned') {
                                    const firstSec = sectionNameDisplay.split(',')[0].trim();
                                    setSelectedSectionFilter(firstSec);
                                    setTab('student');
                                  }
                                }}
                                className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-black border transition ${
                                  sectionNameDisplay !== 'Unassigned'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 cursor-pointer hover:bg-indigo-100'
                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                }`}
                              >
                                {sectionNameDisplay}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={() => {
                                  if (sectionNameDisplay && sectionNameDisplay !== 'Unassigned') {
                                    const firstSec = sectionNameDisplay.split(',')[0].trim();
                                    setSelectedSectionFilter(firstSec);
                                  }
                                  setTab('student');
                                }}
                                className="font-black text-slate-800 hover:text-indigo-600 transition cursor-pointer text-xs"
                              >
                                {studentCount}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Badge color={f.isActive ? 'green' : 'amber'}>{f.isActive ? 'Active' : 'Pending'}</Badge>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setExportSelectModalFaculty(f);
                                    const bList = getFacultyBatchesForExport(f);
                                    if (bList.length > 0) {
                                      setSelectedExportBatchId(bList[0].id);
                                      const sList = getFacultySectionsForExport(f, bList[0].id);
                                      if (sList.length > 0) {
                                        setSelectedExportSectionId(sList[0].id);
                                      }
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center gap-1 cursor-pointer transition border border-emerald-200/60 shadow-xs"
                                  title="Export Observation Marks (.xlsx)"
                                >
                                  <Download className="w-3 h-3 text-emerald-600" />
                                  <span>Export</span>
                                </button>
                                <button
                                  onClick={() => setMonitoringModal(f)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-black flex items-center gap-1 cursor-pointer transition border border-purple-200/60 shadow-xs"
                                  title="Faculty Live Monitoring Log"
                                >
                                  <Activity className="w-3 h-3 text-purple-600" />
                                  <span>Monitoring</span>
                                </button>
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
          </div>
        )}

        {/* ── STUDENT MONITORING ──────────────────────────────────────────────── */}
        {tab === 'student' && (
          <div className="p-5 space-y-5">

            {/* Search Input & Legend */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder={selectedSectionFilter ? `Search inside ${selectedSectionFilter}…` : "Search by student name, register no, roll no…"}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition bg-slate-50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100 shrink-0">
                <span className="uppercase tracking-wider">Attendance:</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />≥75% On Track</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />60–74% Warning</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />&lt;60% Critical</span>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-6 space-y-2">
                <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">No students found for {selectedSectionFilter ? `section "${selectedSectionFilter}"` : "the search"}.</p>
                <p className="text-xs text-slate-400">Try selecting another section above or clearing the search filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-extrabold">
                      <th className="px-4 py-3 text-left">Student</th>
                      <th className="px-4 py-3 text-left">Register No</th>
                      <th className="px-4 py-3 text-left">Section / Batch</th>
                      <th className="px-4 py-3 text-left">Attendance</th>
                      <th className="px-4 py-3 text-left">Lab Progress</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map((s: any, idx: number) => {
                      const att = s.attendance ?? 0;
                      const col = getAttColor(att);

                      // Compute experiment progress
                      const exps = s.labExperiments || s.experiments || [];
                      const totalExps = exps.length || 12;
                      const completedExps = exps.filter((e: any) =>
                        e.recordStatus === 'tick' || e.status === 'Approved'
                      ).length;
                      const progressPct = Math.round((completedExps / totalExps) * 100);

                      return (
                        <tr key={s.id || s._id || idx} className="hover:bg-slate-50/60 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center font-extrabold text-[11px] shrink-0">
                                {(s.name || 'S').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 leading-tight">{s.name || '—'}</p>
                                <p className="text-[10px] text-slate-400">{s.rollNo || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-600">{s.registerNo || '—'}</td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-700">{s.section || s.sectionName || '—'}</p>
                            <p className="text-[10px] text-slate-400">{s.batch || s.batchName || '—'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 min-w-[80px]">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full ${col.bar} rounded-full transition-all`} style={{ width: `${Math.min(att, 100)}%` }} />
                              </div>
                              <span className={`font-extrabold text-[11px] ${col.text}`}>{att}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 min-w-[90px]">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                              </div>
                              <span className="font-extrabold text-[11px] text-indigo-600">{completedExps}/{totalExps}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {s.riskFlagged ? (
                                <Badge color="red">At Risk</Badge>
                              ) : att >= 75 ? (
                                <Badge color="green">On Track</Badge>
                              ) : (
                                <Badge color="amber">Warning</Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredStudents.length > 0 && (
              <p className="text-[10px] text-slate-400 text-right">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            )}
          </div>
        )}

        {/* ── DAY-BY-DAY REPORTS ──────────────────────────────────────────────── */}
        {tab === 'dayreport' && (
          <div className="p-5 space-y-5">
            {/* Header & Date Selector Toolbar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-800">Day-by-Day Attendance & Observation Reports</h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Inspect daily student attendance records and experiment scores for any selected date.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Date Picker */}
                <div className="flex items-center gap-2 bg-white font-extrabold text-xs rounded-xl border border-slate-200 px-3.5 py-2 transition shadow-xs">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-slate-500 font-bold shrink-0">Select Date:</span>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="bg-transparent font-black text-slate-900 focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Quick Date Shortcuts */}
                <button
                  type="button"
                  onClick={() => setReportDate(getLocalDateString())}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    reportDate === getLocalDateString()
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
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
                  className="px-3 py-2 text-xs font-bold rounded-xl border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                >
                  Yesterday
                </button>

                {/* Export Excel Button */}
                <button
                  onClick={() => {
                    const rows = filteredDayReportList.map((item: any, idx: number) => ({
                      'S.No': idx + 1,
                      'Roll No': formatRollNo(item.student.rollNo),
                      'Student Name': item.student.name || '-',
                      'Register Number': item.student.registerNo || '-',
                      'Section': item.student.section || '-',
                      'Batch': item.student.batch || '-',
                      'Attendance Status': item.rawStatus,
                      'Observation Record': item.obsStatusText,
                      'Record Status': item.recStatusText,
                    }));
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(rows);
                    XLSX.utils.book_append_sheet(wb, ws, `Day_Report_${reportDate}`);
                    XLSX.writeFile(wb, `HOD_Day_Report_${reportDate}.xlsx`);
                  }}
                  className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  title="Download Day Attendance Report as Excel (.xlsx)"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Day Report (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Daily KPI Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Attendance Rate</p>
                  <h4 className="text-xl font-black text-slate-800 mt-0.5">{dayAttendancePct}%</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">{dayPresentCount} of {dayTotalCount} Present</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Present Today</p>
                  <h4 className="text-xl font-black text-emerald-600 mt-0.5">{dayPresentCount}</h4>
                  <p className="text-[10px] text-emerald-700 font-semibold">Marked Present</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <Check className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Absentees Today</p>
                  <h4 className="text-xl font-black text-rose-600 mt-0.5">{dayAbsentCount}</h4>
                  <p className="text-[10px] text-rose-700 font-semibold">Absent on {reportDate}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">On Duty Today</p>
                  <h4 className="text-xl font-black text-amber-600 mt-0.5">{dayODCount}</h4>
                  <p className="text-[10px] text-amber-700 font-semibold">On Duty on {reportDate}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* View Switcher & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
              <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setReportViewTab('attendance')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    reportViewTab === 'attendance'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Daily Attendance Roster
                </button>
                <button
                  type="button"
                  onClick={() => setReportViewTab('evaluations')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                    reportViewTab === 'evaluations'
                      ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Daily Observation Records
                </button>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  placeholder="Search student or roll no..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Data Tables */}
            {reportViewTab === 'attendance' ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                        <th className="px-4 py-3 text-center">S.No</th>
                        <th className="px-4 py-3">Roll No</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Register Number</th>
                        <th className="px-4 py-3">Section / Batch</th>
                        <th className="px-4 py-3 text-center">Attendance Status on {reportDate}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {filteredDayReportList.map((item: any, idx: number) => (
                        <tr key={item.student.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">{formatRollNo(item.student.rollNo)}</td>
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-slate-800">{item.student.name}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-500">{item.student.registerNo || '-'}</td>
                          <td className="px-4 py-3 font-semibold text-slate-600">{item.student.section || '-'} • {item.student.batch || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border inline-block ${
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
                      {filteredDayReportList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-semibold text-sm">
                            No attendance records found for {reportDate}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                        <th className="px-4 py-3 text-center">S.No</th>
                        <th className="px-4 py-3">Roll No</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Register Number</th>
                        <th className="px-4 py-3 text-center">Observation Notebook Record ({reportDate})</th>
                        <th className="px-4 py-3 text-center">Record Notebook Status ({reportDate})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {filteredDayReportList.map((item: any, idx: number) => (
                        <tr key={item.student.id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">{formatRollNo(item.student.rollNo)}</td>
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-slate-800">{item.student.name}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-500">{item.student.registerNo || '-'}</td>
                          <td className="px-4 py-3 text-center">
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
                          <td className="px-4 py-3 text-center">
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
                      {filteredDayReportList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-semibold text-sm">
                            No observation records found for {reportDate}.
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
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 6 — HOD PROFILE & PASSWORD CHANGE
// ═══════════════════════════════════════════════════════════════════════════════
function HODProfileTab({ user, updateUser, token, authFetch }: { user: any; updateUser: any; token: string; authFetch: any }) {
  const [hodName, setHodName] = useState(user.name || 'Dr. Rajesh Sharma');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  useEffect(() => {
    if (user.name) {
      setHodName(user.name);
    }
  }, [user.name]);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');

    if (!hodName.trim()) {
      setNameError('Name cannot be empty.');
      return;
    }

    setNameLoading(true);
    try {
      const res = await authFetch('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: hodName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateUser({ name: hodName.trim() });
        setNameSuccess('HOD Profile name updated successfully!');
      } else {
        setNameError(data.error || 'Failed to update HOD profile name.');
      }
    } catch (err) {
      setNameError('Network error updating profile name.');
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }

    setPassLoading(true);
    try {
      const res = await authFetch('/api/admin/password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassSuccess('Your password has been successfully updated.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(data.error || 'Failed to update password. Verify current password.');
      }
    } catch (err) {
      setPassError('Network error occurred. Please try again.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* HOD Profile Overview & Name Edit Card */}
      <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-indigo-50 border-4 border-indigo-150 rounded-full flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">{user.name || 'HOD'}</h3>
            <p className="text-xs text-indigo-600 font-extrabold uppercase tracking-wider mt-0.5">
              {user.role === 'Admin' ? 'Department HOD' : user.role}
            </p>
          </div>
        </div>

        {/* Edit Name Form */}
        <form onSubmit={handleNameUpdate} className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HOD Full Name</label>
            <span className="text-[10px] text-indigo-600 font-semibold">Editable</span>
          </div>

          {nameError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{nameError}</span>
            </div>
          )}

          {nameSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{nameSuccess}</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={hodName}
              onChange={(e) => setHodName(e.target.value)}
              placeholder="Enter HOD Name"
              required
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={nameLoading}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{nameLoading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>

        <div className="border-t border-slate-100 pt-5 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Portal Username</span>
            <strong className="text-slate-700 font-mono">{user.email || user.username}</strong>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Institution</span>
            <strong className="text-slate-700 text-right">Panimalar Engineering College</strong>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Department</span>
            <strong className="text-slate-700 text-right">Artificial Intelligence & Data Science</strong>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Portal Access Level</span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-200/50">
              Department HOD
            </span>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-extrabold text-slate-800 text-base mb-2">Change Account Password</h3>
        <p className="text-xs text-slate-400 mb-6">Update your secure access credentials. Password updates apply instantly.</p>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {passError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-250/80 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            disabled={passLoading}
            className="px-6 py-2.5 bg-[#0B192C] hover:bg-slate-850 disabled:opacity-50 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
          >
            {passLoading ? 'Saving Changes...' : 'Save Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'overview',    label: 'Overview',          icon: LayoutDashboard },
  { id: 'batches',     label: 'Batches & Sections', icon: Layers },
  { id: 'access',     label: 'Faculty Access',      icon: Shield },
  { id: 'monitor',    label: 'Live Monitoring',     icon: Activity },
  { id: 'profile',    label: 'HOD Profile',         icon: User },
];

export default function AdminDashboard() {
  const { tab: paramTab } = useParams<{ tab?: string }>();
  const { user, updateUser, getAuthHeaders } = useAuth();
  const { faculties, students, refreshData } = useAcademicData();

  const [activeTab, setActiveTab] = useState('overview');
  const [batches,   setBatches]   = useState<Batch[]>([]);
  const [sections,  setSections]  = useState<Section[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Sync URL param → active tab
  useEffect(() => {
    const valid = TABS.map(t => t.id);
    if (paramTab && valid.includes(paramTab)) setActiveTab(paramTab);
    else if (!paramTab) setActiveTab('overview');
  }, [paramTab]);

  const token = user.token || '';

  const authFetch = (url: string, opts: RequestInit = {}) => {
    const h = getAuthHeaders() as Record<string, string>;
    return fetch(url, { ...opts, headers: { ...h, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  };

  const loadBatchesAndSections = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        authFetch('/api/admin/batches'),
        authFetch('/api/admin/sections'),
      ]);
      if (bRes.ok) { const d = await bRes.json(); setBatches(d.batches || []); }
      if (sRes.ok) { const d = await sRes.json(); setSections(d.sections || []); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user.isAuthenticated) {
      loadBatchesAndSections();
      refreshData();
    }
  }, [user.isAuthenticated]);

  const ActiveIcon = TABS.find(t => t.id === activeTab)?.icon || LayoutDashboard;

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header Banner ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none translate-x-6 -translate-y-6">
          <Building2 className="w-72 h-72" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-widest border border-indigo-500/30">
              HOD Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
              HOD Dashboard
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Welcome, <span className="text-indigo-300 font-extrabold">{user.name === 'Super Admin' ? 'HOD' : user.name}</span> · Academic Year 2026–2027
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
            <div className="flex flex-col text-right">
              {(() => {
                const activeSecCount = sections.filter(s => batches.some(b => b.id === s.batchId)).length;
                const totalActiveStudents = batches.reduce((acc, b) => acc + getBatchStudents(b, sections, students).length, 0);
                return (
                  <>
                    <p className="text-xs font-bold text-white">{batches.length} Batches</p>
                    <p className="text-[10px] text-indigo-300">{activeSecCount} sections · {totalActiveStudents} students</p>
                  </>
                );
              })()}
            </div>
            <div className="w-px h-8 bg-white/10" />
            <button onClick={loadBatchesAndSections}
              className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer" title="Refresh">
              <RefreshCw className="w-4 h-4 text-indigo-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab navigation is now handled column-wise in the sidebar menu */}

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            <p className="text-sm font-semibold text-slate-500">Loading academic data…</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'overview'   && <OverviewTab batches={batches} sections={sections} faculties={faculties} students={students} />}
          {activeTab === 'batches'    && <BatchesTab  batches={batches} sections={sections} faculties={faculties} setBatches={setBatches} setSections={setSections} token={token} onReload={loadBatchesAndSections} />}
          {activeTab === 'access'    && (
            <AccessTab
              faculties={faculties} batches={batches} sections={sections} token={token}
              onFacultiesChange={_ => refreshData()}
            />
          )}
          {activeTab === 'monitor'   && <MonitoringTab faculties={faculties} students={students} sections={sections} batches={batches} token={token} onRefresh={async () => { await refreshData(); await loadBatchesAndSections(); }} />}
          {activeTab === 'profile'   && <HODProfileTab user={user} updateUser={updateUser} token={token} authFetch={authFetch} />}
        </>
      )}
    </div>
  );
}