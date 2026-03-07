import { Target, Telescope, Bird, Leaf, Flame, Droplets, Archive } from 'lucide-react';

// ─── RESIDENTIAL UNIT CONFIGURATION ─────────────────────────────────────────

export const UNIT_CONFIG = [
  { key: "Determination", label: "Determination", icon: Target, color: "text-purple-600", badge: "bg-purple-100 text-purple-800", border: "border-purple-200 hover:border-purple-400", avatarBg: "bg-purple-600", avatarRing: "ring-purple-200", accentBorder: "border-l-purple-600", tagBg: "bg-purple-50 text-purple-700" },
  { key: "Discovery", label: "Discovery", icon: Telescope, color: "text-amber-600", badge: "bg-amber-100 text-amber-800", border: "border-amber-200 hover:border-amber-400", avatarBg: "bg-amber-600", avatarRing: "ring-amber-200", accentBorder: "border-l-amber-600", tagBg: "bg-amber-50 text-amber-700" },
  { key: "Freedom", label: "Freedom", icon: Bird, color: "text-sky-500", badge: "bg-sky-100 text-sky-800", border: "border-sky-200 hover:border-sky-400", avatarBg: "bg-sky-500", avatarRing: "ring-sky-200", accentBorder: "border-l-sky-500", tagBg: "bg-sky-50 text-sky-700" },
  { key: "Harmony", label: "Harmony", icon: Leaf, color: "text-green-500", badge: "bg-green-100 text-green-800", border: "border-green-200 hover:border-green-400", avatarBg: "bg-emerald-500", avatarRing: "ring-emerald-200", accentBorder: "border-l-emerald-500", tagBg: "bg-emerald-50 text-emerald-700" },
  { key: "Integrity", label: "Integrity", icon: Flame, color: "text-orange-600", badge: "bg-orange-100 text-orange-800", border: "border-orange-200 hover:border-orange-400", avatarBg: "bg-orange-600", avatarRing: "ring-orange-200", accentBorder: "border-l-orange-600", tagBg: "bg-orange-50 text-orange-700" },
  { key: "Serenity", label: "Serenity", icon: Droplets, color: "text-blue-500", badge: "bg-blue-100 text-blue-800", border: "border-blue-200 hover:border-blue-400", avatarBg: "bg-blue-500", avatarRing: "ring-blue-200", accentBorder: "border-l-blue-500", tagBg: "bg-blue-50 text-blue-700" },
  { key: "Discharged", label: "Discharged Residents", icon: Archive, color: "text-slate-500", badge: "bg-slate-100 text-slate-600", border: "border-slate-200 hover:border-slate-400", avatarBg: "bg-slate-400", avatarRing: "ring-slate-200", accentBorder: "border-l-slate-400", tagBg: "bg-slate-100 text-slate-600" },
];

// ─── DEFAULT COURSES BY GRADE ───────────────────────────────────────────────

const ELEMENTARY_COURSES = [
  { courseName: 'Reading', subjectArea: 'English', credits: 1 },
  { courseName: 'Math', subjectArea: 'Math', credits: 1 },
  { courseName: 'Science', subjectArea: 'Science', credits: 1 },
  { courseName: 'Social Studies', subjectArea: 'Social Studies', credits: 1 },
];

const MIDDLE_COURSES = [
  { courseName: 'English', subjectArea: 'English', credits: 1 },
  { courseName: 'Pre-Algebra', subjectArea: 'Math', credits: 1 },
  { courseName: 'Science', subjectArea: 'Science', credits: 1 },
  { courseName: 'Social Studies', subjectArea: 'Social Studies', credits: 1 },
  { courseName: 'Elective', subjectArea: 'Elective', credits: 0.5 },
];

const HIGH_COURSES_BY_GRADE = {
  9: [
    { courseName: 'English 9', subjectArea: 'English', credits: 5 },
    { courseName: 'Algebra I', subjectArea: 'Math', credits: 5 },
    { courseName: 'Earth Science', subjectArea: 'Science', credits: 5 },
    { courseName: 'World History', subjectArea: 'Social Studies', credits: 5 },
    { courseName: 'Elective', subjectArea: 'Elective', credits: 2.5 },
  ],
  10: [
    { courseName: 'English 10', subjectArea: 'English', credits: 5 },
    { courseName: 'Geometry', subjectArea: 'Math', credits: 5 },
    { courseName: 'Biology', subjectArea: 'Science', credits: 5 },
    { courseName: 'US History', subjectArea: 'Social Studies', credits: 5 },
    { courseName: 'Elective', subjectArea: 'Elective', credits: 2.5 },
  ],
  11: [
    { courseName: 'English 11', subjectArea: 'English', credits: 5 },
    { courseName: 'Algebra II', subjectArea: 'Math', credits: 5 },
    { courseName: 'Chemistry', subjectArea: 'Science', credits: 5 },
    { courseName: 'US Government', subjectArea: 'Social Studies', credits: 5 },
    { courseName: 'Elective', subjectArea: 'Elective', credits: 2.5 },
  ],
  12: [
    { courseName: 'English 12', subjectArea: 'English', credits: 5 },
    { courseName: 'Pre-Calculus', subjectArea: 'Math', credits: 5 },
    { courseName: 'Physics', subjectArea: 'Science', credits: 5 },
    { courseName: 'Economics', subjectArea: 'Social Studies', credits: 5 },
    { courseName: 'Elective', subjectArea: 'Elective', credits: 2.5 },
  ],
};

export function getGradeBand(gradeLevel) {
  const g = parseInt(gradeLevel, 10);
  if (g >= 1 && g <= 5) return 'elementary';
  if (g >= 6 && g <= 8) return 'middle';
  if (g >= 9 && g <= 12) return 'high';
  return 'middle'; // fallback for K or unknown
}

export function getDefaultCourses(gradeLevel) {
  const g = parseInt(gradeLevel, 10);
  const band = getGradeBand(g);
  if (band === 'elementary') return ELEMENTARY_COURSES;
  if (band === 'middle') return MIDDLE_COURSES;
  return HIGH_COURSES_BY_GRADE[g] || HIGH_COURSES_BY_GRADE[9];
}
