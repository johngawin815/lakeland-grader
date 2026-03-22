import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, BookOpen, UserCheck, Plus, Users, Loader2, Search, FileCheck } from 'lucide-react';
import ClassGradebook from '../grading/ClassGradebook';
import EnrollmentManager from './EnrollmentManager';
import IntakeForm from './IntakeForm';
import { databaseService } from '../../services/databaseService';
import EditableStudentProfileModal from '../EditableStudentProfileModal';
import { UNIT_CONFIG } from '../../config/unitConfig';
import { autoEnrollStudent } from '../../services/defaultEnrollmentService';
import { getCurrentSchoolYear } from '../../utils/smartUtils';

// Mock user, as requested. In a real app, this would come from an auth context.
const MOCK_USER = { name: "John Gawin", units: ["Harmony"], email: "john.gawin@lakeland.edu" };

// --- Main Dashboard Component ---
const StudentMasterDashboard = ({ setView, user = MOCK_USER, onSelectCourse, initialTab }) => {
  const [, setActiveTab] = useState(initialTab || 'roster');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [managingCourse, setManagingCourse] = useState(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  if (managingCourse) {
    return (
      <div className="w-full min-h-full p-8 box-border font-sans max-w-7xl mx-auto">
        <EnrollmentManager
          course={managingCourse}
          user={user}
          onExit={() => setManagingCourse(null)}
        />
      </div>
    );
  }

  if (selectedCourse) {
    return <ClassGradebook course={selectedCourse} onExit={() => setSelectedCourse(null)} user={user} onNavigateToGradeCards={() => { setSelectedCourse(null); if (setView) setView('gradecards'); }} />;
  }

  return (
    <div className="w-full h-full box-border flex flex-col font-sans max-w-7xl mx-auto relative cursor-default">
      <div className="flex justify-between items-center px-6 pt-5 pb-4 shrink-0 border-b border-slate-200/80">
        <div>
          <h2 className="text-slate-800 text-lg font-bold tracking-tight">
            Unit Master Dashboard
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {user.units?.join(', ')} &middot; {user.name}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-50/80 backdrop-blur-xl flex-1 flex flex-col overflow-hidden relative z-0">
        <UnitRoster defaultUnit={user.units?.[0]} user={user} />
      </div>
    </div>
  );
};

// --- Helper Components ---


// --- "My Unit Roster" Tab Content ---
const UnitRoster = ({ defaultUnit, user }) => {
    const [selectedUnit, setSelectedUnit] = useState(defaultUnit || 'Determination');
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
    const [showIntakeForm, setShowIntakeForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [unitCounts, setUnitCounts] = useState({});

    const loadCounts = async () => {
        try {
            const all = await databaseService.getAllStudents();
            const counts = {};
            UNIT_CONFIG.forEach(u => { counts[u.key] = 0; });
            all.forEach(s => {
                if (s.active === false) {
                    counts["Discharged"] = (counts["Discharged"] || 0) + 1;
                } else if (counts[s.unitName] !== undefined) {
                    counts[s.unitName]++;
                }
            });
            setUnitCounts(counts);
        } catch (err) { console.error('Failed to load unit counts:', err); }
    };

    useEffect(() => {
        loadCounts();
    }, []);

    const fetchRoster = async () => {
        setLoading(true);
        try {
            let students;
            if (selectedUnit === 'Discharged') {
                students = await databaseService.getDischargedStudents();
            } else {
                students = await databaseService.getStudentsByUnit(selectedUnit);
            }
            setRoster(students?.length > 0 ? students : []);
        } catch (error) {
            console.error("Failed to fetch unit roster:", error);
            setRoster([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRoster();
        loadCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedUnit]);

    useEffect(() => {
        if (selectedStudentProfile) {
            const updated = roster.find(s => s.id === selectedStudentProfile.id);
            if (updated) {
                setSelectedStudentProfile(updated);
            } else {
                setSelectedStudentProfile(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roster]);

    const handleIntakeSave = async (formData) => {
        try {
            const nameParts = (formData.studentName || '').trim().split(/\s+/);
            const newStudent = {
                id: `student-${Date.now()}`,
                studentName: formData.studentName,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                gradeLevel: parseInt(formData.gradeLevel, 10) || 9,
                unitName: formData.unitName,
                admitDate: formData.admitDate || new Date().toISOString().split('T')[0],
                expectedDischargeDate: formData.expectedDischargeDate || null,
                district: formData.district || '',
                homeState: formData.homeState || '',
                iep: formData.iepStatus === 'Yes' ? 'Yes' : 'No',
                active: true,
                lastModified: new Date().toISOString(),
                healthInsurance: formData.healthInsurance || '',
                therapistName: formData.therapistName || '',
                reasonForAdmit: formData.reasonForAdmit || '',
                guardian1Name: formData.guardian1Name || '',
                guardian1Address: formData.guardian1Address || '',
                guardian1Phone: formData.guardian1Phone || '',
                guardian1Email: formData.guardian1Email || '',
                homeSchoolName: formData.homeSchoolName || '',
                homeSchoolAddress: formData.homeSchoolAddress || '',
                homeSchoolContactName: formData.homeSchoolContactName || '',
                homeSchoolContactPosition: formData.homeSchoolContactPosition || '',
                homeSchoolContactNumber: formData.homeSchoolContactPhone || '',
                homeSchoolContactEmail: formData.homeSchoolContactEmail || '',
                homeSchoolContact: '',
                guardianName: formData.guardian1Name || '',
                guardianPhone: formData.guardian1Phone || '',
                iepDueDate: '',
                uploadPasscode: '',
                uploadedDocuments: [],
            };
            await databaseService.upsertStudent(newStudent);
            if (user) {
                await databaseService.logAudit(user, 'CreateStudent', `Created new student: ${newStudent.studentName} (ID: ${newStudent.id})`);
            }
            if (formData.autoEnrollDefaults !== false) {
                try {
                    const result = await autoEnrollStudent(newStudent, user.name, getCurrentSchoolYear());
                    if (result.enrolled.length > 0) {
                        console.info(`Auto-enrolled ${newStudent.studentName} in: ${result.enrolled.join(', ')}`);
                    }
                } catch (enrollErr) {
                    console.error('Auto-enrollment failed:', enrollErr);
                }
            }
            setShowIntakeForm(false);
            fetchRoster();
            loadCounts();
        } catch (err) {
            console.error('Failed to save new student:', err);
            alert('Failed to save new student: ' + (err.message || 'Unknown error'));
        }
    };

    const isDetailOpen = !!selectedStudentProfile;

    const filteredRoster = roster.filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.studentName?.toLowerCase().includes(q) ||
               s.district?.toLowerCase().includes(q) ||
               s.guardianName?.toLowerCase().includes(q);
    }).sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

    const iepCount = filteredRoster.filter(s => s.iep === 'Yes').length;

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Unit Selector + Search + Add Student */}
            <div className="flex flex-wrap items-center gap-1.5 px-5 py-3 shrink-0 border-b border-slate-100 bg-slate-50/50">
                {UNIT_CONFIG.map(unit => {
                    const Icon = unit.icon;
                    const isActive = selectedUnit === unit.key;
                    const count = unitCounts[unit.key];
                    return (
                        <button
                            key={unit.key}
                            onClick={() => {
                                setSelectedUnit(unit.key);
                                setSelectedStudentProfile(null);
                                setSearchQuery('');
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                isActive
                                    ? `${unit.badge} shadow-sm`
                                    : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{unit.label}</span>
                            {count !== undefined && (
                                <span className={`text-[10px] font-bold min-w-[16px] h-[16px] inline-flex items-center justify-center rounded-full ${
                                    isActive ? 'bg-white/40' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
                {!isDetailOpen && (
                <div className="ml-auto flex items-center gap-2">
                    {iepCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
                            <FileCheck className="w-3 h-3" />
                            {iepCount} IEP
                        </span>
                    )}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all w-40 focus:w-56"
                        />
                    </div>
                    <button
                        onClick={() => setShowIntakeForm(prev => !prev)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                            showIntakeForm
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'
                        }`}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {showIntakeForm ? 'Cancel' : 'Add Student'}
                    </button>
                </div>
                )}
            </div>

            {/* Intake Form (collapsible) */}
            {showIntakeForm && (
                <div className="px-6 py-4 border-b border-slate-200 shrink-0 animate-slide-up">
                    <IntakeForm onSave={handleIntakeSave} units={UNIT_CONFIG} defaultUnit={selectedUnit} />
                </div>
            )}

            {/* Main content area */}
            {loading ? (
                <div className="flex items-center justify-center flex-1">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mr-3" />
                    <span className="text-sm font-medium text-slate-400">Loading roster...</span>
                </div>
            ) : filteredRoster.length === 0 ? (
                <div className="text-center flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Users className="w-10 h-10 text-slate-200" />
                    {searchQuery.trim() ? (
                        <p className="text-sm font-medium">No students matching "{searchQuery}"</p>
                    ) : (
                        <p className="text-sm font-medium">No students in {selectedUnit}</p>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* ====== LEFT PANEL: Student List ====== */}
                    <div className={`
                        overflow-y-auto transition-all duration-300 ease-in-out
                        ${isDetailOpen
                            ? 'hidden lg:block w-72 xl:w-80 shrink-0 border-r border-slate-200/80 bg-white'
                            : 'flex-1 p-5'
                        }
                    `}>
                        {isDetailOpen ? (
                            <div className="divide-y divide-slate-100">
                                {filteredRoster.map(student => (
                                    <StudentListItem
                                        key={student.id}
                                        student={student}
                                        isSelected={selectedStudentProfile?.id === student.id}
                                        onSelect={() => setSelectedStudentProfile(student)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredRoster.map(student => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                        isSelected={selectedStudentProfile?.id === student.id}
                                        onSelect={() => setSelectedStudentProfile(student)}
                                        user={user}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ====== RIGHT PANEL: Detail ====== */}
                    {isDetailOpen && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30 animate-detail-enter">
                            <div className="lg:hidden shrink-0 bg-white border-b border-slate-200 px-4 py-2.5">
                                <button
                                    onClick={() => setSelectedStudentProfile(null)}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to roster
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <EditableStudentProfileModal
                                    key={selectedStudentProfile.id}
                                    studentData={selectedStudentProfile}
                                    onClose={() => setSelectedStudentProfile(null)}
                                    onSaved={() => { fetchRoster(); loadCounts(); }}
                                    user={user}
                                    mode="detail"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const StudentListItem = ({ student, onSelect, isSelected }) => {
    const unitStyle = UNIT_CONFIG.find(u => u.key === student.unitName);
    const initials = (student.firstName?.[0] || '') + (student.lastName?.[0] || '');

    let iepDueUrgent = false;
    if (student.iepDueDate) {
        const dueDate = new Date(student.iepDueDate);
        iepDueUrgent = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24)) <= 30;
    }

    return (
        <button
            onClick={onSelect}
            className={`
                w-full text-left px-4 py-3 flex items-center gap-3
                transition-colors duration-150 outline-none
                focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500
                ${isSelected
                    ? `${unitStyle?.tagBg || 'bg-indigo-50'} border-l-[3px] ${unitStyle?.accentBorder || 'border-l-indigo-500'}`
                    : 'hover:bg-slate-50/80 border-l-[3px] border-l-transparent'
                }
            `}
        >
            <div className={`
                w-8 h-8 rounded-full ${unitStyle?.avatarBg || 'bg-slate-400'}
                flex items-center justify-center text-white text-[10px] font-bold shrink-0
            `}>
                {initials}
            </div>
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {student.studentName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-slate-400">Gr {student.gradeLevel}</span>
                    {student.iep === 'Yes' && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            iepDueUrgent ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                        }`}>
                            <FileCheck className="w-2.5 h-2.5" />
                            IEP{iepDueUrgent ? ' !' : ''}
                        </span>
                    )}
                    {student.district && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{student.district}</span>
                    )}
                </div>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                isSelected ? 'text-indigo-500' : 'text-slate-300'
            }`} />
        </button>
    );
};

const StudentCard = ({ student, onSelect, isSelected, user }) => {
    const unitStyle = UNIT_CONFIG.find(u => u.key === student.unitName);
    const initials = (student.firstName?.[0] || '') + (student.lastName?.[0] || '');
    const Icon = unitStyle?.icon || UserCheck;
    const [enrolling, setEnrolling] = useState(false);
    const [enrollResult, setEnrollResult] = useState(null);

    const admitDate = new Date(student.admitDate);
    const today = new Date();
    const daysIn = Math.max(0, Math.floor((today - admitDate) / (1000 * 60 * 60 * 24)));

    let iepDueUrgent = false;
    if (student.iepDueDate) {
        const dueDate = new Date(student.iepDueDate);
        iepDueUrgent = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) <= 30;
    }



    const handleAutoEnroll = async (e) => {
        e.stopPropagation();
        setEnrolling(true);
        setEnrollResult(null);
        try {
            const result = await autoEnrollStudent(student, user?.name || 'Unknown', getCurrentSchoolYear());
            setEnrollResult(result);
            setTimeout(() => setEnrollResult(null), 4000);
        } catch (err) {
            console.error('Auto-enroll failed:', err);
            setEnrollResult({ error: true });
            setTimeout(() => setEnrollResult(null), 3000);
        }
        setEnrolling(false);
    };

    return (
        <div
            onClick={onSelect}
            className={`relative rounded-xl border ${unitStyle?.accentBorder ? `border-l-[3px] ${unitStyle.accentBorder}` : 'border-l-[3px] border-l-slate-300'} border-slate-200/60 bg-white cursor-pointer transition-all duration-200 group hover:shadow-md hover:-translate-y-px ${
                isSelected
                    ? 'ring-2 ring-indigo-400/30 border-indigo-200 shadow-sm'
                    : 'shadow-sm hover:border-slate-300'
            }`}
        >
            <div className="px-4 py-3.5">
                {/* Row 1: Avatar + Name + Grade + Days */}
                <div className="flex items-center gap-3 mb-2.5">
                    <div className={`w-9 h-9 rounded-full ${unitStyle?.avatarBg || 'bg-slate-400'} flex items-center justify-center text-white font-bold text-[10px] tracking-wide shrink-0`}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-slate-800 leading-tight truncate group-hover:text-indigo-600 transition-colors">
                            {student.studentName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-slate-500 font-medium">Gr {student.gradeLevel}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
                            <span className="text-[11px] text-slate-400">{daysIn}d</span>
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-300 shrink-0 transition-all ${
                        isSelected ? 'text-indigo-500' : 'opacity-0 group-hover:opacity-100 group-hover:text-indigo-400'
                    }`} />
                </div>

                {/* Row 2: Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${unitStyle?.tagBg || 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-3 h-3" />
                        {student.unitName}
                    </span>
                    {student.iep === "Yes" && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            iepDueUrgent
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-amber-50 text-amber-600 border border-amber-200/60'
                        }`}>
                            <FileCheck className="w-3 h-3" />
                            IEP{iepDueUrgent ? ' \u2013 Due Soon' : ''}
                        </span>
                    )}
                    {student.district && (
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">
                            {student.district}
                        </span>
                    )}

                </div>

                {/* Auto-Enroll (compact, only visible on hover) */}
                <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleAutoEnroll}
                        disabled={enrolling}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors disabled:opacity-50"
                        title="Auto-enroll in default courses"
                    >
                        {enrolling ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
                        Default Enroll
                    </button>
                    {enrollResult && !enrollResult.error && (
                        <span className="text-[10px] text-emerald-600 font-medium">
                            {enrollResult.enrolled.length > 0
                                ? `+${enrollResult.enrolled.length} courses`
                                : 'Already enrolled'}
                        </span>
                    )}
                    {enrollResult?.error && (
                        <span className="text-[10px] text-rose-600 font-medium">Failed</span>
                    )}
                </div>
            </div>
        </div>
    );
};




export default StudentMasterDashboard;
