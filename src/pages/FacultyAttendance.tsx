import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import { ClipboardCheck, Calendar, BookOpen, User, Check, X, CheckCircle, XCircle } from 'lucide-react';

export default function FacultyAttendance() {
  const { user } = useAuth();
  const { getFacultyStudents, getFacultyData, updateStudentAttendance, updateBatchStudentAttendance, refreshData } = useAcademicData();

  const facultyData = getFacultyData(user.email || user.id);
  const myStudents = getFacultyStudents(user.email || user.id);

  const labName = facultyData?.labName || facultyData?.subjectName || 'Assigned Practical Lab';
  const subjectName = facultyData?.subjectName || facultyData?.subjectsHandled?.[0] || 'Assigned Practical Lab';
  const subjectCode = facultyData?.subjectCode || '';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

  const [selectedLab, setSelectedLab] = useState(labName);
  const [selectedBatch, setSelectedBatch] = useState('All Batches');
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [localAttendance, setLocalAttendance] = useState<Record<string, 'Present' | 'Absent' | 'On Duty'>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Immediate render-phase reset when user account or date changes to prevent state leakage
  const [currentKey, setCurrentKey] = useState(`${user.id}_${user.email}_${selectedDate}`);
  if (currentKey !== `${user.id}_${user.email}_${selectedDate}`) {
    setCurrentKey(`${user.id}_${user.email}_${selectedDate}`);
    setLocalAttendance({});
    setIsDirty(false);
    setSavedMessage(null);
  }

  // Derive unique batches & sections from faculty's students
  const batches = ['All Batches', ...Array.from(new Set(myStudents.map((s) => s.batch || s.section).filter(Boolean)))];

  // Filter students based on batch selection
  const filteredStudents = (!selectedBatch || selectedBatch === 'All' || selectedBatch === 'All Batches' || selectedBatch === 'All Sections')
    ? myStudents
    : myStudents.filter((s) => s.batch === selectedBatch || s.section === selectedBatch || s.sectionId === selectedBatch);

  // Handle Attendance Toggle (Buffers change locally until Confirm is clicked)
  const handleToggle = (studentId: string, status: 'Present' | 'Absent' | 'On Duty') => {
    setLocalAttendance((prev) => ({ ...prev, [studentId]: status }));
    setIsDirty(true);
    setSavedMessage(null);
  };

  // Quick helper to mark all currently filtered students as Present locally
  const handleMarkAllPresent = () => {
    const updated: Record<string, 'Present'> = {};
    filteredStudents.forEach((st) => {
      updated[st.id] = 'Present';
    });
    setLocalAttendance((prev) => ({ ...prev, ...updated }));
    setIsDirty(true);
    setSavedMessage(null);
  };

  // Confirm & Save Attendance to Database and refresh overview statistics
  const handleConfirmAttendance = async () => {
    if (filteredStudents.length === 0) return;
    setIsSaving(true);
    setSavedMessage(null);

    const facEmail = (user.email || "").toLowerCase();
    const facId = (user.id || "").toLowerCase();
    const facData = getFacultyData(user.email || user.id);
    const dbFacId = (facData?.id || "").toLowerCase();
    const dbFacEmail = (facData?.email || "").toLowerCase();

    try {
      const itemsToSave = filteredStudents.map((student) => {
        const selectedDateRecords = (student.attendanceHistory || []).filter((h: any) => h.date === selectedDate);
        let myItem = selectedDateRecords.find((h: any) => {
          const facultyMatches =
            (h.facultyEmail && facEmail && h.facultyEmail.toLowerCase() === facEmail) ||
            (h.facultyEmail && dbFacEmail && h.facultyEmail.toLowerCase() === dbFacEmail) ||
            (h.facultyId && facId && h.facultyId.toLowerCase() === facId) ||
            (h.facultyId && dbFacId && h.facultyId.toLowerCase() === dbFacId);
          if (!facultyMatches) return false;
          if (subjectCode && h.subjectCode && h.subjectCode.toLowerCase() !== subjectCode.toLowerCase()) return false;
          return true;
        });
        if (!myItem && selectedDateRecords.length > 0) {
          myItem = selectedDateRecords.find((h: any) => !h.facultyId && !h.facultyEmail) || selectedDateRecords[selectedDateRecords.length - 1];
        }

        const statusToSave = localAttendance[student.id] || (myItem ? myItem.status : 'Present');
        return { studentId: student.id, status: statusToSave };
      });

      await updateBatchStudentAttendance(itemsToSave, selectedDate, subjectCode, subjectName);
      await refreshData();

      setIsDirty(false);
      setSavedMessage("Attendance confirmed and saved successfully to database & overview!");
      setTimeout(() => setSavedMessage(null), 4000);
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to save attendance. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
            <option value={labName}>{labName}</option>
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
        {/* Saved Success Notification Banner */}
        {savedMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-xs font-bold text-emerald-800 flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {savedMessage}
            </span>
            <span className="text-[10px] text-emerald-600 uppercase font-black tracking-wider">Synced with Overview</span>
          </div>
        )}

        {/* Sheet Title & Actions */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h4 className="font-bold text-slate-800 text-sm tracking-wide flex items-center gap-2">
              <ClipboardCheck className="w-4.5 h-4.5 text-indigo-500" />
              SESSION ATTENDANCE ROSTER — {selectedBatch.toUpperCase()}
              {isDirty && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full border border-amber-200 uppercase tracking-wider animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
              Date: {selectedDate} &bull; Enrolled Students: {filteredStudents.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick action: Mark all present */}
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
            >
              Mark All Present
            </button>

            {/* CONFIRM & SAVE ATTENDANCE BUTTON */}
            <button
              type="button"
              onClick={handleConfirmAttendance}
              disabled={isSaving || filteredStudents.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                isSaving
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : isDirty
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white ring-2 ring-indigo-500/30 animate-bounce-short shadow-indigo-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{isDirty ? 'Confirm & Save Attendance' : 'Attendance Confirmed'}</span>
                </>
              )}
            </button>
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
                  const facEmail = (user.email || "").toLowerCase();
                  const facId = (user.id || "").toLowerCase();
                  const facData = getFacultyData(user.email || user.id);
                  const dbFacId = (facData?.id || "").toLowerCase();
                  const dbFacEmail = (facData?.email || "").toLowerCase();

                  // Find if status for selectedDate is already defined in history (prioritize current faculty match, then fallback to legacy/seed records)
                  const selectedDateRecords = (student.attendanceHistory || []).filter((h: any) => h.date === selectedDate);
                  let myItem = selectedDateRecords.find((h: any) => {
                    const facultyMatches =
                      (h.facultyEmail && facEmail && h.facultyEmail.toLowerCase() === facEmail) ||
                      (h.facultyEmail && dbFacEmail && h.facultyEmail.toLowerCase() === dbFacEmail) ||
                      (h.facultyId && facId && h.facultyId.toLowerCase() === facId) ||
                      (h.facultyId && dbFacId && h.facultyId.toLowerCase() === dbFacId);
                    if (!facultyMatches) return false;
                    if (subjectCode && h.subjectCode && h.subjectCode.toLowerCase() !== subjectCode.toLowerCase()) return false;
                    return true;
                  });
                  if (!myItem && selectedDateRecords.length > 0) {
                    myItem = selectedDateRecords.find((h: any) => !h.facultyId && !h.facultyEmail) || selectedDateRecords[selectedDateRecords.length - 1];
                  }
                  const historyItem = myItem;
                  const currentStatus = localAttendance[student.id] || (historyItem ? historyItem.status : 'Present');

                  // Calculate faculty's subject cumulative attendance %
                  const facultyHistory = (student.attendanceHistory || []).filter((h: any) => {
                    const facultyMatches =
                      (h.facultyEmail && facEmail && h.facultyEmail.toLowerCase() === facEmail) ||
                      (h.facultyEmail && dbFacEmail && h.facultyEmail.toLowerCase() === dbFacEmail) ||
                      (h.facultyId && facId && h.facultyId.toLowerCase() === facId) ||
                      (h.facultyId && dbFacId && h.facultyId.toLowerCase() === dbFacId) ||
                      (!h.facultyId && !h.facultyEmail);
                    if (!facultyMatches) return false;
                    if (subjectCode && h.subjectCode && h.subjectCode.toLowerCase() !== subjectCode.toLowerCase()) return false;
                    return true;
                  });
                  const presentCount = facultyHistory.filter((h: any) => h.status === 'Present' || h.status === 'On Duty').length;
                  const totalFacultyClasses = facultyHistory.length;
                  const facultyAttendancePct = totalFacultyClasses > 0
                    ? Math.round((presentCount / totalFacultyClasses) * 100)
                    : (student.attendance || 100);

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
                          <span className={`text-sm font-extrabold ${facultyAttendancePct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {facultyAttendancePct}%
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase">
                            {facultyAttendancePct >= 75 ? 'GOOD STANDING' : 'ATTENDANCE RISK'}
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
