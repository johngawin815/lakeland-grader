// --- CONSTANTS ---

export const ACADEMIC_SUBJECTS = [
  { id: 1, label: 'English/Language Arts' },
  { id: 2, label: 'Math' },
  { id: 3, label: 'Science' },
  { id: 4, label: 'Social Studies' },
  { id: 5, label: 'Physical Education' },
];

export const PERSONAL_SOCIAL_BEHAVIORS = [
  { id: 1, label: 'Shows enthusiasm for learning' },
  { id: 2, label: 'Attempts new activities' },
  { id: 3, label: 'Demonstrates self-help skills' },
  { id: 4, label: 'Demonstrates self-control' },
  { id: 5, label: 'Manages transitions' },
  { id: 6, label: 'Follows school rules' },
  { id: 7, label: 'Accepts responsibility for actions' },
  { id: 8, label: 'Participates in group activities' },
  { id: 9, label: 'Interacts well with peers' },
  { id: 10, label: 'Cooperates with adults' },
  { id: 11, label: 'Respects others' },
];

export const WORK_HABITS_BEHAVIORS = [
  { id: 12, label: 'Demonstrates effort' },
  { id: 13, label: 'Listens attentively' },
  { id: 14, label: 'Follows directions' },
  { id: 15, label: 'Stays on task' },
  { id: 16, label: 'Asks for help' },
  { id: 17, label: 'Completes work in allotted time' },
  { id: 18, label: 'Works independently' },
  { id: 19, label: 'Works cooperatively' },
  { id: 20, label: 'Uses materials appropriately' },
  { id: 21, label: 'Cleans up after self' },
  { id: 22, label: 'Organizes materials' },
];

export const ACADEMIC_GRADE_OPTIONS = ['', 'A', 'B', 'C', 'D', 'F'];
export const BEHAVIOR_GRADE_OPTIONS = ['', 'O', 'S', 'NI'];
export const QUARTERS = [1, 2, 3, 4];

// --- COLOR MAPS ---

export const ACADEMIC_GRADE_COLORS = {
  A: 'bg-emerald-50 text-emerald-700',
  B: 'bg-blue-50 text-blue-700',
  C: 'bg-yellow-50 text-yellow-700',
  D: 'bg-orange-50 text-orange-700',
  F: 'bg-red-50 text-red-700',
};

export const BEHAVIOR_GRADE_COLORS = {
  O: 'bg-emerald-50 text-emerald-700',
  S: 'bg-blue-50 text-blue-700',
  NI: 'bg-amber-50 text-amber-700',
};

// --- DEFAULTS FACTORY ---

export const getElementaryGrandDefaults = () => {
  const defaults = {
    studentName: '',
    gradeLevel: '',
    schoolYear: '2025-2026',
    teacher: '',
    admitDate: '',
    dischargeDate: '',
  };

  // Academic: eg_q{1-4}_subj{1-5}
  for (let q = 1; q <= 4; q++) {
    for (let s = 1; s <= 5; s++) {
      defaults[`eg_q${q}_subj${s}`] = '';
    }
  }

  // Behaviors: eg_q{1-4}_beh{1-22}
  for (let q = 1; q <= 4; q++) {
    for (let b = 1; b <= 22; b++) {
      defaults[`eg_q${q}_beh${b}`] = '';
    }
  }

  return defaults;
};

// --- DOCX PLACEHOLDER MAPPING ---

export const getElementaryGrandMappedData = (formData) => {
  const data = {};

  // Student info
  data.student_name = formData.studentName || '';
  data.school_year = formData.schoolYear || '';
  data.grade_level = formData.gradeLevel || '';
  data.teacher = formData.teacher || '';
  data.admit_date = formData.admitDate || '';
  data.discharge_date = formData.dischargeDate || '';

  // Academic grades: eg_q{q}_subj{s} → q{q}_subj{s}
  for (let q = 1; q <= 4; q++) {
    for (let s = 1; s <= 5; s++) {
      data[`q${q}_subj${s}`] = formData[`eg_q${q}_subj${s}`] || '';
    }
  }

  // Behavior grades: eg_q{q}_beh{b} → q{q}_beh{b}
  for (let q = 1; q <= 4; q++) {
    for (let b = 1; b <= 22; b++) {
      data[`q${q}_beh${b}`] = formData[`eg_q${q}_beh${b}`] || '';
    }
  }

  return data;
};

// --- COMPLETION HELPERS ---

export const getQuarterCompletion = (formData, quarter) => {
  let filled = 0;
  const total = 27; // 5 academic + 22 behavior

  for (let s = 1; s <= 5; s++) {
    if (formData[`eg_q${quarter}_subj${s}`]) filled++;
  }
  for (let b = 1; b <= 22; b++) {
    if (formData[`eg_q${quarter}_beh${b}`]) filled++;
  }

  return { filled, total };
};

export const getTotalCompletion = (formData) => {
  let filled = 0;
  const total = 108; // 27 per quarter × 4

  for (let q = 1; q <= 4; q++) {
    const qc = getQuarterCompletion(formData, q);
    filled += qc.filled;
  }

  return { filled, total };
};
