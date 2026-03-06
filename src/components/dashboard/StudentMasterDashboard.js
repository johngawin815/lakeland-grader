import React, { useEffect, useState } from 'react';
import { Target, Telescope, Bird, Leaf, Flame, Droplets, ChevronRight, ChevronLeft, Archive, BookOpen, UserCheck, Plus, Pencil, Trash2, Users, Loader2, StickyNote, Search } from 'lucide-react';
import ClassGradebook from '../grading/ClassGradebook';
import CourseFormModal from './CourseFormModal';
import EnrollmentManager from './EnrollmentManager';
import IntakeForm from './IntakeForm';
import { databaseService } from '../../services/databaseService';
import EditableStudentProfileModal from '../EditableStudentProfileModal';

// Mock user, as requested. In a real app, this would come from an auth context.
const MOCK_USER = { name: "John Gawin", unit: "Harmony", email: "john.gawin@lakeland.edu" };

// Mock data import disabled for real/fake student testing

// --- Main Dashboard Component ---
const StudentMasterDashboard = ({ setView, user = MOCK_USER, onSelectCourse, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'roster');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [managingCourse, setManagingCourse] = useState(null);

  // Sync tab when initialTab prop changes (e.g., from HubShell gradebook nav)
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // If managing enrollment for a course, show EnrollmentManager
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

  // If a course is selected, render its gradebook
  if (selectedCourse) {
    return <ClassGradebook course={selectedCourse} onExit={() => setSelectedCourse(null)} user={user} onNavigateToGradeCards={() => { setSelectedCourse(null); if (setView) setView('gradecards'); }} />;
  }

  return (
    <div className="w-full h-full box-border flex flex-col font-sans max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center px-6 pt-4 pb-3 shrink-0">
        <div>
          <h2 className="text-slate-900 text-xl font-extrabold tracking-tight">
            Teacher Dashboard
          </h2>
          <p className="text-slate-500 text-sm">
            {user.unit} Unit &middot; {user.name}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-0 border-b border-slate-200 px-6 shrink-0">
        <TabButton
          label="My Unit Roster"
          icon={<UserCheck />}
          isActive={activeTab === 'roster'}
          onClick={() => setActiveTab('roster')}
        />
        <TabButton
          label="My Classes"
          icon={<BookOpen />}
          isActive={activeTab === 'classes'}
          onClick={() => setActiveTab('classes')}
        />
      </div>

      {/* Tab Content */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-b-2xl rounded-tr-2xl shadow-2xl shadow-slate-200/60 flex-1 flex flex-col overflow-hidden relative z-0">
        {activeTab === 'roster' && <UnitRoster defaultUnit={user.unit} user={user} />}
        {activeTab === 'classes' && (
          <div className="flex-1 overflow-y-auto p-6">
            <MyClasses
              teacherName={user.name}
              user={user}
              onCourseSelect={setSelectedCourse}
              onManageEnrollment={setManagingCourse}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helper Components ---

const TabButton = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-t-lg font-bold text-sm transition-all flex items-center gap-2.5 border-b-2 ${
      isActive
        ? 'border-indigo-600 text-indigo-600'
        : 'border-transparent text-slate-500 hover:text-slate-800'
    }`}
  >
    {React.cloneElement(icon, { className: 'w-5 h-5' })}
    {label}
  </button>
);


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

    // Load unit counts on mount
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
            if (students && students.length > 0) {
                setRoster(students);
            } else {
                setRoster([]);
            }
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

    // Sync selectedStudentProfile with roster after refresh
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
                // Health & Admission
                healthInsurance: formData.healthInsurance || '',
                therapistName: formData.therapistName || '',
                reasonForAdmit: formData.reasonForAdmit || '',
                // Guardian 1
                guardian1Name: formData.guardian1Name || '',
                guardian1Address: formData.guardian1Address || '',
                guardian1Phone: formData.guardian1Phone || '',
                guardian1Email: formData.guardian1Email || '',
                // Guardian 2
                guardian2Name: formData.guardian2Name || '',
                guardian2Address: formData.guardian2Address || '',
                guardian2Phone: formData.guardian2Phone || '',
                guardian2Email: formData.guardian2Email || '',
                // Home School
                homeSchoolName: formData.homeSchoolName || '',
                homeSchoolAddress: formData.homeSchoolAddress || '',
                homeSchoolContactName: formData.homeSchoolContactName || '',
                homeSchoolContactPosition: formData.homeSchoolContactPosition || '',
                homeSchoolContactNumber: formData.homeSchoolContactPhone || '',
                homeSchoolContactEmail: formData.homeSchoolContactEmail || '',
                // Legacy fields
                homeSchoolContact: '',
                guardianName: formData.guardian1Name || '',
                guardianPhone: formData.guardian1Phone || '',
                iepDueDate: '',
                mtpNotes: [],
                uploadPasscode: '',
                uploadedDocuments: [],
            };
            await databaseService.upsertStudent(newStudent);
            if (user) {
                await databaseService.logAudit(user, 'CreateStudent', `Created new student: ${newStudent.studentName} (ID: ${newStudent.id})`);
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

    // Filter roster by search query and sort alphabetically by first name
    const filteredRoster = roster.filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return s.studentName?.toLowerCase().includes(q) ||
               s.district?.toLowerCase().includes(q) ||
               s.guardianName?.toLowerCase().includes(q);
    }).sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Unit Selector + Search + Add Student */}
            <div className="flex flex-wrap items-center gap-2 px-6 py-3 shrink-0 border-b border-slate-100">
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
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                isActive
                                    ? `${unit.badge} border-current shadow-md ring-1 ring-current/20`
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{unit.label}</span>
                            {count !== undefined && (
                                <span className={`text-[10px] font-extrabold min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full ${
                                    isActive ? 'bg-white/30' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
                {!isDetailOpen && (
                <div className="ml-auto flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search students..."
                            className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all w-48 focus:w-64"
                        />
                    </div>
                    <button
                        onClick={() => setShowIntakeForm(prev => !prev)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                            showIntakeForm
                                ? 'bg-slate-200 text-slate-600 shadow-none'
                                : 'bg-indigo-600 text-white shadow-indigo-500/10 hover:bg-indigo-700'
                        }`}
                    >
                        <Plus className="w-4 h-4" />
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
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mr-3" />
                    <span className="text-sm font-medium text-slate-400">Loading roster...</span>
                </div>
            ) : filteredRoster.length === 0 ? (
                <div className="text-center flex-1 flex items-center justify-center text-slate-400">
                    {searchQuery.trim() ? (
                        <p className="text-sm font-medium">No students matching "{searchQuery}"</p>
                    ) : (
                        <p className="text-sm font-medium italic">No students assigned to the {selectedUnit} unit.</p>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    {/* ====== LEFT PANEL: Student List ====== */}
                    <div className={`
                        overflow-y-auto transition-all duration-300 ease-in-out
                        ${isDetailOpen
                            ? 'hidden lg:block w-72 xl:w-80 shrink-0 border-r border-slate-200/80 bg-white'
                            : 'flex-1 p-6'
                        }
                    `}>
                        {isDetailOpen ? (
                            /* Compact list rows for master-detail mode */
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
                            /* Full-width card grid (original layout, no student selected) */
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredRoster.map(student => (
                                    <StudentCard
                                        key={student.id}
                                        student={student}
                                        isSelected={selectedStudentProfile?.id === student.id}
                                        onSelect={() => setSelectedStudentProfile(student)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ====== RIGHT PANEL: Detail ====== */}
                    {isDetailOpen && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/30 animate-detail-enter">
                            {/* Mobile back button -- visible below lg */}
                            <div className="lg:hidden shrink-0 bg-white border-b border-slate-200 px-4 py-2.5">
                                <button
                                    onClick={() => setSelectedStudentProfile(null)}
                                    className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
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
                    : 'hover:bg-slate-50 border-l-[3px] border-l-transparent'
                }
            `}
        >
            <div className={`
                w-8 h-8 rounded-lg ${unitStyle?.avatarBg || 'bg-slate-400'}
                flex items-center justify-center text-white text-xs font-bold shrink-0
            `}>
                {initials}
            </div>
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                    {student.studentName}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-400">Gr {student.gradeLevel}</span>
                    {student.iep === 'Yes' && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            iepDueUrgent ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                        }`}>
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

const StudentCard = ({ student, onSelect, isSelected }) => {
    const unitStyle = UNIT_CONFIG.find(u => u.key === student.unitName);
    const initials = (student.firstName?.[0] || '') + (student.lastName?.[0] || '');
    const Icon = unitStyle?.icon || UserCheck;

    const admitDate = new Date(student.admitDate);
    const today = new Date();
    const daysIn = Math.max(0, Math.floor((today - admitDate) / (1000 * 60 * 60 * 24)));

    let iepDueUrgent = false;
    if (student.iepDueDate) {
        const dueDate = new Date(student.iepDueDate);
        iepDueUrgent = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24)) <= 30;
    }

    const noteCount = student.mtpNotes?.length || 0;

    return (
        <div
            onClick={onSelect}
            className={`relative rounded-xl border-l-[3px] ${unitStyle?.accentBorder || 'border-l-slate-300'} border border-slate-200/60 bg-white cursor-pointer transition-all duration-200 group hover:shadow-lg hover:-translate-y-0.5 ${
                isSelected
                    ? 'ring-2 ring-indigo-500/30 border-indigo-200 shadow-md'
                    : 'hover:border-slate-300'
            }`}
        >
            <div className="px-4 py-3.5">
                {/* Row 1: Avatar + Name + Grade + Days */}
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${unitStyle?.avatarBg || 'bg-slate-400'} ring-2 ${unitStyle?.avatarRing || 'ring-slate-200'} ring-offset-1 flex items-center justify-center text-white font-bold text-xs tracking-wide shrink-0`}>
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 leading-tight truncate group-hover:text-indigo-600 transition-colors">
                            {student.studentName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-slate-500 font-semibold">Grade {student.gradeLevel}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-xs text-slate-400 font-medium">{daysIn}d</span>
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-300 shrink-0 transition-all ${
                        isSelected ? 'text-indigo-500' : 'opacity-0 group-hover:opacity-100 group-hover:text-indigo-400'
                    }`} />
                </div>

                {/* Row 2: Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${unitStyle?.tagBg || 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-3 h-3" />
                        {student.unitName}
                    </span>
                    {student.iep === "Yes" && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                            iepDueUrgent
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200/60'
                        }`}>
                            IEP{iepDueUrgent ? ' \u2013 Due Soon' : ''}
                        </span>
                    )}
                    {student.district && (
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                            {student.district}
                        </span>
                    )}
                    {noteCount > 0 && (
                        <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-amber-600 font-bold">
                            <StickyNote className="w-3 h-3" />
                            {noteCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- "My Classes" Tab Content ---
const MyClasses = ({ teacherName, user, onCourseSelect, onManageEnrollment }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const teacherCourses = await databaseService.getCoursesByTeacher(teacherName);
            setCourses(teacherCourses);
        } catch (error) {
            console.error("Failed to fetch courses:", error);
            setCourses([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (teacherName) {
            fetchCourses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teacherName]);

    const handleCreateCourse = () => {
        setEditingCourse(null);
        setIsCourseModalOpen(true);
    };

    const handleEditCourse = (course) => {
        setEditingCourse(course);
        setIsCourseModalOpen(true);
    };

    const handleDeleteCourse = async (course) => {
        if (!window.confirm(`Delete "${course.courseName}"? This cannot be undone.`)) return;
        try {
            await databaseService.deleteCourse(course.id);
            databaseService.logAudit(user, 'DeleteCourse', `Deleted course: ${course.courseName}`);
            fetchCourses();
        } catch (error) {
            console.error("Failed to delete course:", error);
            alert('Failed to delete course.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mr-3" />
                <span className="text-sm font-medium text-slate-400">Loading classes...</span>
            </div>
        );
    }

    return (
        <>
            {/* Create Course Button */}
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    {courses.length} Course{courses.length !== 1 ? 's' : ''}
                </h3>
                <button
                    onClick={handleCreateCourse}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/10"
                >
                    <Plus className="w-4 h-4" /> Create Course
                </button>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 italic mb-4">No courses yet. Create your first course to get started.</p>
                    <button
                        onClick={handleCreateCourse}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/10"
                    >
                        <Plus className="w-4 h-4" /> Create Course
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map(course => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onOpen={() => onCourseSelect(course)}
                            onManage={() => onManageEnrollment(course)}
                            onEdit={() => handleEditCourse(course)}
                            onDelete={() => handleDeleteCourse(course)}
                        />
                    ))}
                </div>
            )}

            {/* Course Form Modal */}
            <CourseFormModal
                isOpen={isCourseModalOpen}
                onClose={() => { setIsCourseModalOpen(false); setEditingCourse(null); }}
                course={editingCourse}
                user={user}
                onSaved={fetchCourses}
            />
        </>
    );
};


const CourseCard = ({ course, onOpen, onManage, onEdit, onDelete }) => (
    <div className="p-6 border border-slate-200/80 rounded-xl shadow-lg bg-white/80 transition-all group hover:shadow-2xl hover:bg-white flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 border border-white">
                <BookOpen className="w-7 h-7" />
            </div>
            <div className="flex items-center gap-1.5">
                {course.subjectArea && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 font-bold">
                        {course.subjectArea}
                    </span>
                )}
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">
                    {parseFloat(course.credits)} Credits
                </span>
            </div>
        </div>
        <div>
            <h3 className="font-bold text-xl text-slate-800">{course.courseName}</h3>
            <p className="text-sm text-slate-500">
                {course.term && <span className="font-medium">{course.term}</span>}
            </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onManage(); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Manage Students"
                >
                    <Users className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                    title="Edit Course"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Delete Course"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <button
                onClick={onOpen}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:underline"
            >
                Open Gradebook <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    </div>
);


// --- CONFIGS ---

const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", icon: Target, color: "text-purple-600", badge: "bg-purple-100 text-purple-800", border: "border-purple-200 hover:border-purple-400", avatarBg: "bg-purple-600", avatarRing: "ring-purple-200", accentBorder: "border-l-purple-600", tagBg: "bg-purple-50 text-purple-700" },
  { key: "Discovery", label: "Discovery", icon: Telescope, color: "text-amber-600", badge: "bg-amber-100 text-amber-800", border: "border-amber-200 hover:border-amber-400", avatarBg: "bg-amber-600", avatarRing: "ring-amber-200", accentBorder: "border-l-amber-600", tagBg: "bg-amber-50 text-amber-700" },
  { key: "Freedom", label: "Freedom", icon: Bird, color: "text-sky-500", badge: "bg-sky-100 text-sky-800", border: "border-sky-200 hover:border-sky-400", avatarBg: "bg-sky-500", avatarRing: "ring-sky-200", accentBorder: "border-l-sky-500", tagBg: "bg-sky-50 text-sky-700" },
  { key: "Harmony", label: "Harmony", icon: Leaf, color: "text-green-500", badge: "bg-green-100 text-green-800", border: "border-green-200 hover:border-green-400", avatarBg: "bg-emerald-500", avatarRing: "ring-emerald-200", accentBorder: "border-l-emerald-500", tagBg: "bg-emerald-50 text-emerald-700" },
  { key: "Integrity", label: "Integrity", icon: Flame, color: "text-orange-600", badge: "bg-orange-100 text-orange-800", border: "border-orange-200 hover:border-orange-400", avatarBg: "bg-orange-600", avatarRing: "ring-orange-200", accentBorder: "border-l-orange-600", tagBg: "bg-orange-50 text-orange-700" },
  { key: "Serenity", label: "Serenity", icon: Droplets, color: "text-blue-500", badge: "bg-blue-100 text-blue-800", border: "border-blue-200 hover:border-blue-400", avatarBg: "bg-blue-500", avatarRing: "ring-blue-200", accentBorder: "border-l-blue-500", tagBg: "bg-blue-50 text-blue-700" },
  { key: "Discharged", label: "Discharged Residents", icon: Archive, color: "text-slate-500", badge: "bg-slate-100 text-slate-600", border: "border-slate-200 hover:border-slate-400", avatarBg: "bg-slate-400", avatarRing: "ring-slate-200", accentBorder: "border-l-slate-400", tagBg: "bg-slate-100 text-slate-600" }
];

export default StudentMasterDashboard;
