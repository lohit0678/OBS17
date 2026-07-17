import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademicData } from '../context/AcademicDataContext';
import { Student } from '../data';
import { DataTable, RiskBadge } from '../components/shared';
import { GraduationCap, AlertTriangle, CheckCircle, Search, ArrowUpRight, Award, Percent, FileCheck } from 'lucide-react';

export default function HodStudents() {
  const { students } = useAcademicData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'All' | 'At-Risk' | 'On-Track'>('All');

  const totalCount = students.length;
  const flaggedCount = students.filter((s) => s.riskFlagged).length;
  const onTrackCount = totalCount - flaggedCount;

  const getFilteredStudents = () => {
    switch (activeTab) {
      case 'At-Risk':
        return students.filter((s) => s.riskFlagged);
      case 'On-Track':
        return students.filter((s) => !s.riskFlagged);
      default:
        return students;
    }
  };

  const filteredStudents = getFilteredStudents();

  // Stats calculation
  const avgAttendance = Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / totalCount) || 0;
  
  const totalLabCompletionRate = Math.round(
    students.reduce((acc, s) => {
      const tLabs = s.experiments.length;
      const appLabs = s.experiments.filter(e => e.status === 'Approved').length;
      return acc + (tLabs > 0 ? (appLabs / tLabs) * 100 : 0);
    }, 0) / totalCount
  ) || 0;

  const totalRecordCompletionRate = Math.round(
    students.reduce((acc, s) => {
      const tAsg = s.assignments.length;
      const doneAsg = s.assignments.filter(a => a.status === 'Graded' || a.status === 'Submitted').length;
      return acc + (tAsg > 0 ? (doneAsg / tAsg) * 100 : 0);
    }, 0) / totalCount
  ) || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">AI & DS Student Journal Directory</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Department-wide rosters, real-time laboratory metrics, and automated risk analysis logs.
        </p>
      </div>

      {/* Mini Rollup Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total AI & DS</span>
            <strong className="text-xl font-bold text-slate-800">{totalCount} Students</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Flagged At-Risk</span>
            <strong className="text-xl font-bold text-rose-600">{flaggedCount} Students</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Attendance</span>
            <strong className="text-xl font-bold text-slate-800">{avgAttendance}%</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Observation Notebooks</span>
            <strong className="text-xl font-bold text-slate-800">{totalLabCompletionRate}%</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Record Notebooks</span>
            <strong className="text-xl font-bold text-indigo-600">{totalRecordCompletionRate}%</strong>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Filter Links */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'All'
              ? 'border-[#0B192C] text-[#0B192C]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          All Students ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab('At-Risk')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'At-Risk'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-slate-400 hover:text-rose-500'
          }`}
        >
          Flagged At-Risk ({flaggedCount})
        </button>
        <button
          onClick={() => setActiveTab('On-Track')}
          className={`px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === 'On-Track'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-emerald-500'
          }`}
        >
          On Track ({onTrackCount})
        </button>
      </div>

      {/* Roster Table */}
      <DataTable<Student>
        headers={['Student Name', 'ID & Reg No', 'Assigned Advisor', 'Lab Course', 'Attendance', 'Observation Notebook %', 'Record Notebook %', 'Risk Standing', 'Action']}
        data={filteredStudents}
        searchPlaceholder="Search all department student profiles..."
        searchField="name"
        onRowClick={(student) => navigate(`/hod/students/${student.id}`)}
        renderRow={(student) => {
          const tLabs = student.experiments.length;
          const appLabs = student.experiments.filter(e => e.status === 'Approved').length;
          const completion = tLabs > 0 ? Math.round((appLabs / tLabs) * 100) : 0;

          const tAsg = student.assignments.length;
          const doneAsg = student.assignments.filter(a => a.status === 'Graded' || a.status === 'Submitted').length;
          const asgRate = tAsg > 0 ? Math.round((doneAsg / tAsg) * 100) : 0;

          return (
            <>
              {/* Profile */}
              <td className="px-6 py-4">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{student.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{student.email}</p>
                </div>
              </td>
              {/* ID */}
              <td className="px-6 py-4">
                <div>
                  <p className="text-xs font-bold text-slate-600">{student.registerNo}</p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase">ID: {student.id}</p>
                </div>
              </td>
              {/* Advisor */}
              <td className="px-6 py-4 text-xs font-semibold text-indigo-600">
                {student.facultyName}
              </td>
              {/* Lab Name */}
              <td className="px-6 py-4 text-xs font-semibold text-slate-600 truncate max-w-[150px]" title={student.labName}>
                {student.labName}
              </td>
              {/* Attendance */}
              <td className="px-6 py-4 text-center text-xs font-extrabold text-slate-700">
                <span className={student.attendance >= 75 ? 'text-emerald-600' : 'text-rose-600'}>
                  {student.attendance}%
                </span>
              </td>
              {/* Lab Completion */}
              <td className="px-6 py-4 text-center text-xs font-bold text-slate-700">
                {completion}%
              </td>
              {/* Assignments Done */}
              <td className="px-6 py-4 text-center text-xs font-bold text-indigo-600">
                {asgRate}%
              </td>
              {/* Risk */}
              <td className="px-6 py-4">
                <RiskBadge isAtRisk={student.riskFlagged} reason={student.riskReason} compact={true} />
              </td>
              {/* Action */}
              <td className="px-6 py-4 text-right">
                <button className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-lg text-[10px] font-bold cursor-pointer transition">
                  Audit Profile
                </button>
              </td>
            </>
          );
        }}
      />
    </div>
  );
}
