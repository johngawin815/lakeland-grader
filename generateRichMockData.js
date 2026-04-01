const fs = require('fs');

const UNITS = [
  { name: 'Determination', theme: 'Harry Potter', pool: ['Harry P.', 'Hermione G.', 'Ron W.', 'Albus D.', 'Severus S.', 'Minerva M.', 'Rubeus H.', 'Draco M.', 'Neville L.', 'Luna L.', 'Ginny W.', 'Cedric D.', 'Sirius B.', 'Remus L.', 'Bellatrix L.', 'Voldemort T.', 'Lucius M.', 'Dudley D.'] },
  { name: 'Discovery', theme: 'Avengers', pool: ['Tony S.', 'Steve R.', 'Natasha R.', 'Bruce B.', 'Thor O.', 'Clint B.', 'Nick F.', 'Wanda M.', 'Vision S.', 'Sam W.', 'Bucky B.', 'Peter P.', 'Stephen S.', 'Carol D.', 'Scott L.', 'Hope V.', 'TChalla K.', 'Loki L.'] },
  { name: 'Freedom', theme: 'Succession', pool: ['Logan R.', 'Kendall R.', 'Siobhan R.', 'Roman R.', 'Connor R.', 'Tom W.', 'Greg H.', 'Gerri K.', 'Frank V.', 'Karl M.', 'Marcia R.', 'Willa F.', 'Stewy H.', 'Sandi F.', 'Josh A.', 'Lukas M.', 'Karolina N.', 'Hugo B.'] },
  { name: 'Harmony', theme: 'Lost', pool: ['Jack S.', 'Kate A.', 'Sawyer F.', 'John L.', 'Hugo R.', 'Sayid J.', 'Jin K.', 'Sun K.', 'Charlie P.', 'Claire L.', 'Desmond H.', 'Juliet B.', 'Ben L.', 'Michael D.', 'Walt L.', 'Shannon R.', 'Boone C.', 'Richard A.'] },
  { name: 'Integrity', theme: 'The Office', pool: ['Michael S.', 'Dwight S.', 'Jim H.', 'Pam B.', 'Ryan H.', 'Andy B.', 'Angela M.', 'Kevin M.', 'Oscar M.', 'Stanley H.', 'Phyllis V.', 'Creed B.', 'Meredith P.', 'Kelly K.', 'Toby F.', 'Darryl P.', 'Erin H.', 'Gabe L.'] },
  { name: 'Serenity', theme: 'Seinfeld', pool: ['Jerry S.', 'George C.', 'Elaine B.', 'Cosmo K.', 'Newman V.', 'Frank C.', 'Estelle C.', 'Morty S.', 'Helen S.', 'David P.', 'J Peterman', 'Susan R.', 'Kenny B.', 'Tim W.', 'Jackie C.', 'Uncle L.', 'Soup N.', 'Babu B.'] },
  { name: 'Discharged', theme: 'Star Wars', pool: ['Luke S.', 'Leia O.', 'Han S.', 'Darth V.', 'Yoda M.', 'Obi-Wan K.', 'Chewbacca W.', 'R2 D.', 'C-3PO M.', 'Lando C.', 'Boba F.', 'Emperor P.', 'Padme A.', 'Mace W.', 'Qui-Gon J.', 'Ahsoka T.', 'Rey S.', 'Kylo R.'] }
];

const STATES = ['IL', 'WI', 'MI', 'IN', 'OH', 'IA', 'MN'];
const INSURANCES = ['Blue Cross Blue Shield', 'Medicaid', 'UnitedHealthcare', 'Aetna', 'Cigna'];
const THERAPISTS = ['Dr. Emmett Brown', 'Dr. Hannibal Lecter', 'Dr. Frasier Crane', 'Dr. Tobias Funke', 'Dr. Leo Marvin'];
const REASONS = ['Behavioral concerns and academic support need.', 'Emotional dysregulation requiring a structured environment.', 'Truancy and acute defiance at previous placement.', 'Acute anxiety preventing attendance in a mainstream setting.', 'Need for intensive therapeutic intervention.'];
const DISTRICTS = ['Springfield Public Schools', 'Shelbyville CSD', 'Capital City Unified', 'Pawnee School District', 'Eagleton Independent'];
const CONTACT_NAMES = ['Principal Seymour Skinner', 'Counselor Jerry Smith', 'Mr. George Feeny', 'Ms. Valerie Frizzle', 'Mr. Richard Vernon'];

