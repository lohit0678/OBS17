import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAcademicData } from '../context/AcademicDataContext';
import { DataTable, RiskBadge } from '../components/shared';
import { getFacultyRollup, Student } from '../data';
import {
  Users,
  ChevronLeft,
  Calendar,
  Mail,
  GraduationCap,
  ArrowUpRight,
  BookOpen,
  MapPin,
  Clock,
  Briefcase
} from 'lucide-react';

export default function HodFaculty() {
  const { facultyId } = useParams<{ facultyId?: string }>();
  const navigate = useNavigate();
  const { faculties, students, getFacultyData, getFacultyStudents } = useAcademicData();

  // -------------------------------------------------------------
  // DETAIL VIEW
  // -------------------------------------------------------------
  if (facultyId) {
    const faculty = getFacultyData(facultyId);
    const facultyStudents = getFacultyStudents(facultyId);
    const rollup = getFacultyRollup(facultyId, students);

    if (!faculty) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-slate-800">Faculty Member Not Found</h2>
          <p className="text-slate-500 mt-2">The specified faculty ID does not exist.</p>
          <button
            onClick={() => navigate('/hod/faculty')}
            className="mt-4 px-4 py-2 bg-[#0B192C] text-white rounded-xl"
          >
            Back to Faculty List
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/hod/faculty')}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            BACK TO ALL FACULTY
          </button>
        </div>

        {/* Faculty Brief Overview Header Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#0B192C] text-indigo-300 text-2xl font-black flex items-center justify-center shadow-sm">
              {faculty.name.split(' ').pop()?.charAt(0) || faculty.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{faculty.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                  Batch {faculty.batch} Tutor
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> {faculty.department}
              </p>
              <p className="text-xs text-indigo-600 font-medium mt-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {faculty.email}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 shrink-0">
            <div className="text-center lg:text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Batch</span>
              <strong className="text-base sm:text-lg font-bold text-slate-800">{faculty.batch}</strong>
            </div>
            <div className="text-center lg:text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Attendance</span>
              <strong className={`text-base sm:text-lg font-bold ${rollup.avgAttendance >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {rollup.avgAttendance}%
              </strong>
            </div>
            <div className="text-center lg:text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observation Notebooks</span>
              <strong className="text-base sm:text-lg font-extrabold text-slate-800">{rollup.labCompletionRate}%</strong>
            </div>
            <div className="text-center lg:text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Record Notebooks</span>
              <strong className="text-base sm:text-lg font-extrabold text-indigo-600">{rollup.recordCompletionRate}%</strong>
            </div>
          </div>
        </div>

        {/* Timetable Slot View */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Active Lab Timetable
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {faculty.timetable.map((slot, index) => (
              <div
                key={index}
                className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-indigo-100 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {slot.day}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600">{slot.batch}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{slot.lab}</h4>
                </div>
                <div className="mt-5 border-t border-slate-50 pt-3 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /> {slot.time}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-300" /> {slot.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registered Students Roster */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-500" />
              Laboratory Student Roster ({facultyStudents.length})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              These students are currently monitored under {faculty.name}.
            </p>
          </div>

          <DataTable<Student>
            headers={['Student Name', 'ID & Register No', 'Laboratory Group', 'Attendance Rate', 'Observation Notebook %', 'Record Notebook %', 'Status Badges', 'Action']}
            data={facultyStudents}
            searchPlaceholder="Search students in this batch..."
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
                  {/* Name */}
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
                  {/* Batch */}
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                    {student.batch}
                  </td>
                  {/* Attendance */}
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-bold ${student.attendance >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
                  {/* Status Badges */}
                  <td className="px-6 py-4">
                    <RiskBadge isAtRisk={student.riskFlagged} reason={student.riskReason} compact={true} />
                  </td>
                  {/* Drilldown button */}
                  <td className="px-6 py-4 text-right">
                    <button className="px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-lg text-[10px] font-bold cursor-pointer transition">
                      View Details
                    </button>
                  </td>
                </>
              );
            }}
          />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LIST VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">AI & DS Faculty Profiles</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Registered laboratory advisors, teaching timetables, and performance records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {faculties.map((faculty) => {
          const rollup = getFacultyRollup(faculty.id, students);
          return (
            <div
              key={faculty.id}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition group hover:border-indigo-100"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shadow-inner">
                    {faculty.name.split(' ').pop()?.charAt(0) || faculty.name.charAt(0)}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                    Batch {faculty.batch}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-base tracking-tight">{faculty.name}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1 mb-4">{faculty.email}</p>

                <div className="space-y-2 text-xs border-t border-slate-50 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Lab Specialty:</span>
                    <span className="font-bold text-slate-700 truncate max-w-[150px] text-right" title={faculty.labName}>
                      {faculty.labName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Supervised Students:</span>
                    <span className="font-bold text-slate-800">{rollup.count} Enrolled</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Batch Avg Attendance:</span>
                    <span className={`font-bold ${rollup.avgAttendance >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {rollup.avgAttendance}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Faculty Perf Score</p>
                  <p className="text-sm font-extrabold text-slate-800">{faculty.performanceScore}/100</p>
                </div>
                <Link
                  to={`/hod/faculty/${faculty.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 group-hover:underline transition"
                >
                  View Details
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
