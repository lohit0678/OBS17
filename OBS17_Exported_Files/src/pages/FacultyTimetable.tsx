import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import { CalendarDays, Clock, MapPin, Sparkles, PlusCircle } from 'lucide-react';

export default function FacultyTimetable() {
  const { user } = useAuth();
  const { getFacultyData } = useAcademicData();

  const facultyData = getFacultyData(user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Lab Session Timetable</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Weekly academic scheduling and physical laboratory room assignments.
          </p>
        </div>
      </div>

      {/* Roster timetable cards */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] space-y-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800 text-base">Your Active Weekly Schedule</h3>
        </div>

        {facultyData && facultyData.timetable.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {facultyData.timetable.map((slot, index) => (
              <div
                key={index}
                className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:bg-indigo-50/10 hover:border-indigo-100 hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#0B192C] text-white uppercase tracking-wider">
                      {slot.day}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                      {slot.batch}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{slot.lab}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">AI & DS Laboratory Division</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100/60 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    {slot.time}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-300" />
                    {slot.room}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-12">
            No active timetables allocated for this profile yet.
          </p>
        )}
      </div>

      {/* Technical Lab Support Info Banner */}
      <div className="p-5 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-semibold text-indigo-950 text-sm">Need a Lab Schedule Change?</h5>
            <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
              Timetable reassignments, lab room switches, and batch transfers are managed directly by the AI & DS Head of Department. Please submit scheduling requests through the HOD approval portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
