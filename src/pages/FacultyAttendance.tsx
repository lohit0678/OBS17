import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import { ClipboardCheck, Calendar, BookOpen, User, Check, X, CheckCircle, XCircle } from 'lucide-react';

export default function FacultyAttendance() {
  const { user } = useAuth();
  const { getFacultyStudents, getFacultyData, updateStudentAttendance } = useAcademicData();

  const facultyData = getFacultyData(user.id);
  const myStudents = getFacultyStudents(user.id);

  // States for selection header
  const [selectedLab, setSelectedLab] = useState(facultyData?.labName || 'Data Structures & Algorithms Lab');
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [selectedDate, setSelectedDate] = useState('2026-07-08');

  // Derive unique batches from faculty's students
  const batches = ['All Batches', ...Array.from(new Set(myStudents.map((s) => s.batch)))];

  // Filter students based on batch selection
  const filteredStudents = selectedBatch === 'All Batches'
    ? myStudents
    : myStudents.filter((s) => s.batch === selectedBatch);

  // Handle Attendance Toggle
  const handleToggle = (studentId: string, status: 'Present' | 'Absent' | 'On Duty') => {
    updateStudentAttendance(studentId, selectedDate, status);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Mark Laboratory Attendance</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Perform digital roll-calls for daily lab sessions. Attendance and risk calculations are recompiled immediately.
        </p>
      </div>

      {/* 1. DATA SELECTION HEADER CARD */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Lab Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            Laboratory Course
          </label>
          <select
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer"
          >
            <option value="Data Structures & Algorithms Lab">Data Structures & Algorithms Lab</option>
            <option value="Database Management Systems Lab">Database Management Systems Lab</option>
            <option value="Compiler Design & Network Lab">Compiler Design & Network Lab</option>
          </select>
        </div>

        {/* Batch Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            Laboratory Batch / Section
          </label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer"
          >
            {batches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Session Date Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            Session Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 2. ATTENDANCE ROSTER SHEET */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Sheet Title */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="font-bold text-slate-800 text-sm tracking-wide flex items-center gap-2">
              <ClipboardCheck className="w-4.5 h-4.5 text-indigo-500" />
              SESSION ATTENDANCE ROSTER — {selectedBatch.toUpperCase()}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
              Date: {selectedDate} &bull; Enrolled Students: {filteredStudents.length}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
              Active Toggles
            </span>
          </div>
        </div>

        {/* Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4.5">Student Profile</th>
                <th className="px-6 py-4.5">Student ID</th>
                <th className="px-6 py-4.5">Batch</th>
                <th className="px-6 py-4.5 text-center">Cumulative Attendance</th>
                <th className="px-6 py-4.5 text-center">Session Mark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  // Find if status for selectedDate is already defined in history
                  const historyItem = student.attendanceHistory.find((h) => h.date === selectedDate);
                  const currentStatus = historyItem ? historyItem.status : null;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/40 transition">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{student.email}</p>
                        </div>
                      </td>
                      {/* ID */}
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {student.id}
                      </td>
                      {/* Batch */}
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                        {student.batch}
                      </td>
                      {/* Cumulative attendance */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-extrabold ${student.attendance >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {student.attendance}%
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase">
                            {student.attendance >= 75 ? 'GOOD STANDING' : 'ATTENDANCE RISK'}
                          </span>
                        </div>
                      </td>
                      {/* Dynamic Present / Absent / On Duty mark buttons */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2.5">
                          {/* Mark Present */}
                          <button
                            onClick={() => handleToggle(student.id, 'Present')}
                            className={`flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm border cursor-pointer ${
                              currentStatus === 'Present'
                                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                            }`}
                          >
                            <Check className="w-4 h-4 shrink-0" />
                            Present
                          </button>

                          {/* Mark Absent */}
                          <button
                            onClick={() => handleToggle(student.id, 'Absent')}
                            className={`flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm border cursor-pointer ${
                              currentStatus === 'Absent'
                                ? 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700'
                            }`}
                          >
                            <X className="w-4 h-4 shrink-0" />
                            Absent
                          </button>

                          {/* Mark On Duty */}
                          <button
                            onClick={() => handleToggle(student.id, 'On Duty')}
                            className={`flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-sm border cursor-pointer ${
                              currentStatus === 'On Duty'
                                ? 'bg-amber-600 border-amber-600 text-white hover:bg-amber-700'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700'
                            }`}
                          >
                            <span className="font-extrabold text-[10px] shrink-0">OD</span>
                            On Duty
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400 font-medium">
                    No registered students found in selected batch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
