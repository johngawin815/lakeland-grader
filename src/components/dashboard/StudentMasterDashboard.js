import React, { useEffect, useState } from 'react';

import { Target, Telescope, Bird, Leaf, Flame, Droplets, ChevronRight, Archive, BookOpen, UserCheck, X } from 'lucide-react';
import ClassGradebook from '../grading/ClassGradebook'; // Import for later use



// Mock user, as requested. In a real app, this would come from an auth context.
const MOCK_USER = { name: "John Gawin", unit: "Harmony", email: "john.gawin@lakeland.edu" };

// --- Main Dashboard Component ---
const StudentMasterDashboard = ({ activeStudentName, setActiveStudent, setView, user = MOCK_USER, onSelectCourse }) => {
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' or 'classes'
  
  // This state will hold the specific course the user clicks on
  const [selectedCourse, setSelectedCourse] = useState(null);

  // If a course is selected, we render the gradebook for it directly
  if (selectedCourse) {
    return <ClassGradebook course={selectedCourse} onExit={() => setSelectedCourse(null)} user={user} />;
  }

  return (
    <div className="w-full min-h-full p-8 box-border flex flex-col font-sans max-w-7xl mx-auto relative">
      <div className="flex justify-between items-center mb-5 shrink-0">
        <div>
          <h2 className="m-0 text-slate-900 text-3xl font-extrabold tracking-tight">
            Teacher Dashboard
          </h2>
          <p className="m-1 text-slate-500 text-base">
            Welcome, {user.name}. Toggle between your unit and class responsibilities.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-0 border-b border-slate-200/80">
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
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-b-2xl rounded-tr-2xl shadow-2xl shadow-slate-200/60 min-h-[500px] p-6 relative z-0">
        {activeTab === 'roster' && <UnitRoster unitName={user.unit} setActiveStudent={setActiveStudent} />}
        {activeTab === 'classes' && <MyClasses teacherName={user.name} onCourseSelect={setSelectedCourse} />}
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
const UnitRoster = ({ unitName, setActiveStudent }) => {
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

    useEffect(() => {
        const fetchRoster = async () => {
            setLoading(true);
            try {
                // NOTE: Using mock data for now as getStudentsByUnit might not be fully implemented
                // const students = await databaseService.getStudentsByUnit(unitName);
                const mockStudents = generateMockRoster().filter(s => s.unitName === unitName);
                setRoster(mockStudents);
            } catch (error) {
                console.error("Failed to fetch unit roster:", error);
                // Fallback to mock data on error
                setRoster(generateMockRoster().filter(s => s.unitName === unitName));
            }
            setLoading(false);
        };

        if (unitName) {
            fetchRoster();
        }
    }, [unitName]);

    if (loading) {
        return <div className="text-center py-20 text-slate-400">Loading roster...</div>;
    }
    
    if (roster.length === 0) {
        return <div className="text-center py-20 text-slate-400 italic">No students assigned to the {unitName} unit.</div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roster.map(student => (
                    <StudentCard
                        key={student.id}
                        student={student}
                        onSelect={() => {
                            setActiveStudent(student.studentName);
                            setSelectedStudentProfile(student);
                        }}
                    />
                ))}
            </div>

            {selectedStudentProfile && (
                <StudentProfileModal 
                    student={selectedStudentProfile} 
                    onClose={() => setSelectedStudentProfile(null)} 
                />
            )}
        </>
    );
};

const StudentCard = ({ student, onSelect }) => {
    const unitStyle = UNIT_CONFIG.find(u => u.key === student.unitName);
    return (
        <div
            onClick={onSelect}
            className={`p-4 border ${unitStyle?.border || 'border-slate-200/80 hover:border-indigo-400/50'} rounded-xl shadow-sm bg-white/80 cursor-pointer transition-all group flex flex-col gap-2 hover:shadow-xl hover:bg-white`}
        >
            <div className="flex justify-between items-start">
                <div className={`font-bold text-lg group-hover:text-indigo-600 ${unitStyle?.color || 'text-slate-800'}`}>
                    {student.studentName}
                </div>
                {student.iep === "Yes" && <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">IEP</span>}
            </div>
            <div className="text-xs text-slate-500 font-medium flex justify-between items-center mt-auto">
                <span>Grade {student.gradeLevel}</span>
                <span className="text-slate-400">Admit: {student.admitDate}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </div>
        </div>
    );
};


// --- "My Classes" Tab Content ---
const MyClasses = ({ teacherName, onCourseSelect }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const MOCK_COURSES = [
            { id: 'C101', courseName: 'English 9', teacherName: 'John Gawin', credits: 5 },
            { id: 'C102', courseName: 'Social Studies 9', teacherName: 'John Gawin', credits: 5 },
            { id: 'C201', courseName: 'Algebra 1', teacherName: 'Jane Doe', credits: 5 },
        ];

        const fetchCourses = async () => {
            setLoading(true);
            try {
                // const teacherCourses = await databaseService.getCoursesByTeacher(teacherName);
                const teacherCourses = MOCK_COURSES.filter(c => c.teacherName === teacherName);
                setCourses(teacherCourses);
            } catch (error) {
                console.error("Failed to fetch courses:", error);
                 setCourses(MOCK_COURSES.filter(c => c.teacherName === teacherName));
            }
            setLoading(false);
        };
        if (teacherName) {
            fetchCourses();
        }
    }, [teacherName]);

    if (loading) {
        return <div className="text-center py-20 text-slate-400">Loading classes...</div>;
    }
    
    if (courses.length === 0) {
        return <div className="text-center py-20 text-slate-400 italic">No classes assigned to {teacherName}.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(course => (
                <CourseCard key={course.id} course={course} onClick={() => onCourseSelect(course)} />
            ))}
        </div>
    );
};


