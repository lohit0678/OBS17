import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAcademicData } from '../context/AcademicDataContext';
import { MetricCard, RiskBadge } from '../components/shared';
import {
  ChevronLeft,
  Mail,
  User,
  GraduationCap,
  Percent,
  Award,
  TrendingUp,
  FileText,
  ClipboardList,
  AlertTriangle,
  FileCheck,
  Check,
  X,
  Plus,
  MessageSquare,
  BookOpen
} from 'lucide-react';

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getStudentData, updateLabSubmissionStatus, gradeAssignment, updateInternalMarks, sendNotification } = useAcademicData();

  const student = getStudentData(studentId || '');

  // Grading states for faculty grading form
  const [gradingScore, setGradingScore] = useState<number>(85);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [selectedAsgId, setSelectedAsgId] = useState<string | null>(null);
  const [asgScore, setAsgScore] = useState<number>(45);
  const [asgRemarks, setAsgRemarks] = useState<string>('');

  // Internal Marks form state
  const [editSubject, setEditSubject] = useState<string>('');
  const [cia1, setCia1] = useState<number>(0);
  const [cia2, setCia2] = useState<number>(0);
  const [cia3, setCia3] = useState<number>(0);
  const [practical, setPractical] = useState<number>(0);
  const [marksMessage, setMarksMessage] = useState<string>('');

  // Advisor Remarks Form State
  const [newRemark, setNewRemark] = useState<string>('');
  const [remarkSuccess, setRemarkSuccess] = useState<boolean>(false);

  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-slate-800">Student Profile Not Found</h2>
        <p className="text-slate-500 mt-2">The specified student ID does not exist or has been removed.</p>
        <button
          onClick={() => navigate(user.role === 'HOD' ? '/hod/students' : '/faculty/students')}
          className="mt-4 px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold"
        >
          Return to Students
        </button>
      </div>
    );
  }

  // Derived calculations
  const totalLabs = student.experiments.length;
  const approvedLabs = student.experiments.filter(e => e.status === 'Approved').length;
  const labCompletionRate = totalLabs > 0 ? Math.round((approvedLabs / totalLabs) * 100) : 0;

  const totalAsgs = student.assignments.length;
  const gradedAsgs = student.assignments.filter(a => a.status === 'Graded').length;
  const asgCompletionRate = totalAsgs > 0 ? Math.round((gradedAsgs / totalAsgs) * 100) : 0;

  // Handle Lab approval
  const handleGradeSubmission = (experimentId: string, status: 'Approved' | 'Rejected', finalScore: number, comment?: string) => {
    updateLabSubmissionStatus(student.id, experimentId, status, finalScore, comment);
    setSelectedSubId(null);
  };

  // Handle Assignment grading
  const handleGradeAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsgId) return;
    gradeAssignment(student.id, selectedAsgId, asgScore, asgRemarks);
    setSelectedAsgId(null);
    setAsgRemarks('');
  };

  // Handle CIA internal marks update
  const handleSaveInternalMarks = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubject) return;
    updateInternalMarks(student.id, editSubject, cia1, cia2, cia3, practical);
    setMarksMessage('Continuous Internal Assessment marks updated successfully!');
    setEditSubject('');
    setTimeout(() => setMarksMessage(''), 3000);
  };

  // Handle Faculty remarks update
  const handleSaveRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark) return;
    sendNotification('announcement', 'Faculty Advisory Remark Added', newRemark, `${user.name} (Faculty Advisor)`, student.batch);
    setRemarkSuccess(true);
    setNewRemark('');
    setTimeout(() => setRemarkSuccess(false), 3000);
  };

  const handleBack = () => {
    if (user.role === 'HOD') {
      navigate('/hod/students');
    } else {
      navigate('/faculty/students');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          BACK TO ALL STUDENTS
        </button>

        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Security Checked: AI & DS ERP Engine
        </span>
      </div>

      {/* Brief Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#0B192C] text-indigo-300 text-2xl font-black flex items-center justify-center shadow-inner uppercase">
            {student.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{student.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                Batch {student.batch}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Reg No: <strong className="text-slate-600">{student.registerNo}</strong> &bull; Roll No: <strong className="text-slate-600">{(student.rollNo || '').replace(/\s+/g, '').toUpperCase()}</strong>
            </p>
            <p className="text-xs text-indigo-600 font-medium mt-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> {student.email}
            </p>
          </div>
        </div>

        {/* Advisor & Lab Information */}
        <div className="grid grid-cols-2 gap-4 md:gap-8 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Advisor</span>
            <strong className="text-xs sm:text-sm font-extrabold text-slate-800 block mt-0.5">{student.facultyName}</strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Laboratory Specialty</span>
            <strong className="text-xs sm:text-sm font-semibold text-slate-600 block mt-0.5 max-w-[150px] truncate" title={student.labName}>
              {student.labName}
            </strong>
          </div>
        </div>
      </div>

      {/* Risk Alert Banner */}
      {student.riskFlagged && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3.5 text-rose-800 text-xs shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-rose-950 text-sm">Action Advisory: Student Flagged At-Risk</h5>
            <p className="text-rose-700 mt-1 leading-relaxed">
              {student.riskReason || "Low attendance rate or lab completion rate falls below mandatory academic criteria."} Remedial guidance is required.
            </p>
          </div>
        </div>
      )}

      {/* Metrics breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Attendance Rate"
          value={`${student.attendance}%`}
          subtitle="Target threshold > 75%"
          icon={<Percent className="w-5 h-5" />}
          iconBgColor={student.attendance >= 75 ? "bg-emerald-50" : "bg-rose-50"}
          iconColor={student.attendance >= 75 ? "text-emerald-600" : "text-rose-600"}
        />
        <MetricCard
          title="Observation Notebooks"
          value={`${labCompletionRate}%`}
          subtitle={`${approvedLabs} Approved of ${totalLabs}`}
          icon={<FileCheck className="w-5 h-5" />}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Record Notebooks"
          value={`${asgCompletionRate}%`}
          subtitle={`${gradedAsgs} Graded of ${totalAsgs}`}
          icon={<BookOpen className="w-5 h-5" />}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <MetricCard
          title="Academic Standing"
          value={student.attendance >= 75 && labCompletionRate >= 75 ? "Good" : "Needs Support"}
          subtitle="Overall assessment status"
          icon={<Award className="w-5 h-5" />}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Detail Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module A: Lab Experiments & Document Approvals */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Observation Notebooks</h3>
          </div>

          <div className="space-y-4">
            {student.experiments.map((exp) => (
              <div
                key={exp.id}
                className="p-4 border border-slate-100 rounded-2xl flex flex-col justify-between bg-slate-50/50 hover:bg-slate-50 transition gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">{exp.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Due Date: {exp.dueDate}</p>
                    {exp.submittedAt && (
                      <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Submitted: {exp.submittedAt}</p>
                    )}
                  </div>
                  <div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                      exp.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      exp.status === 'Submitted - Pending' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                      exp.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {exp.status}
                    </span>
                  </div>
                </div>

                {/* File references */}
                {(exp.observationPdfUrl || exp.recordPdfUrl) && (
                  <div className="flex gap-2 text-[10px] font-bold text-indigo-600">
                    {exp.observationPdfUrl && (
                      <span className="bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                        📄 Obs: {exp.observationPdfUrl}
                      </span>
                    )}
                    {exp.recordPdfUrl && (
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">
                        📄 Record: {exp.recordPdfUrl}
                      </span>
                    )}
                  </div>
                )}

                {/* Faculty Evaluation Utility */}
                {user.role === 'Faculty' && (exp.status === 'Submitted - Pending' || exp.status === 'Rejected') && (
                  <div className="pt-3 border-t border-slate-200/60 flex flex-col gap-3">
                    {selectedSubId === exp.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Award Score (0-100):
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={gradingScore}
                              onChange={(e) => setGradingScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              Comments/Remarks:
                            </label>
                            <input
                              type="text"
                              placeholder="Great analysis"
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white"
                              id={`comment-${exp.id}`}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const inputEl = document.getElementById(`comment-${exp.id}`) as HTMLInputElement;
                              handleGradeSubmission(exp.id, 'Approved', gradingScore, inputEl?.value || 'Approved');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve & Grade
                          </button>
                          <button
                            onClick={() => {
                              const inputEl = document.getElementById(`comment-${exp.id}`) as HTMLInputElement;
                              handleGradeSubmission(exp.id, 'Rejected', 0, inputEl?.value || 'Rejected. Resubmit.');
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject / Redo
                          </button>
                          <button
                            onClick={() => setSelectedSubId(null)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedSubId(exp.id);
                          setGradingScore(90);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 self-start cursor-pointer"
                      >
                        <FileCheck className="w-4 h-4 text-indigo-500" /> Evaluate Submission
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Module B: Assignments & CIA Continuous Marks Management */}
        <div className="space-y-6">
          {/* Assignments list */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Record Notebooks</h3>
            </div>

            <div className="space-y-3">
              {student.assignments.map((asg) => (
                <div key={asg.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{asg.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Due: {asg.dueDate}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                      asg.status === 'Graded' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      asg.status === 'Submitted' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {asg.status}
                    </span>
                  </div>

                  {asg.fileUrl && (
                    <p className="text-[10px] text-indigo-600 font-bold">📄 Sol: {asg.fileUrl}</p>
                  )}

                  {/* Grading panel */}
                  {user.role === 'Faculty' && asg.status === 'Submitted' && (
                    <div className="pt-2 border-t border-slate-200/60">
                      {selectedAsgId === asg.id ? (
                        <form onSubmit={handleGradeAssignmentSubmit} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Score (max {asg.maxScore})</label>
                              <input
                                type="number"
                                min="0"
                                max={asg.maxScore}
                                value={asgScore}
                                onChange={(e) => setAsgScore(Math.min(asg.maxScore, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Remarks</label>
                              <input
                                type="text"
                                placeholder="Good logical proof"
                                value={asgRemarks}
                                onChange={(e) => setAsgRemarks(e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer">
                              Submit Grade
                            </button>
                            <button type="button" onClick={() => setSelectedAsgId(null)} className="px-3 py-1 bg-slate-100 text-slate-500 rounded text-xs font-bold cursor-pointer">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAsgId(asg.id);
                            setAsgScore(asg.maxScore - 5);
                          }}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold cursor-pointer transition"
                        >
                          Grade Assignment
                        </button>
                      )}
                    </div>
                  )}

                  {asg.status === 'Graded' && (
                    <div className="bg-white p-2.5 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Awarded Score:</span>
                      <span className="font-extrabold text-emerald-600">{asg.score}/{asg.maxScore}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Continuous Marks Entry */}
          {user.role === 'Faculty' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Enter CIA Internal Marks</h3>
              </div>

              <form onSubmit={handleSaveInternalMarks} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject Specialty</label>
                    <select
                      value={editSubject}
                      onChange={(e) => {
                        setEditSubject(e.target.value);
                        if (e.target.value && student.internalMarks[e.target.value]) {
                          const existing = student.internalMarks[e.target.value];
                          setCia1(existing.cia1);
                          setCia2(existing.cia2);
                          setCia3(existing.cia3);
                          setPractical(existing.practical);
                        }
                      }}
                      className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
                      required
                    >
                      <option value="">-- Choose Subject --</option>
                      {Object.keys(student.internalMarks).map(subj => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CIA-1 (max 50)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={cia1}
                      onChange={(e) => setCia1(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      disabled={!editSubject}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CIA-2 (max 50)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={cia2}
                      onChange={(e) => setCia2(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      disabled={!editSubject}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CIA-3 (max 50)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={cia3}
                      onChange={(e) => setCia3(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      disabled={!editSubject}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End-Semester Practical Evaluation (max 100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={practical}
                      onChange={(e) => setPractical(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full py-2 px-3 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      disabled={!editSubject}
                    />
                  </div>
                </div>

                {marksMessage && (
                  <p className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 p-2 rounded-lg">{marksMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={!editSubject}
                  className="w-full py-2.5 bg-[#0B192C] hover:bg-[#1C2C42] text-white rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Save Internal Marks
                </button>
              </form>
            </div>
          )}

          {/* Advisor Remarks */}
          {user.role === 'Faculty' && (
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Log Academic Advisor Remark</h3>
              </div>

              <form onSubmit={handleSaveRemark} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Advisor General Comments / Advisory Note</label>
                  <textarea
                    rows={3}
                    placeholder="Student shows outstanding practical skills, but needs to improve attendance."
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white"
                    required
                  />
                </div>

                {remarkSuccess && (
                  <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">Remark logged successfully into student's feed!</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Log Advisory Comment
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