let ID_COUNTER = 1000;
const MOCK_STUDENTS = [];

function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

UNITS.forEach(unit => {
  const isDischarged = unit.name === 'Discharged';
  const count = isDischarged ? (15 + Math.floor(Math.random() * 5)) : (14 + Math.floor(Math.random() * 5)); 
  const names = unit.pool.slice(0, count);
  
  names.forEach(name => {
    const parts = name.split(' ');
    const first = parts[0];
    const last = parts.slice(1).join(' ');
    
    let g;
    if (unit.name === 'Discovery') g = Math.floor(Math.random() * 6);
    else g = 6 + Math.floor(Math.random() * 7);

    const hasIEP = Math.random() > 0.3;
    const admitMonth = 1 + Math.floor(Math.random() * 11);
    const admitYear = isDischarged ? 2024 : 2025;
    const districtName = randItem(DISTRICTS);

    MOCK_STUDENTS.push({
      id: `student-${unit.name.toLowerCase()}-${ID_COUNTER++}`,
      studentName: name,
      firstName: first,
      lastName: last,
      gradeLevel: g === 0 ? 'K' : g,
      studentNumber: String(900000 + ID_COUNTER),
      unitName: unit.name,
      admitDate: `${admitYear}-${String(admitMonth).padStart(2,'0')}-15`,
      expectedDischargeDate: isDischarged ? `${admitYear+1}-${String(admitMonth).padStart(2,'0')}-15` : '',
      active: !isDischarged,
      district: districtName,
      homeState: randItem(STATES),
      healthInsurance: randItem(INSURANCES),
      therapistName: randItem(THERAPISTS),
      reasonForAdmit: randItem(REASONS),
      guardian1Name: `${last} Family Guardian`,
      guardian1Phone: `(555) ${Math.floor(100+Math.random()*900)}-${Math.floor(1000+Math.random()*9000)}`,
      guardian1Email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`.replace(' ', ''),
      guardian1Address: `${Math.floor(100+Math.random()*900)} Fake St, ${districtName.split(' ')[0]}, XX 12345`,
      homeSchoolName: `${districtName.split(' ')[0]} High School`,
      homeSchoolAddress: `456 Education Blvd, ${districtName.split(' ')[0]}`,
      homeSchoolContactName: randItem(CONTACT_NAMES),
      homeSchoolContactPosition: 'Guidance Counselor',
      homeSchoolContactNumber: `(555) ${Math.floor(100+Math.random()*900)}-${Math.floor(1000+Math.random()*9000)}`,
      homeSchoolContactEmail: `counselor@${districtName.split(' ')[0].toLowerCase()}schools.edu`,
      iep: hasIEP ? 'Yes' : 'No',
      iepDueDate: hasIEP ? `2026-${String(Math.floor(1+Math.random()*12)).padStart(2,'0')}-15` : '',
      guardianName: `${last} Family Guardian`,
      guardianPhone: `(555) ${Math.floor(100+Math.random()*900)}-${Math.floor(1000+Math.random()*9000)}`,
      homeSchoolContact: randItem(CONTACT_NAMES),
      mtpNotes: []
    });
  });
});

const COURSE_STUDENTS = {
  'mock-ela9': [], 'mock-ela10': [], 'mock-ela11': [], 'mock-ela12': [], 'mock-c07': [], 'mock-ms-eng': [],
  'mock-amhist': [], 'mock-wldhist': [], 'mock-civics': [], 'mock-ms-hist': [],
  'mock-intmath': [], 'mock-alg1': [], 'mock-geom': [], 'mock-alg2': [], 'mock-c09': [], 'mock-ms-math': [],
  'mock-intsci': [], 'mock-physci': [], 'mock-bio': [], 'mock-earthsci': [], 'mock-spacesci': [], 'mock-c06': [], 'mock-physics': [], 'mock-chem': [], 'mock-envsci': [], 'mock-ms-sci': [],
  'mock-c08': [], 'mock-elem-all': []
};

const Q3_MIDTERM_GRADES = {};

// Randomly enroll active students
MOCK_STUDENTS.forEach(s => {
  if (!s.active) return;

  const gStr = String(s.gradeLevel);
  const g = gStr === 'K' ? 0 : parseInt(gStr, 10);
  
  Q3_MIDTERM_GRADES[s.id] = {};
  
  const enroll = (course) => {
    if (!COURSE_STUDENTS[course]) COURSE_STUDENTS[course] = [];
    COURSE_STUDENTS[course].push(s.id);
    Q3_MIDTERM_GRADES[s.id][course] = 65 + Math.floor(Math.random() * 36);
  };

  if (g <= 5) {
     enroll('mock-elem-all'); 
  } else if (g >= 6 && g <= 8) {
     enroll('mock-ms-eng'); enroll('mock-ms-hist'); enroll('mock-ms-math'); enroll('mock-ms-sci');
  } else if (g === 9) {
     enroll('mock-ela9'); enroll('mock-alg1'); enroll('mock-earthsci'); enroll('mock-amhist');
  } else if (g === 10) {
     enroll('mock-ela10'); enroll('mock-geom'); enroll('mock-bio'); enroll('mock-wldhist');
  } else if (g >= 11) {
     enroll(g === 11 ? 'mock-ela11' : 'mock-ela12'); enroll('mock-civics');
     enroll(Math.random() > 0.5 ? 'mock-alg2' : 'mock-intmath');
     enroll(Math.random() > 0.5 ? 'mock-chem' : 'mock-envsci');
  }
});

const STUDENT_PROFILES = {};
MOCK_STUDENTS.forEach(s => {
    STUDENT_PROFILES[s.id] = { level: 0.6 + Math.random() * 0.35, variance: 0.05 + Math.random() * 0.1, attendance: 0.8 + Math.random() * 0.2 };
});

const activeStudents = MOCK_STUDENTS.filter(s => s.active);
const kteaTarget = activeStudents.length > 0 ? activeStudents[0] : MOCK_STUDENTS[0];

const KTEA_REPORTS = [
  {
    id: `ktea-${kteaTarget.id}-q1`,
    studentId: kteaTarget.id,
    studentName: kteaTarget.studentName,
    studentNumber: kteaTarget.studentNumber,
    unitName: kteaTarget.unitName,
    gradeLevel: kteaTarget.gradeLevel,
    admitDate: '2025-09-01',
    dischargeDate: '',
    teacherName: 'John Gawin',
    preReadingRaw: 80, preReadingStd: 120, preReadingGE: '11.2',
    preMathRaw: 70, preMathStd: 108, preMathGE: '10.0',
    preWritingRaw: 78, preWritingStd: 118, preWritingGE: '11.0',
    postReadingRaw: 84, postReadingStd: 125, postReadingGE: '12.0',
    postMathRaw: 73, postMathStd: 112, postMathGE: '10.5',
    postWritingRaw: 82, postWritingStd: 122, postWritingGE: '11.8',
    timestamp: '2026-03-31T10:00:00.000Z',
    lastUpdatedBy: 'john.gawin@lakeland.edu'
  }
];

const fileContent = `/**
 * Mock Data — Fictional Character Residents with Rich Data
 */

export const MOCK_DB_VERSION = '2026.04.01.v2';

export const MOCK_STUDENTS = ${JSON.stringify(MOCK_STUDENTS, null, 2)};

export const MOCK_COURSES = [
  { id: 'mock-elem-all', courseName: 'Elementary Core', subjectArea: 'Multiple', credits: 4, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-ela9', courseName: 'ELA 9', subjectArea: 'English', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-ela10', courseName: 'ELA 10', subjectArea: 'English', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-ela11', courseName: 'ELA 11', subjectArea: 'English', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-ela12', courseName: 'ELA 12', subjectArea: 'English', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c07', courseName: 'Creative Writing', subjectArea: 'English', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-ms-eng', courseName: 'English', subjectArea: 'English', credits: 1, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-amhist', courseName: 'American History', subjectArea: 'Social Studies', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-wldhist', courseName: 'World History', subjectArea: 'Social Studies', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-civics', courseName: 'Civics', subjectArea: 'Social Studies', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-ms-hist', courseName: 'History', subjectArea: 'Social Studies', credits: 1, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-intmath', courseName: 'Integrated Math', subjectArea: 'Math', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-alg1', courseName: 'Algebra 1', subjectArea: 'Math', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-geom', courseName: 'Geometry', subjectArea: 'Math', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-alg2', courseName: 'Algebra 2', subjectArea: 'Math', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c09', courseName: 'Financial Lit', subjectArea: 'Math', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-ms-math', courseName: '8th Grade Math', subjectArea: 'Math', credits: 1, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-intsci', courseName: 'Integrated Science', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-physci', courseName: 'Physical Science', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-bio', courseName: 'Biology', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-earthsci', courseName: 'Earth Science', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-spacesci', courseName: 'Space Science', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c06', courseName: 'Ecology', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-physics', courseName: 'Physics', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-chem', courseName: 'Chemistry', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-envsci', courseName: 'Environmental Science', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-ms-sci', courseName: 'Science', subjectArea: 'Science', credits: 1, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c08', courseName: 'Novels', subjectArea: 'Elective', credits: 2.5, term: '2025-2026', teacherName: 'John Gawin' },
];

export const COURSE_STUDENTS = ${JSON.stringify(COURSE_STUDENTS, null, 2)};

export const COURSE_ASSIGNMENTS = {
  'mock-ela9': [], 'mock-ela10': [], 'mock-ela11': [], 'mock-ela12': [], 'mock-c07': [], 'mock-ms-eng': [],
  'mock-amhist': [], 'mock-wldhist': [], 'mock-civics': [], 'mock-ms-hist': [],
  'mock-intmath': [], 'mock-alg1': [], 'mock-geom': [], 'mock-alg2': [], 'mock-c09': [], 'mock-ms-math': [],
  'mock-intsci': [], 'mock-physci': [], 'mock-bio': [], 'mock-earthsci': [], 'mock-spacesci': [], 'mock-c06': [], 'mock-physics': [], 'mock-chem': [], 'mock-envsci': [], 'mock-ms-sci': [],
  'mock-c08': [], 'mock-elem-all': []
};

export const Q3_MIDTERM_GRADES = ${JSON.stringify(Q3_MIDTERM_GRADES, null, 2)};

export const GRADEBOOK_CATEGORIES = [
  { id: 'cat-hw', name: 'Homework', weight: 0.20 },
  { id: 'cat-quiz', name: 'Quizzes', weight: 0.30 },
  { id: 'cat-test', name: 'Tests', weight: 0.50 }
];

export const STUDENT_PROFILES = ${JSON.stringify(STUDENT_PROFILES, null, 2)};

export const MOCK_KTEA_REPORTS = ${JSON.stringify(KTEA_REPORTS, null, 2)};

export const ATTENDANCE_DATES = [
  '2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09', '2025-01-10',
  '2025-01-13', '2025-01-14', '2025-01-15', '2025-01-16', '2025-01-17',
  '2025-01-21', '2025-01-22', '2025-01-23', '2025-01-24', '2025-01-27',
];
`;

fs.writeFileSync('src/data/mockData.js', fileContent);
console.log('mockData.js completely overwritten successfully with rich data and Discharged students!');
