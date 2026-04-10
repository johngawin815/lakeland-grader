import React, { useEffect, useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, BookOpen, UserCheck, Plus, Users, Loader2, Search, FileCheck, Trash2, Check } from 'lucide-react';

import ClassGradebook from '../grading/ClassGradebook';
import EnrollmentManager from './EnrollmentManager';
import IntakeForm from './IntakeForm';
import { databaseService } from '../../services/databaseService';
import EditableStudentProfileModal from '../EditableStudentProfileModal';
import EditableStudentName from '../EditableStudentName';
import { useStudent } from '../../context/StudentContext';
import { generateStudentNumber, formatStudentLabel } from '../../utils/studentUtils';

import { UNIT_CONFIG } from '../../config/unitConfig';
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
    const { refreshTrigger } = useStudent();

    const loadCounts = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        loadCounts();
    }, [refreshTrigger, loadCounts]);

    const fetchRoster = useCallback(async () => {
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
    }, [selectedUnit]);

    useEffect(() => {
        fetchRoster();
        loadCounts();
    }, [selectedUnit, refreshTrigger, fetchRoster, loadCounts]);

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
            const proposedName = formData.studentName.trim();
            const proposedFirst = nameParts[0] || '';
            const proposedLast = nameParts.slice(1).join(' ') || '';

            // Duplicate check
            const existingStudents = await databaseService.getAllStudents();
            const isDuplicate = existingStudents.some(s => 
                s.studentName?.toLowerCase() === proposedName.toLowerCase() ||
                (s.firstName?.toLowerCase() === proposedFirst.toLowerCase() && 
                 s.lastName?.toLowerCase() === proposedLast.toLowerCase() && proposedFirst !== '')
            );

            if (isDuplicate) {
                alert(`Student "${proposedName}" already exists in the system.\nPlease edit their existing profile from the Unit roster instead of creating a duplicate.`);
                return; // Stop saving
            }

            const newStudent = {
                id: `student-${Date.now()}`,
                studentName: proposedName,
                firstName: proposedFirst,
                lastName: proposedLast,
                studentNumber: generateStudentNumber(),
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
                await databaseService.logAudit(user, 'CreateStudent', `Created new student: ${formatStudentLabel(newStudent)}`);
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

    const handleDeleteStudent = async (e, student) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete ${formatStudentLabel(student)}? This action cannot be undone.`)) {
            try {
                await databaseService.deleteStudent(student.id);
                if (user) {
                    await databaseService.logAudit(user, 'DeleteStudent', `Deleted student: ${formatStudentLabel(student)}`);
                }
                fetchRoster();
                loadCounts();
            } catch (err) {
                console.error('Failed to delete student:', err);
                alert('System Error: Failed to delete student.');
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Unit Selector + Search + Add Student */}
            <div className="flex flex-wrap items-center gap-2 px-6 py-4 shrink-0 border-b border-slate-200 bg-white/60 backdrop-blur-md">
                <div className="flex flex-wrap gap-1.5 bg-slate-100/50 p-1 rounded-xl border border-slate-200/60">
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
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                                isActive
                                    ? `${unit.badge} shadow-md ring-1 ring-inset ${unit.accentBorder ? unit.accentBorder.replace('border-l-','ring-') : 'ring-indigo-200'}`
                                    : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{unit.label}</span>
                            {count !== undefined && (
                                <span className={`text-[10px] font-black min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-md ${
                                    isActive ? 'bg-white/60 text-current' : 'bg-slate-200 text-slate-500'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
                </div>
                {!isDetailOpen && (
                <div className="ml-auto flex items-center gap-3">
                    {iepCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 shadow-sm">
                            <FileCheck className="w-3.5 h-3.5" />
                            {iepCount} IEP
                        </span>
                    )}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 shadow-sm text-xs font-medium text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all w-48 focus:w-64"
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
                                        onDelete={(e) => handleDeleteStudent(e, student)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-2">
                                {filteredRoster.map(student => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                        isSelected={selectedStudentProfile?.id === student.id}
                                        onSelect={() => setSelectedStudentProfile(student)}
                                        onDelete={(e) => handleDeleteStudent(e, student)}
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

const StudentListItem = ({ student, onSelect, isSelected, onDelete }) => {
    const unitStyle = UNIT_CONFIG.find(u => u.key === student.unitName);
    const colorClass = unitStyle?.avatarBg || 'bg-slate-400';

    let iepDueUrgent = false;
    if (student.iepDueDate) {
        const dueDate = new Date(student.iepDueDate);
        iepDueUrgent = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24)) <= 30;
    }

    return (
        <button
            onClick={onSelect}
            className={`
                w-full text-left px-4 py-3 flex items-center gap-3 group
                transition-all duration-200 outline-none
                focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500
                ${isSelected
                    ? `${unitStyle?.tagBg || 'bg-indigo-50'} border-l-4 ${unitStyle?.accentBorder || 'border-l-indigo-500'}`
                    : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                }
            `}
        >
            <div className="relative">
                <EditableStudentName
                    studentId={student.id}
                    studentName={student.studentName}
                    size="md"
                    colorClass={colorClass}
                />
            </div>
            <div className="flex-1 min-w-0">
                <div className={`flex flex-wrap items-baseline gap-2 mb-0.5`}>
                    <span className={`text-[13px] font-black ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                        {formatStudentLabel(student)}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100">Gr {student.gradeLevel}</span>
                    {student.iep === 'Yes' && (
                        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border ${
                            iepDueUrgent ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                            <FileCheck className="w-2.5 h-2.5" />
                            IEP{iepDueUrgent ? ' !' : ''}
                        </span>
                    )}
                    {student.district && (
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">{student.district}</span>
                    )}
                </div>
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 transition-all ${
                isSelected ? 'text-indigo-500 transform translate-x-1' : 'text-slate-300 group-hover:text-indigo-300'
            }`} />
            <div
                onClick={onDelete}
                className="p-1.5 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                title="Delete Student"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </div>
        </button>
    );
};

const StudentCard = ({ student, onSelect, isSelected, user, onDelete }) => {
    const unitStyle = UNIT_CONFIG.find(u => u.key === student.unitName);
    const Icon = unitStyle?.icon || UserCheck;
    const [enrollResult, setEnrollResult] = useState(null);

    const admitDate = new Date(student.admitDate);
    const today = new Date();
    const daysIn = Math.max(0, Math.floor((today - admitDate) / (1000 * 60 * 60 * 24)));

    let iepDueUrgent = false;
    if (student.iepDueDate) {
        const dueDate = new Date(student.iepDueDate);
        iepDueUrgent = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) <= 30;
    }

    const colorClass = unitStyle?.avatarBg || 'bg-slate-400';


    return (
        <div
            onClick={onSelect}
            className={`
                relative flex flex-col items-center justify-between
                bg-white rounded-2xl border transition-all duration-300 group cursor-pointer overflow-hidden
                ${isSelected 
                    ? `border-indigo-300 ring-4 ring-indigo-500/20 shadow-md transform -translate-y-1`
                    : `border-slate-200/80 shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-1`
                }
            `}
        >
            {/* Top Color Accent Line */}
            <div className={`h-1.5 w-full ${colorClass}`} />

            <div className="p-5 flex flex-col items-center w-full z-10 bg-gradient-to-br from-white to-slate-50/50">
                
                {/* Header row: Days Admitted / Delete */}
                <div className="w-full flex justify-between items-start mb-1 h-6">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                        {daysIn} Days
                    </span>
                    <button
                        onClick={onDelete}
                        className="p-1.5 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 translate-x-2 -translate-y-2"
                        title="Delete Student"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Avatar Centerpiece */}
                <div className="relative mb-3.5">
                    <EditableStudentName
                        studentId={student.id}
                        studentName={student.studentName}
                        size="lg"
                        colorClass={colorClass}
                        className="shadow-md"
                    />
                    {student.iep === 'Yes' && (
                        <div className={`absolute -bottom-1 -right-2 p-1 rounded-full shadow-sm border-2 border-white ${iepDueUrgent ? 'bg-rose-500' : 'bg-amber-400'}`} title="IEP Active">
                            <FileCheck className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>

                {/* Identity Header */}
                <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                    {formatStudentLabel(student)}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 truncate w-full text-center">
                    Grade {student.gradeLevel} &middot; {student.unitName}
                </p>

                {/* Badges/Tags */}
                <div className="flex items-center justify-center gap-2 flex-wrap mb-4 w-full">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border ${unitStyle?.tagBg || 'bg-slate-50 text-slate-600'} border-black/5 shadow-sm`}>
                        <Icon className="w-3.5 h-3.5 opacity-80" />
                        {student.unitName}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-bold px-3 py-1.5 rounded-lg bg-white text-slate-600 border border-slate-200 shadow-sm">
                        Grade {student.gradeLevel}
                    </span>
                </div>
                
                {/* District Line */}
                {student.district && (
                    <div className="w-full text-center text-[11px] font-medium text-slate-400 truncate px-2 mb-1">
                        {student.district}
                    </div>
                )}
            </div>

        </div>
    );
};




export default StudentMasterDashboard;
