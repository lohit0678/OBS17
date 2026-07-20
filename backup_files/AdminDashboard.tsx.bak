import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import * as XLSX from 'xlsx';
import {
  LayoutDashboard, Users, BookOpen, Shield, Bell,
  Plus, Upload, ChevronDown, X, Check, AlertTriangle,
  GraduationCap, Building2, Calendar, FileSpreadsheet,
  Layers, UserCheck, Trash2, RefreshCw, Eye, BookOpenCheck,
  ClipboardList, Send, Search, Mail, Pencil, Activity,
  Wifi, WifiOff, TrendingUp
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEGREE_OPTIONS  = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc'];
const YEAR_OPTIONS    = ['2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029'];
const DEPT_OPTIONS    = ['AI & DS', 'CSE', 'ECE', 'EEE', 'Mechanical', 'Civil'];
const DAYS_OF_WEEK    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SEMESTER_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Batch  { id: string; name: string; year: string; department: string; isActive: boolean; }
interface Section { id: string; batchId: string; name: string; timetableStructureId: string; timetable?: any[]; }
interface ParsedTimetableRow { day: string; period: string; subject: string; faculty: string; }

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
  const activeBatches  = batches.filter(b => b.isActive).length;
  const totalStudents  = students.length;
  const activeFaculty  = faculties.filter(f => f.isActive).length;
  const riskStudents   = students.filter((s: any) => s.riskFlagged).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Layers}       label="Active Batches"   value={activeBatches}  sub={`${batches.length} total`}    color="blue"   />
        <StatCard icon={BookOpenCheck} label="Sections"         value={sections.length} sub="across all batches"          color="purple" />
        <StatCard icon={GraduationCap} label="Total Students"   value={totalStudents}  sub={`${riskStudents} at risk`}    color="green"  />
        <StatCard icon={UserCheck}    label="Active Faculty"   value={activeFaculty}  sub={`${faculties.length} pre-approved`} color="amber"  />
      </div>

      {/* Quick summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                return (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{b.name}</p>
                      <p className="text-[10px] text-slate-500">{b.department} · {b.year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color="purple">{secCount} section{secCount !== 1 ? 's' : ''}</Badge>
                      <Badge color={b.isActive ? 'green' : 'slate'}>{b.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />At-Risk Students
          </h3>
          {riskStudents === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl">
              <Check className="w-5 h-5 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-700">All students are on track!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.filter((s: any) => s.riskFlagged).slice(0, 4).map((s: any) => (
                <div key={s.id} className="flex items-start justify-between p-3 bg-red-50 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{s.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{s.riskReason}</p>
                  </div>
                  <Badge color="red">{s.attendance}% att.</Badge>
                </div>
              ))}
              {riskStudents > 4 && (
                <p className="text-xs text-slate-500 text-center pt-1">+{riskStudents - 4} more at-risk students</p>
              )}
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
  const [form, setForm] = useState({ name: '', registerNo: '', rollNo: '', email: '', phone: '', semester: 'III' });

  const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

  useEffect(() => {
    authFetch(`/api/admin/sections/${section.id}/students`)
      .then(r => r.json())
      .then(d => {
        const list = d.students || [];
        setStudents(list);
        if (list.length > 0 && list[0].semester) {
          setSectionSemester(list[0].semester);
          setForm(p => ({ ...p, semester: list[0].semester }));
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
        body: JSON.stringify({ semester: sectionSemester }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        setToast({ msg: `Updated semester to "${sectionSemester}" for all ${students.length} students!`, type: 'success' });
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
    try {
      const res = await authFetch(`/api/admin/students/${studentId}/semester`, {
        method: 'PUT',
        body: JSON.stringify({ semester: newSem }),
      });
      if (res.ok) {
        setStudents(prev => prev.map(s => s.id === studentId ? { ...s, semester: newSem } : s));
        setToast({ msg: `Semester updated to ${newSem}`, type: 'success' });
      }
    } catch {
      setToast({ msg: 'Failed to update semester', type: 'error' });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/sections/${section.id}/students`, {
        method: 'POST', body: JSON.stringify({ ...form, semester: form.semester || sectionSemester }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        setForm({ name: '', registerNo: '', rollNo: '', email: '', phone: '', semester: sectionSemester });
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

        const parsedStudents: { name: string; registerNo: string; rollNo: string; semester: string }[] = [];

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
            parsedStudents.push({ name, registerNo, rollNo, semester: sectionSemester });
          }
        }

        if (parsedStudents.length === 0) {
          setToast({ msg: 'No valid student rows found. Ensure columns: S.NO, ROLL NO, REGISTER NUMBER, NAME', type: 'error' });
          setSaving(false);
          return;
        }

        const res = await authFetch(`/api/admin/sections/${section.id}/bulk-students`, {
          method: 'POST',
          body: JSON.stringify({ students: parsedStudents, semester: sectionSemester }),
        });
        const data = await res.json();
        if (res.ok) {
          setStudents(data.students || []);
          setToast({
            msg: `Bulk Import Complete: Successfully processed ${parsedStudents.length} students into Semester ${sectionSemester} (Added ${data.addedCount || 0}, Updated ${data.updatedCount || 0})!`,
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
              Section Semester Setting
            </h4>
            <p className="text-[11px] text-indigo-700 font-medium">
              Set or update the semester for all enrolled students in this section.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sectionSemester}
            onChange={e => {
              setSectionSemester(e.target.value);
              setForm(p => ({ ...p, semester: e.target.value }));
            }}
            className="px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-extrabold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            {SEMESTER_OPTIONS.map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
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
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id || i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{s.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.registerNo}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.rollNo}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={s.semester || sectionSemester}
                        onChange={e => handleSingleStudentSemesterChange(s.id, e.target.value)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold rounded-lg border border-indigo-200/60 focus:outline-none cursor-pointer"
                      >
                        {SEMESTER_OPTIONS.map(sem => (
                          <option key={sem} value={sem}>Sem {sem}</option>
                        ))}
                      </select>
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
        <SelectField label="Academic Year" id="eb-year" value={form.year} onChange={v => setForm(p => ({ ...p, year: v }))} options={YEAR_OPTIONS} required />
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

function BatchesTab({ batches, sections, setBatches, setSections, token, onReload }: {
  batches: Batch[]; sections: Section[];
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

  const { refreshData, setStudents, setFaculties } = useAcademicData();

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to delete "${batchName}" and all its associated sections and student records?`)) return;
    try {
      const res = await authFetch(`/api/admin/batches/${batchId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.batches) setBatches(data.batches);
        if (data.sections) setSections(data.sections);
        if (data.students) setStudents(data.students);
        if (data.faculties) setFaculties(data.faculties);
        setToast({ msg: `Batch "${batchName}" and all linked student/section records deleted from database!`, type: 'success' });
        if (onReload) onReload();
      } else {
        setToast({ msg: data.error || 'Delete failed', type: 'error' });
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
            <SelectField label="Academic Year"     id="b-year" value={batchForm.year} onChange={v => setBatchForm(p => ({ ...p, year: v }))} options={YEAR_OPTIONS}   required />
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
            const batchSections = sections.filter(s => s.batchId === batch.id);
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
                        <span className="text-[10px] text-slate-400">{batchSections.length} section{batchSections.length !== 1 ? 's' : ''}</span>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 3 — TIMETABLE BUILDER
// ═══════════════════════════════════════════════════════════════════════════════
function TimetableBuilderTab({ sections, batches, token }: {
  sections: Section[]; batches: Batch[]; token: string;
}) {
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [parsedRows,  setParsedRows]  = useState<ParsedTimetableRow[]>([]);
  const [parseCount,  setParseCount]  = useState<number | null>(null);
  const [grid, setGrid] = useState<Record<string, Record<string, { subject: string; faculty: string }>>>({});
  const [periods] = useState(['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6']);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

  // Initialize empty grid
  useEffect(() => {
    const g: typeof grid = {};
    DAYS_OF_WEEK.forEach(day => {
      g[day] = {};
      periods.forEach(p => { g[day][p] = { subject: '', faculty: '' }; });
    });
    setGrid(g);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb  = XLSX.read(evt.target?.result, { type: 'binary' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const colAliases: Record<string, string[]> = {
          day:     ['Day', 'day', 'DAY'],
          period:  ['Period', 'Period Name', 'period', 'PeriodName'],
          subject: ['Subject', 'Subject Code', 'SubjectCode', 'subject'],
          faculty: ['Faculty', 'Faculty Name', 'FacultyName', 'faculty'],
        };

        function pick(row: any, keys: string[]): string {
          for (const k of keys) if (row[k] !== undefined && row[k] !== '') return String(row[k]).trim();
          return '';
        }

        const parsed: ParsedTimetableRow[] = rows.map(row => ({
          day:     pick(row, colAliases.day),
          period:  pick(row, colAliases.period),
          subject: pick(row, colAliases.subject),
          faculty: pick(row, colAliases.faculty),
        })).filter(r => r.day && r.period);

        setParsedRows(parsed);
        setParseCount(parsed.length);

        // Auto-fill grid
        const newGrid = { ...grid };
        parsed.forEach(({ day, period, subject, faculty }) => {
          const normDay = DAYS_OF_WEEK.find(d => d.toLowerCase() === day.toLowerCase());
          const normPeriod = periods.find(p => p.toLowerCase().includes(period.toLowerCase()) || period.toLowerCase().includes(p.toLowerCase().replace('period ', '')));
          if (normDay && normPeriod) {
            if (!newGrid[normDay]) newGrid[normDay] = {};
            newGrid[normDay][normPeriod] = { subject, faculty };
          }
        });
        setGrid(newGrid);
        setToast({ msg: `Parsed ${parsed.length} rows — grid auto-populated!`, type: 'success' });
      } catch {
        setToast({ msg: 'Failed to parse Excel file', type: 'error' });
      }
    };
    reader.readAsBinaryString(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSave = async () => {
    if (!selectedSectionId) { setToast({ msg: 'Select a section first', type: 'error' }); return; }
    setSaving(true);
    // Convert grid to timetable entries
    const timetable: any[] = [];
    Object.entries(grid).forEach(([day, dayData]) => {
      Object.entries(dayData).forEach(([periodId, cell]) => {
        if (cell.subject) {
          timetable.push({ day, periodId, subjectId: cell.subject, facultyId: cell.faculty, room: '' });
        }
      });
    });
    try {
      const res = await authFetch(`/api/admin/sections/${selectedSectionId}/timetable`, {
        method: 'POST', body: JSON.stringify({ timetable }),
      });
      if (res.ok) {
        setToast({ msg: 'Timetable saved successfully!', type: 'success' });
      } else {
        const d = await res.json();
        setToast({ msg: d.error || 'Save failed', type: 'error' });
      }
    } catch { setToast({ msg: 'Network error', type: 'error' }); }
    finally { setSaving(false); }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedBatch   = selectedSection ? batches.find(b => b.id === selectedSection.batchId) : undefined;

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Timetable Builder</h2>
          <p className="text-xs text-slate-500 mt-0.5">Upload an Excel sheet or fill the grid manually to set up timetables.</p>
        </div>
        <div className="flex items-center gap-2">
          {parseCount !== null && (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" /> {parseCount} rows parsed
            </span>
          )}
          <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition shadow-sm">
            <Upload className="w-3.5 h-3.5" /> Upload Timetable Excel
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Excel format hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 font-medium">
        <strong>Expected Excel columns:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded">Day</code> ·
        <code className="bg-blue-100 px-1.5 py-0.5 rounded ml-1">Period</code> ·
        <code className="bg-blue-100 px-1.5 py-0.5 rounded ml-1">Subject</code> ·
        <code className="bg-blue-100 px-1.5 py-0.5 rounded ml-1">Faculty</code> — aliases like
        "Period Name", "Subject Code", "Faculty Name" are also accepted.
      </div>

      {/* Section selector */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Select Section</label>
            <select
              value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer"
            >
              <option value="">— Choose a section —</option>
              {sections.map(s => {
                const b = batches.find(b => b.id === s.batchId);
                return <option key={s.id} value={s.id}>{b ? `${b.name} — ` : ''}{s.name}</option>;
              })}
            </select>
          </div>
          {selectedBatch && (
            <div className="flex items-end">
              <div className="px-4 py-2.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
                {selectedBatch.name} · {selectedBatch.department} · {selectedBatch.year}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-500" /> Weekly Timetable Grid
          </h3>
          {selectedSectionId && (
            <button
              onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition disabled:opacity-60"
            >
              {saving ? <Spinner /> : <Check className="w-3.5 h-3.5" />} Save Timetable
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-bold text-slate-600 w-28 border-b border-slate-100">Day</th>
                {periods.map(p => (
                  <th key={p} className="text-center px-3 py-3 font-bold text-slate-600 border-b border-slate-100 min-w-[140px]">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day, di) => (
                <tr key={day} className={di % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                  <td className="px-4 py-3 font-extrabold text-slate-700 border-b border-slate-50">{day}</td>
                  {periods.map(period => {
                    const cell = grid[day]?.[period] || { subject: '', faculty: '' };
                    return (
                      <td key={period} className="px-2 py-2 border-b border-slate-50">
                        <div className="flex flex-col gap-1">
                          <input
                            type="text" placeholder="Subject" value={cell.subject}
                            onChange={e => setGrid(prev => ({
                              ...prev,
                              [day]: { ...prev[day], [period]: { ...cell, subject: e.target.value } }
                            }))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition"
                          />
                          <input
                            type="text" placeholder="Faculty" value={cell.faculty}
                            onChange={e => setGrid(prev => ({
                              ...prev,
                              [day]: { ...prev[day], [period]: { ...cell, faculty: e.target.value } }
                            }))}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition"
                          />
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
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 4 — FACULTY ACCESS
// ═══════════════════════════════════════════════════════════════════════════════
function AssignSectionModal({ faculty, batches, sections, token, onClose, onSave }: {
  faculty: any; batches: Batch[]; sections: Section[];
  token: string; onClose: () => void; onSave: (facultyId: string, batchId: string, sectionId: string) => void;
}) {
  const [batchId, setBatchId] = useState(faculty.batchId || '');
  const [sectionId, setSectionId] = useState(faculty.sectionId || '');
  const [subjectName, setSubjectName] = useState(faculty.subjectName || faculty.subjectsHandled?.[0] || '');
  const [subjectCode, setSubjectCode] = useState(faculty.subjectCode || '');
  const [labName, setLabName] = useState(faculty.labName || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error' } | null>(null);

  const batchSections = sections.filter(s => s.batchId === batchId);

  const authFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, { ...opts, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });

  const handleAssign = async () => {
    setSaving(true);
    try {
      const targetId = faculty.id || faculty._id || faculty.email;
      const res = await authFetch(`/api/admin/faculty/${targetId}/assign-section`, {
        method: 'PUT', body: JSON.stringify({ batchId, sectionId, subjectName, subjectCode, labName }),
      });
      const data = await res.json();
      if (res.ok) {
        onSave(targetId, batchId, sectionId);
        setToast({ msg: 'Faculty details & section assignment saved!', type: 'success' });
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

        <InputField label="Subject Name" id="assign-subj-name" value={subjectName} onChange={v => setSubjectName(v)} placeholder="e.g. Artificial Intelligence" />
        <InputField label="Subject Code" id="assign-subj-code" value={subjectCode} onChange={v => setSubjectCode(v)} placeholder="e.g. CS3501" />
        <InputField label="Lab Name" id="assign-lab-name" value={labName} onChange={v => setLabName(v)} placeholder="e.g. AI & Data Analytics Lab" />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Batch</label>
          <select
            value={batchId} onChange={e => { setBatchId(e.target.value); setSectionId(''); }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer"
          >
            <option value="">— Select Batch —</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name} — {b.department} ({b.year})</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Section</label>
          <select
            value={sectionId} onChange={e => setSectionId(e.target.value)} disabled={!batchId}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer disabled:opacity-50"
          >
            <option value="">— Select Section —</option>
            {batchSections.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {batchId && batchSections.length === 0 && (
            <p className="text-[11px] text-amber-600 font-semibold">No sections exist for this batch yet.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition">
            Cancel
          </button>
          <button onClick={handleAssign} disabled={saving || !batchId}
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

function AccessTab({ faculties, batches, sections, token, onFacultiesChange }: {
  faculties: any[]; batches: Batch[]; sections: Section[];
  token: string; onFacultiesChange: (facs: any[]) => void;
}) {
  const { addPreApprovedFaculty, deleteFaculty, clearFacultyData, uploadExcelProvisioning } = useAcademicData();

  const [search,            setSearch]            = useState('');
  const [assignModal,       setAssignModal]       = useState<any | null>(null);
  const [viewStudentsModal, setViewStudentsModal] = useState<{ faculty: any; section: Section; batch: Batch | undefined } | null>(null);
  const [showAddForm,       setShowAddForm]       = useState(false);
  const [toast,             setToast]             = useState<{ msg: string; type: 'success'|'error' } | null>(null);
  const [saving,            setSaving]            = useState(false);

  const [form, setForm] = useState({
    email: '', labName: '', subject: '', subjectCode: '', batch: '', sections: '', phone: '',
  });

  const filtered = faculties.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase()) ||
    f.department?.toLowerCase().includes(search.toLowerCase())
  );

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
                  <th className="text-left px-4 py-3 font-bold text-slate-500">Lab / Subject</th>
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
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{f.department}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-700">{f.labName}</p>
                        {f.subjectCode && <p className="text-[10px] text-slate-400">{f.subjectCode}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        {assignedSection ? (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-slate-800">{assignedSection.name}</p>
                              <p className="text-[10px] text-slate-400">{assignedBatch?.name} — {assignedBatch?.department}</p>
                            </div>
                            <button
                              onClick={() => setViewStudentsModal({ faculty: f, section: assignedSection, batch: assignedBatch || undefined })}
                              title="View Enrolled Students in Assigned Section"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg flex items-center gap-1 transition cursor-pointer shrink-0"
                            >
                              <Users className="w-3 h-3" /> Students
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge color={f.isActive ? 'green' : 'amber'}>{f.isActive ? 'Active' : 'Pending'}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {assignedSection && (
                            <button
                              onClick={() => setViewStudentsModal({ faculty: f, section: assignedSection, batch: assignedBatch || undefined })}
                              title="View Assigned Section Students"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 cursor-pointer transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
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
function MonitoringTab({ faculties, students, sections, batches, onRefresh }: {
  faculties: any[]; students: any[]; sections: any[]; batches: any[];
  onRefresh: () => Promise<void>;
}) {
  const [tab, setTab] = useState<'faculty' | 'student'>('faculty');
  const [facultySearch, setFacultySearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const getAttColor = (att: number) => {
    if (att >= 75) return { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500', badge: 'green' as const };
    if (att >= 60) return { bg: 'bg-amber-50',   text: 'text-amber-700',   bar: 'bg-amber-400',   badge: 'amber' as const };
    return          { bg: 'bg-red-50',    text: 'text-red-700',    bar: 'bg-red-500',    badge: 'red' as const };
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-5">

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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredFaculties.map(f => {
                  const sectionObj = f.sectionId ? sections.find((s: any) => s.id === f.sectionId) : null;
                  const assignedSectionNames = [
                    sectionObj?.name,
                    f.section,
                    f.sections,
                    ...(Array.isArray(f.assignedSectionIds) ? f.assignedSectionIds.map((sid: string) => sections.find((s: any) => s.id === sid)?.name || sid) : [])
                  ].filter(Boolean);

                  const sectionNameDisplay = assignedSectionNames.length > 0
                    ? Array.from(new Set(assignedSectionNames)).join(", ")
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
                    <div key={f.id} className={`bg-white border rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition-all ${
                      f.isActive ? 'border-slate-200 hover:border-indigo-200' : 'border-slate-100 opacity-70'
                    }`}>
                      {/* Header row */}
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-sm shadow">
                            {(f.name || f.email || 'F').charAt(0).toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            f.isActive ? 'bg-emerald-400' : 'bg-slate-300'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-slate-800 text-sm truncate">
                            {f.name || <span className="italic text-slate-400 font-medium">Not registered yet</span>}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5 shrink-0" />{f.email}
                          </p>
                        </div>
                        <Badge color={f.isActive ? 'green' : 'amber'}>{f.isActive ? 'Active' : 'Pending'}</Badge>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-slate-400 font-bold uppercase text-[9px]">Department</p>
                          <p className="font-extrabold text-slate-700 truncate">{f.department || '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-slate-400 font-bold uppercase text-[9px]">Subject</p>
                          <p className="font-extrabold text-slate-700 truncate">{subjectDisplayName}</p>
                          {f.subjectCode && <p className="text-[9px] text-indigo-500 font-bold mt-0.5">{f.subjectCode}</p>}
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-slate-400 font-bold uppercase text-[9px]">Lab Room</p>
                          <p className="font-extrabold text-slate-700 truncate">{f.labName || '—'}</p>
                        </div>
                        <div 
                          onClick={() => {
                            if (sectionNameDisplay && sectionNameDisplay !== 'Unassigned') {
                              const firstSec = sectionNameDisplay.split(',')[0].trim();
                              setSelectedSectionFilter(firstSec);
                              setTab('student');
                            }
                          }}
                          className={`bg-slate-50 rounded-xl px-3 py-2 ${
                            sectionNameDisplay !== 'Unassigned' ? 'cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition' : ''
                          }`}
                          title={sectionNameDisplay !== 'Unassigned' ? "Click to view section students in Student Monitoring" : ""}
                        >
                          <p className="text-slate-400 font-bold uppercase text-[9px] flex items-center justify-between">
                            <span>Assigned Section</span>
                            {sectionNameDisplay !== 'Unassigned' && <span className="text-[8px] text-indigo-600 font-black">VIEW →</span>}
                          </p>
                          <p className="font-extrabold text-slate-700 truncate">{sectionNameDisplay}</p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                        <button
                          onClick={() => {
                            if (sectionNameDisplay && sectionNameDisplay !== 'Unassigned') {
                              const firstSec = sectionNameDisplay.split(',')[0].trim();
                              setSelectedSectionFilter(firstSec);
                            }
                            setTab('student');
                          }}
                          className="flex items-center gap-1.5 hover:text-indigo-600 transition cursor-pointer text-left"
                          title="Click to monitor these students"
                        >
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition">{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
                        </button>
                        {batchName && (
                          <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                            {batchName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── STUDENT MONITORING ──────────────────────────────────────────────── */}
        {tab === 'student' && (
          <div className="p-5 space-y-5">
            {/* Section Selection Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpenCheck className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Filter Students By Section
                  </h4>
                </div>
                {selectedSectionFilter && (
                  <button
                    onClick={() => setSelectedSectionFilter('')}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Show All Sections</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Section Filter Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => setSelectedSectionFilter('')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    !selectedSectionFilter
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Sections ({students.length})
                </button>
                {availableSections.map((secName: string) => {
                  const secCount = students.filter((s: any) => {
                    const sSec = String(s.section || s.sectionName || s.sectionId || '').toLowerCase();
                    const targetSec = secName.toLowerCase();
                    return sSec === targetSec || sSec.endsWith(targetSec) || targetSec.endsWith(sSec);
                  }).length;

                  return (
                    <button
                      key={secName}
                      onClick={() => setSelectedSectionFilter(secName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                        selectedSectionFilter === secName
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{secName}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        selectedSectionFilter === secName ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {secCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

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
  { id: 'timetable',  label: 'Timetable Builder',  icon: Calendar },
  { id: 'access',     label: 'Faculty Access',      icon: Shield },
  { id: 'monitor',    label: 'Live Monitoring',     icon: Activity },
  { id: 'notify',     label: 'Notifications',       icon: Bell },
];

export default function AdminDashboard() {
  const { tab: paramTab } = useParams<{ tab?: string }>();
  const { user, getAuthHeaders } = useAuth();
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
              Admin Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Welcome, <span className="text-indigo-300 font-extrabold">{user.name}</span> · Academic Year 2026–2027
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
            <div className="flex flex-col text-right">
              <p className="text-xs font-bold text-white">{batches.length} Batches</p>
              <p className="text-[10px] text-indigo-300">{sections.length} sections · {students.length} students</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <button onClick={loadBatchesAndSections}
              className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer" title="Refresh">
              <RefreshCw className="w-4 h-4 text-indigo-300" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Nav ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex flex-wrap gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex-1 min-w-[120px] justify-center
              ${activeTab === id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {loading && activeTab !== 'notify' ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            <p className="text-sm font-semibold text-slate-500">Loading academic data…</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'overview'   && <OverviewTab batches={batches} sections={sections} faculties={faculties} students={students} />}
          {activeTab === 'batches'    && <BatchesTab  batches={batches} sections={sections} setBatches={setBatches} setSections={setSections} token={token} onReload={loadBatchesAndSections} />}
          {activeTab === 'timetable' && <TimetableBuilderTab sections={sections} batches={batches} token={token} />}
          {activeTab === 'access'    && (
            <AccessTab
              faculties={faculties} batches={batches} sections={sections} token={token}
              onFacultiesChange={_ => refreshData()}
            />
          )}
          {activeTab === 'monitor'   && <MonitoringTab faculties={faculties} students={students} sections={sections} batches={batches} onRefresh={async () => { await refreshData(); await loadBatchesAndSections(); }} />}
          {activeTab === 'notify'    && <NotificationsTab batches={batches} token={token} />}
        </>
      )}
    </div>
  );
}