const CourseCard = ({ course, onClick }) => (
    <div
        onClick={onClick}
        className="p-6 border border-slate-200/80 hover:border-indigo-400/50 rounded-2xl shadow-lg bg-white/80 cursor-pointer transition-all group hover:shadow-2xl hover:bg-white flex flex-col gap-2"
    >
        <div className="flex justify-between items-start">
            <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600 border border-white">
                <BookOpen className="w-7 h-7" />
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold">{course.credits} Credits</span>
        </div>
        <div>
            <h3 className="font-bold text-xl text-slate-800 group-hover:text-indigo-600">{course.courseName}</h3>
            <p className="text-sm text-slate-500">Teacher: {course.teacherName}</p>
        </div>
        <div className="mt-auto pt-4 flex justify-end">
            <button className="flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:underline">
                Open Gradebook <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    </div>
);


// --- MOCK DATA AND CONFIGS ---
// These are kept at the bottom for clarity

const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", icon: Target, color: "text-purple-500", badge: "bg-purple-100 text-purple-800", border: "border-purple-200 hover:border-purple-400" },
  { key: "Discovery", label: "Discovery", icon: Telescope, color: "text-yellow-500", badge: "bg-yellow-100 text-yellow-800", border: "border-yellow-200 hover:border-yellow-400" },
  { key: "Freedom", label: "Freedom", icon: Bird, color: "text-sky-500", badge: "bg-sky-100 text-sky-800", border: "border-sky-200 hover:border-sky-400" },
  { key: "Harmony", label: "Harmony", icon: Leaf, color: "text-green-500", badge: "bg-green-100 text-green-800", border: "border-green-200 hover:border-green-400" },
  { key: "Integrity", label: "Integrity", icon: Flame, color: "text-orange-500", badge: "bg-orange-100 text-orange-800", border: "border-orange-200 hover:border-orange-400" },
  { key: "Serenity", label: "Serenity", icon: Droplets, color: "text-blue-500", badge: "bg-blue-100 text-blue-800", border: "border-blue-200 hover:border-blue-400" },
  { key: "Discharged", label: "Discharged Residents", icon: Archive, color: "text-slate-500", badge: "bg-slate-100 text-slate-600", border: "border-slate-200 hover:border-slate-400" }
];

const generateMockRoster = () => {
  const students = [];
  const units = UNIT_CONFIG.map(u => u.key);
  const firstNames = ["Aiden", "Bella", "Caleb", "Daisy", "Ethan", "Fiona", "Gavin", "Hazel", "Isaac", "Jenna", "Kyle", "Luna", "Mason", "Nora", "Owen", "Piper", "Quinn", "Ryan", "Stella", "Tyler", "Violet", "Wyatt", "Xander", "Yara", "Zoe"];
  const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson"];
  let idCounter = 1;
  units.forEach(unit => {
    for (let i = 0; i < 6; i++) { // Reduced number for brevity
      const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
      const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
      students.push({
        id: idCounter.toString(),
        studentName: `${randomFirst} ${randomLast}`,
        gradeLevel: Math.floor(Math.random() * 4) + 9,
        unitName: unit,
        admitDate: `2023-0${Math.floor(Math.random() * 9) + 1}-01`,
        iep: i % 3 === 0 ? "Yes" : "No",
      });
      idCounter++;
    }
  });
  return students;
};

const StudentProfileModal = ({ student, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl shadow-slate-900/10 w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Student Profile</h3>
                    <p className="text-sm text-slate-500">{student.studentName}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Student ID</span>
                    <span className="text-slate-900 font-bold">{student.id}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Grade Level</span>
                    <span className="text-slate-900 font-bold">{student.gradeLevel}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Unit</span>
                    <span className="text-slate-900 font-bold">{student.unitName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Admit Date</span>
                    <span className="text-slate-900 font-bold">{student.admitDate}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">IEP</span>
                    <span className="text-slate-900 font-bold">{student.iep}</span>
                </div>
            </div>
        </div>
    </div>
);

export default StudentMasterDashboard;