/**
 * Mock Data — Fictional Character Residents
 * 36 active students across 6 units + 3 discharged, with full statistics.
 * Characters are grouped by unit theme for testing all app features.
 */

// ─── STUDENTS ──────────────────────────────────────────────────────────────────

export const MOCK_STUDENTS = [
  // === DETERMINATION (purple) — grit & perseverance ===
  { id: 'mock-s01', studentName: 'Harry Potter', firstName: 'Harry', lastName: 'Potter', gradeLevel: 10, unitName: 'Determination', admitDate: '2024-09-03', expectedDischargeDate: '2025-06-15', district: 'Hogwarts Regional', iep: 'No', active: true, homeSchoolContact: 'Minerva McGonagall, Guidance', guardianName: 'Vernon Dursley', guardianPhone: '(555) 234-5678', iepDueDate: '', mtpNotes: [{ id: 'mtp-hp-1', date: '2025-01-15T00:00:00.000Z', note: 'Harry has shown significant academic improvement this month. He is completing homework more consistently and participating in class discussions. Behaviorally, he has reduced outbursts and is using coping strategies when frustrated. Socially, he has made two close friends on the unit.', author: 'John Gawin' }] },
  { id: 'mock-s02', studentName: 'Katniss Everdeen', firstName: 'Katniss', lastName: 'Everdeen', gradeLevel: 11, unitName: 'Determination', admitDate: '2024-08-20', expectedDischargeDate: '2025-05-30', district: 'District 12 Schools', iep: 'No', active: true, homeSchoolContact: 'Effie Trinket, Case Manager', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s03', studentName: 'Naruto Uzumaki', firstName: 'Naruto', lastName: 'Uzumaki', gradeLevel: 9, unitName: 'Determination', admitDate: '2024-10-15', expectedDischargeDate: '2025-08-01', district: 'Konoha Academy District', iep: 'Yes', active: true, homeSchoolContact: 'Iruka Umino, Special Ed', guardianName: 'Jiraiya Sage', guardianPhone: '(555) 345-6789', iepDueDate: '2025-04-15', mtpNotes: [{ id: 'mtp-nu-1', date: '2025-01-10T00:00:00.000Z', note: 'Naruto continues to struggle with focus during independent work periods. He benefits from one-on-one redirection. Socially he is well-liked by peers but can be disruptive. IEP goals in reading comprehension are showing slow but steady progress.', author: 'John Gawin' }, { id: 'mtp-nu-2', date: '2025-02-12T00:00:00.000Z', note: 'Naruto made good progress in February. His reading comprehension scores improved by 8 points. He is responding well to the token economy system and earned full privileges this week. Social skills group attendance has been consistent.', author: 'John Gawin' }] },
  { id: 'mock-s04', studentName: 'Hermione Granger', firstName: 'Hermione', lastName: 'Granger', gradeLevel: 11, unitName: 'Determination', admitDate: '2024-09-03', expectedDischargeDate: '2025-06-15', district: 'Hogwarts Regional', iep: 'No', active: true, homeSchoolContact: 'Minerva McGonagall, Guidance', guardianName: 'Jean Granger', guardianPhone: '(555) 456-7890', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s05', studentName: 'Rocky Balboa', firstName: 'Rocky', lastName: 'Balboa', gradeLevel: 10, unitName: 'Determination', admitDate: '2024-11-01', expectedDischargeDate: '2025-09-01', district: 'Philadelphia City Schools', iep: 'Yes', active: true, homeSchoolContact: 'Mickey Goldmill, Counselor', guardianName: 'Adrian Balboa', guardianPhone: '(215) 555-1234', iepDueDate: '2025-05-20', mtpNotes: [{ id: 'mtp-rb-1', date: '2025-02-01T00:00:00.000Z', note: 'Rocky is making excellent progress in his behavior plan. Zero incidents of physical aggression this month. Academically he is working at grade level in math and slightly below in reading. He has become a positive peer leader on the unit.', author: 'John Gawin' }] },
  { id: 'mock-s06', studentName: 'Mulan Hua', firstName: 'Mulan', lastName: 'Hua', gradeLevel: 12, unitName: 'Determination', admitDate: '2024-07-15', expectedDischargeDate: '2025-04-30', district: 'Imperial Valley Unified', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Fa Zhou', guardianPhone: '(555) 567-8901', iepDueDate: '', mtpNotes: [] },

  // === DISCOVERY (yellow) — curiosity & exploration ===
  { id: 'mock-s07', studentName: 'Frodo Baggins', firstName: 'Frodo', lastName: 'Baggins', gradeLevel: 9, unitName: 'Discovery', admitDate: '2024-09-10', expectedDischargeDate: '2025-07-01', district: 'Shire Regional Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Bilbo Baggins', guardianPhone: '(555) 111-2222', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s08', studentName: 'Wednesday Addams', firstName: 'Wednesday', lastName: 'Addams', gradeLevel: 10, unitName: 'Discovery', admitDate: '2024-08-28', expectedDischargeDate: '2025-06-20', district: 'Nevermore Academy District', iep: 'No', active: true, homeSchoolContact: 'Larissa Weems, Principal', guardianName: 'Morticia Addams', guardianPhone: '(555) 666-1313', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s09', studentName: 'Sherlock Holmes', firstName: 'Sherlock', lastName: 'Holmes', gradeLevel: 11, unitName: 'Discovery', admitDate: '2024-09-05', expectedDischargeDate: '2025-06-01', district: 'Baker Street Prep District', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s10', studentName: 'Luna Lovegood', firstName: 'Luna', lastName: 'Lovegood', gradeLevel: 10, unitName: 'Discovery', admitDate: '2024-10-01', expectedDischargeDate: '2025-07-15', district: 'Hogwarts Regional', iep: 'Yes', active: true, homeSchoolContact: 'Aurora Sinistra, CST', guardianName: 'Xenophilius Lovegood', guardianPhone: '(555) 999-3333', iepDueDate: '2025-03-20', mtpNotes: [{ id: 'mtp-ll-1', date: '2025-01-20T00:00:00.000Z', note: 'Luna is adjusting well to the program. She engages deeply in creative subjects but needs support staying on task in math. Socially she is friendly but sometimes struggles with social cues. Her IEP goals around social pragmatics are being addressed in weekly group sessions.', author: 'John Gawin' }] },
  { id: 'mock-s11', studentName: 'Nancy Drew', firstName: 'Nancy', lastName: 'Drew', gradeLevel: 11, unitName: 'Discovery', admitDate: '2024-08-15', expectedDischargeDate: '2025-05-15', district: 'River Heights Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Carson Drew', guardianPhone: '(555) 444-5555', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s12', studentName: 'Newt Scamander', firstName: 'Newt', lastName: 'Scamander', gradeLevel: 12, unitName: 'Discovery', admitDate: '2024-09-01', expectedDischargeDate: '2025-06-30', district: 'Ministry Academy District', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },

  // === FREEDOM (sky) — independence & spirit ===
  { id: 'mock-s13', studentName: 'Robin Hood', firstName: 'Robin', lastName: 'Hood', gradeLevel: 11, unitName: 'Freedom', admitDate: '2024-10-20', expectedDischargeDate: '2025-08-15', district: 'Sherwood Forest District', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s14', studentName: 'Huck Finn', firstName: 'Huck', lastName: 'Finn', gradeLevel: 9, unitName: 'Freedom', admitDate: '2024-09-15', expectedDischargeDate: '2025-07-01', district: 'Hannibal Township Schools', iep: 'Yes', active: true, homeSchoolContact: 'Tom Sawyer, Advisor', guardianName: 'Widow Douglas', guardianPhone: '(555) 777-8888', iepDueDate: '2025-06-01', mtpNotes: [] },
  { id: 'mock-s15', studentName: 'Arya Stark', firstName: 'Arya', lastName: 'Stark', gradeLevel: 10, unitName: 'Freedom', admitDate: '2024-08-25', expectedDischargeDate: '2025-06-10', district: 'Winterfell Academy District', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Catelyn Stark', guardianPhone: '(555) 222-3333', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s16', studentName: 'Ferris Bueller', firstName: 'Ferris', lastName: 'Bueller', gradeLevel: 11, unitName: 'Freedom', admitDate: '2024-11-10', expectedDischargeDate: '2025-09-15', district: 'Shermer Township Schools', iep: 'No', active: true, homeSchoolContact: 'Ed Rooney, Dean', guardianName: 'Katie Bueller', guardianPhone: '(555) 888-9999', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s17', studentName: 'Rapunzel Corona', firstName: 'Rapunzel', lastName: 'Corona', gradeLevel: 10, unitName: 'Freedom', admitDate: '2024-09-20', expectedDischargeDate: '2025-06-25', district: 'Corona Kingdom Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s18', studentName: 'Peter Pan', firstName: 'Peter', lastName: 'Pan', gradeLevel: 9, unitName: 'Freedom', admitDate: '2024-10-05', expectedDischargeDate: '2025-08-01', district: 'Neverland Schools', iep: 'Yes', active: true, homeSchoolContact: '', guardianName: 'Tinker Bell', guardianPhone: '(555) 333-4444', iepDueDate: '2025-07-10', mtpNotes: [] },

  // === HARMONY (green) — peace & balance ===
  { id: 'mock-s19', studentName: 'Samwise Gamgee', firstName: 'Samwise', lastName: 'Gamgee', gradeLevel: 9, unitName: 'Harmony', admitDate: '2024-09-10', expectedDischargeDate: '2025-07-01', district: 'Shire Regional Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Hamfast Gamgee', guardianPhone: '(555) 111-4444', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s20', studentName: 'Belle French', firstName: 'Belle', lastName: 'French', gradeLevel: 10, unitName: 'Harmony', admitDate: '2024-08-18', expectedDischargeDate: '2025-06-15', district: 'Villeneuve Township Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Maurice French', guardianPhone: '(555) 555-6666', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s21', studentName: 'Atticus Finch', firstName: 'Atticus', lastName: 'Finch', gradeLevel: 12, unitName: 'Harmony', admitDate: '2024-07-20', expectedDischargeDate: '2025-04-30', district: 'Maycomb County Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s22', studentName: 'Cinderella Tremaine', firstName: 'Cinderella', lastName: 'Tremaine', gradeLevel: 10, unitName: 'Harmony', admitDate: '2024-10-10', expectedDischargeDate: '2025-08-01', district: 'Charmington Royal Academy', iep: 'Yes', active: true, homeSchoolContact: 'Fairy Godmother, CST Chair', guardianName: 'Lady Tremaine', guardianPhone: '(555) 777-1111', iepDueDate: '2025-04-01', mtpNotes: [{ id: 'mtp-ct-1', date: '2025-02-05T00:00:00.000Z', note: 'Cinderella is a role model student on the unit. She consistently completes all assignments and helps peers. Her IEP reading goals have been met and the team is considering declassification. Socially she is thriving and mentoring newer students.', author: 'John Gawin' }] },
  { id: 'mock-s23', studentName: 'Elsa Arendelle', firstName: 'Elsa', lastName: 'Arendelle', gradeLevel: 11, unitName: 'Harmony', admitDate: '2024-09-01', expectedDischargeDate: '2025-06-01', district: 'Arendelle Academy District', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s24', studentName: 'Forrest Gump', firstName: 'Forrest', lastName: 'Gump', gradeLevel: 9, unitName: 'Harmony', admitDate: '2024-11-05', expectedDischargeDate: '2025-09-01', district: 'Greenbow County Schools', iep: 'Yes', active: true, homeSchoolContact: 'Jenny Curran, Social Worker', guardianName: 'Mrs. Gump', guardianPhone: '(555) 888-2222', iepDueDate: '2025-05-15', mtpNotes: [] },

  // === INTEGRITY (orange) — honor & doing right ===
  { id: 'mock-s25', studentName: 'Steve Rogers', firstName: 'Steve', lastName: 'Rogers', gradeLevel: 11, unitName: 'Integrity', admitDate: '2024-09-02', expectedDischargeDate: '2025-06-15', district: 'Brooklyn Technical District', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s26', studentName: 'Leia Organa', firstName: 'Leia', lastName: 'Organa', gradeLevel: 12, unitName: 'Integrity', admitDate: '2024-08-12', expectedDischargeDate: '2025-05-20', district: 'Alderaan Academy District', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Bail Organa', guardianPhone: '(555) 444-7777', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s27', studentName: 'Aragorn Elessar', firstName: 'Aragorn', lastName: 'Elessar', gradeLevel: 12, unitName: 'Integrity', admitDate: '2024-07-25', expectedDischargeDate: '2025-05-01', district: 'Gondor Regional Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s28', studentName: 'Jean Valjean', firstName: 'Jean', lastName: 'Valjean', gradeLevel: 11, unitName: 'Integrity', admitDate: '2024-10-01', expectedDischargeDate: '2025-08-01', district: 'Digne Township Schools', iep: 'Yes', active: true, homeSchoolContact: 'Bishop Myriel, Counselor', guardianName: '', guardianPhone: '', iepDueDate: '2025-06-15', mtpNotes: [] },
  { id: 'mock-s29', studentName: 'Diana Prince', firstName: 'Diana', lastName: 'Prince', gradeLevel: 10, unitName: 'Integrity', admitDate: '2024-09-08', expectedDischargeDate: '2025-06-20', district: 'Themyscira Academy District', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Hippolyta', guardianPhone: '(555) 222-8888', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s30', studentName: 'Luke Skywalker', firstName: 'Luke', lastName: 'Skywalker', gradeLevel: 10, unitName: 'Integrity', admitDate: '2024-09-15', expectedDischargeDate: '2025-07-01', district: 'Tatooine Regional Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Owen Lars', guardianPhone: '(555) 333-9999', iepDueDate: '', mtpNotes: [] },

  // === SERENITY (blue) — calm & wisdom ===
  { id: 'mock-s31', studentName: 'Gandalf Grey', firstName: 'Gandalf', lastName: 'Grey', gradeLevel: 12, unitName: 'Serenity', admitDate: '2024-08-01', expectedDischargeDate: '2025-05-15', district: 'Middle Earth Regional', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s32', studentName: 'Mary Poppins', firstName: 'Mary', lastName: 'Poppins', gradeLevel: 11, unitName: 'Serenity', admitDate: '2024-09-05', expectedDischargeDate: '2025-06-15', district: 'Cherry Tree Lane District', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s33', studentName: 'Shaggy Rogers', firstName: 'Shaggy', lastName: 'Rogers', gradeLevel: 9, unitName: 'Serenity', admitDate: '2024-10-20', expectedDischargeDate: '2025-08-15', district: 'Coolsville Schools', iep: 'Yes', active: true, homeSchoolContact: 'Velma Dinkley, CST', guardianName: 'Norville Rogers Sr.', guardianPhone: '(555) 666-4444', iepDueDate: '2025-03-30', mtpNotes: [] },
  { id: 'mock-s34', studentName: 'Jasmine Agrabah', firstName: 'Jasmine', lastName: 'Agrabah', gradeLevel: 10, unitName: 'Serenity', admitDate: '2024-09-12', expectedDischargeDate: '2025-06-30', district: 'Agrabah Royal Academy', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Sultan Agrabah', guardianPhone: '(555) 999-1111', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s35', studentName: 'Iroh Sozin', firstName: 'Iroh', lastName: 'Sozin', gradeLevel: 12, unitName: 'Serenity', admitDate: '2024-07-10', expectedDischargeDate: '2025-04-15', district: 'Ba Sing Se Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s36', studentName: 'Totoro Kusakabe', firstName: 'Totoro', lastName: 'Kusakabe', gradeLevel: 9, unitName: 'Serenity', admitDate: '2024-11-01', expectedDischargeDate: '2025-09-01', district: 'Satsuki Regional Schools', iep: 'No', active: true, homeSchoolContact: '', guardianName: 'Tatsuo Kusakabe', guardianPhone: '(555) 111-7777', iepDueDate: '', mtpNotes: [] },

  // === DISCHARGED ===
  { id: 'mock-s37', studentName: 'Draco Malfoy', firstName: 'Draco', lastName: 'Malfoy', gradeLevel: 11, unitName: 'Discharged', admitDate: '2024-03-15', expectedDischargeDate: '2024-12-20', district: 'Hogwarts Regional', iep: 'No', active: false, homeSchoolContact: '', guardianName: 'Lucius Malfoy', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s38', studentName: 'Loki Laufeyson', firstName: 'Loki', lastName: 'Laufeyson', gradeLevel: 12, unitName: 'Discharged', admitDate: '2024-01-10', expectedDischargeDate: '2024-11-15', district: 'Asgard Preparatory District', iep: 'No', active: false, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
  { id: 'mock-s39', studentName: 'Scar Pridelands', firstName: 'Scar', lastName: 'Pridelands', gradeLevel: 10, unitName: 'Discharged', admitDate: '2024-04-01', expectedDischargeDate: '2025-01-10', district: 'Pride Rock Academy', iep: 'Yes', active: false, homeSchoolContact: '', guardianName: '', guardianPhone: '', iepDueDate: '', mtpNotes: [] },
];

// ─── COURSES ───────────────────────────────────────────────────────────────────

export const MOCK_COURSES = [
  { id: 'mock-c01', courseName: 'English 10', subjectArea: 'English', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c02', courseName: 'Algebra II', subjectArea: 'Math', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c03', courseName: 'US History', subjectArea: 'Social Studies', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c04', courseName: 'Biology', subjectArea: 'Science', credits: 5, term: '2025-2026', teacherName: 'John Gawin' },
  { id: 'mock-c05', courseName: 'Creative Writing', subjectArea: 'Elective', credits: 2.5, term: '2025-2026', teacherName: 'John Gawin' },
];

// ─── COURSE → STUDENT ENROLLMENT MAP ───────────────────────────────────────────

export const COURSE_STUDENTS = {
  'mock-c01': ['mock-s01', 'mock-s02', 'mock-s08', 'mock-s15', 'mock-s19', 'mock-s20', 'mock-s25', 'mock-s31'],
  'mock-c02': ['mock-s04', 'mock-s10', 'mock-s23', 'mock-s24', 'mock-s29', 'mock-s30', 'mock-s32'],
  'mock-c03': ['mock-s03', 'mock-s05', 'mock-s07', 'mock-s09', 'mock-s13', 'mock-s14', 'mock-s21', 'mock-s28'],
  'mock-c04': ['mock-s06', 'mock-s11', 'mock-s12', 'mock-s22', 'mock-s26', 'mock-s33'],
  'mock-c05': ['mock-s16', 'mock-s17', 'mock-s18', 'mock-s20', 'mock-s27', 'mock-s34'],
};

// ─── ASSIGNMENTS PER COURSE ────────────────────────────────────────────────────

export const COURSE_ASSIGNMENTS = {
  'mock-c01': [
    { id: 'a01', name: 'Personal Narrative Essay', categoryId: 'cat-hw', maxScore: 100 },
    { id: 'a02', name: 'Vocabulary Quiz Ch.1-3', categoryId: 'cat-quiz', maxScore: 20 },
    { id: 'a03', name: 'Romeo & Juliet Test', categoryId: 'cat-test', maxScore: 100 },
    { id: 'a04', name: 'Persuasive Essay', categoryId: 'cat-hw', maxScore: 100 },
    { id: 'a05', name: 'Poetry Analysis Quiz', categoryId: 'cat-quiz', maxScore: 25 },
    { id: 'a06', name: 'Midterm Exam', categoryId: 'cat-test', maxScore: 150 },
  ],
  'mock-c02': [
    { id: 'a07', name: 'Problem Set 1: Polynomials', categoryId: 'cat-hw', maxScore: 50 },
    { id: 'a08', name: 'Quiz: Factoring', categoryId: 'cat-quiz', maxScore: 30 },
    { id: 'a09', name: 'Unit 1 Test: Polynomials', categoryId: 'cat-test', maxScore: 100 },
    { id: 'a10', name: 'Problem Set 2: Rational Expressions', categoryId: 'cat-hw', maxScore: 50 },
    { id: 'a11', name: 'Quiz: Rational Functions', categoryId: 'cat-quiz', maxScore: 30 },
    { id: 'a12', name: 'Unit 2 Test: Rationals', categoryId: 'cat-test', maxScore: 100 },
  ],
  'mock-c03': [
    { id: 'a13', name: 'Reading Notes: Colonial Era', categoryId: 'cat-hw', maxScore: 25 },
    { id: 'a14', name: 'Map Quiz: 13 Colonies', categoryId: 'cat-quiz', maxScore: 20 },
    { id: 'a15', name: 'American Revolution Test', categoryId: 'cat-test', maxScore: 100 },
    { id: 'a16', name: 'Reading Notes: Civil War', categoryId: 'cat-hw', maxScore: 25 },
    { id: 'a17', name: 'Amendment Quiz', categoryId: 'cat-quiz', maxScore: 25 },
    { id: 'a18', name: 'Civil War & Reconstruction Test', categoryId: 'cat-test', maxScore: 100 },
  ],
  'mock-c04': [
    { id: 'a19', name: 'Lab Report: Microscopy', categoryId: 'cat-hw', maxScore: 50 },
    { id: 'a20', name: 'Cell Structure Quiz', categoryId: 'cat-quiz', maxScore: 25 },
    { id: 'a21', name: 'Genetics Test', categoryId: 'cat-test', maxScore: 100 },
    { id: 'a22', name: 'Lab Report: DNA Extraction', categoryId: 'cat-hw', maxScore: 50 },
    { id: 'a23', name: 'Photosynthesis Quiz', categoryId: 'cat-quiz', maxScore: 20 },
    { id: 'a24', name: 'Ecology Test', categoryId: 'cat-test', maxScore: 100 },
  ],
  'mock-c05': [
    { id: 'a25', name: 'Short Story Draft', categoryId: 'cat-hw', maxScore: 100 },
    { id: 'a26', name: 'Literary Devices Quiz', categoryId: 'cat-quiz', maxScore: 20 },
    { id: 'a27', name: 'Portfolio Submission', categoryId: 'cat-test', maxScore: 200 },
    { id: 'a28', name: 'Flash Fiction Exercise', categoryId: 'cat-hw', maxScore: 50 },
    { id: 'a29', name: 'Peer Review Quiz', categoryId: 'cat-quiz', maxScore: 25 },
  ],
};

// ─── STANDARD CATEGORIES ───────────────────────────────────────────────────────

export const GRADEBOOK_CATEGORIES = [
  { id: 'cat-hw', name: 'Homework', weight: 0.20 },
  { id: 'cat-quiz', name: 'Quizzes', weight: 0.30 },
  { id: 'cat-test', name: 'Tests', weight: 0.50 },
];

// ─── STUDENT PERFORMANCE PROFILES ──────────────────────────────────────────────
// level: base performance (0-1), variance: grade scatter, attendance: show-up rate

export const STUDENT_PROFILES = {
  'mock-s01': { level: 0.85, variance: 0.08, attendance: 0.92 },  // Harry — good but occasionally distracted
  'mock-s02': { level: 0.88, variance: 0.06, attendance: 0.95 },  // Katniss — determined, focused
  'mock-s03': { level: 0.72, variance: 0.12, attendance: 0.80 },  // Naruto — variable, often late
  'mock-s04': { level: 0.97, variance: 0.02, attendance: 0.99 },  // Hermione — near perfect
  'mock-s05': { level: 0.68, variance: 0.10, attendance: 0.88 },  // Rocky — struggles academically but shows up
  'mock-s06': { level: 0.90, variance: 0.05, attendance: 0.96 },  // Mulan — disciplined, strong
  'mock-s07': { level: 0.78, variance: 0.08, attendance: 0.90 },  // Frodo — steady, modest
  'mock-s08': { level: 0.94, variance: 0.04, attendance: 0.85 },  // Wednesday — brilliant but skips class
  'mock-s09': { level: 0.96, variance: 0.03, attendance: 0.88 },  // Sherlock — genius, bored easily
  'mock-s10': { level: 0.82, variance: 0.10, attendance: 0.87 },  // Luna — creative but scattered
  'mock-s11': { level: 0.91, variance: 0.04, attendance: 0.95 },  // Nancy Drew — thorough, reliable
  'mock-s12': { level: 0.88, variance: 0.06, attendance: 0.93 },  // Newt — good in science, ok elsewhere
  'mock-s13': { level: 0.75, variance: 0.09, attendance: 0.82 },  // Robin Hood — rebellious
  'mock-s14': { level: 0.65, variance: 0.12, attendance: 0.75 },  // Huck Finn — free spirit, skips often
  'mock-s15': { level: 0.86, variance: 0.07, attendance: 0.91 },  // Arya — focused, determined
  'mock-s16': { level: 0.76, variance: 0.10, attendance: 0.70 },  // Ferris — smart but skips constantly
  'mock-s17': { level: 0.84, variance: 0.06, attendance: 0.94 },  // Rapunzel — eager learner
  'mock-s18': { level: 0.62, variance: 0.14, attendance: 0.72 },  // Peter Pan — doesn't want to grow up
  'mock-s19': { level: 0.80, variance: 0.06, attendance: 0.97 },  // Samwise — loyal, always shows up
  'mock-s20': { level: 0.93, variance: 0.04, attendance: 0.98 },  // Belle — loves learning
  'mock-s21': { level: 0.92, variance: 0.03, attendance: 0.97 },  // Atticus — wise, dedicated
  'mock-s22': { level: 0.77, variance: 0.08, attendance: 0.90 },  // Cinderella — hardworking despite obstacles
  'mock-s23': { level: 0.89, variance: 0.05, attendance: 0.93 },  // Elsa — bright, reserved
  'mock-s24': { level: 0.60, variance: 0.10, attendance: 0.98 },  // Forrest — always shows up, low scores
  'mock-s25': { level: 0.87, variance: 0.05, attendance: 0.96 },  // Steve Rogers — disciplined
  'mock-s26': { level: 0.91, variance: 0.04, attendance: 0.94 },  // Leia — leader, sharp
  'mock-s27': { level: 0.85, variance: 0.06, attendance: 0.92 },  // Aragorn — capable, quiet
  'mock-s28': { level: 0.74, variance: 0.09, attendance: 0.88 },  // Jean Valjean — improving
  'mock-s29': { level: 0.90, variance: 0.05, attendance: 0.95 },  // Diana Prince — excellent
  'mock-s30': { level: 0.83, variance: 0.07, attendance: 0.92 },  // Luke — good, some gaps
  'mock-s31': { level: 0.95, variance: 0.03, attendance: 0.90 },  // Gandalf — wise
  'mock-s32': { level: 0.92, variance: 0.04, attendance: 0.98 },  // Mary Poppins — practically perfect
  'mock-s33': { level: 0.55, variance: 0.15, attendance: 0.73 },  // Shaggy — low effort, would rather eat
  'mock-s34': { level: 0.87, variance: 0.06, attendance: 0.94 },  // Jasmine — bright, motivated
  'mock-s35': { level: 0.91, variance: 0.04, attendance: 0.96 },  // Iroh — wise, patient
  'mock-s36': { level: 0.79, variance: 0.08, attendance: 0.91 },  // Totoro — gentle, quiet
};

// ─── KTEA ASSESSMENT REPORTS ───────────────────────────────────────────────────
// Pre-test for all, post-test only for students admitted before Oct 2024

export const MOCK_KTEA_REPORTS = [
  {
    id: 'mock-k01', studentName: 'Harry Potter', gradeLevel: 10, unitName: 'Determination',
    admitDate: '2024-09-03', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 72, preReadingStd: 105, preReadingGE: '9.8',
    preMathRaw: 68, preMathStd: 100, preMathGE: '9.5',
    preWritingRaw: 65, preWritingStd: 102, preWritingGE: '9.6',
    postReadingRaw: 78, postReadingStd: 112, postReadingGE: '10.5',
    postMathRaw: 74, postMathStd: 108, postMathGE: '10.2',
    postWritingRaw: 70, postWritingStd: 108, postWritingGE: '10.3',
    timestamp: '2025-01-15T10:00:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k02', studentName: 'Hermione Granger', gradeLevel: 11, unitName: 'Determination',
    admitDate: '2024-09-03', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 88, preReadingStd: 132, preReadingGE: '12.9',
    preMathRaw: 85, preMathStd: 128, preMathGE: '12.5',
    preWritingRaw: 82, preWritingStd: 130, preWritingGE: '12.8',
    postReadingRaw: 90, postReadingStd: 135, postReadingGE: '12.9',
    postMathRaw: 88, postMathStd: 132, postMathGE: '12.9',
    postWritingRaw: 86, postWritingStd: 133, postWritingGE: '12.9',
    timestamp: '2025-01-15T10:15:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k03', studentName: 'Naruto Uzumaki', gradeLevel: 9, unitName: 'Determination',
    admitDate: '2024-10-15', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 52, preReadingStd: 82, preReadingGE: '7.2',
    preMathRaw: 58, preMathStd: 88, preMathGE: '7.8',
    preWritingRaw: 48, preWritingStd: 78, preWritingGE: '6.5',
    postReadingRaw: '', postReadingStd: '', postReadingGE: '',
    postMathRaw: '', postMathStd: '', postMathGE: '',
    postWritingRaw: '', postWritingStd: '', postWritingGE: '',
    timestamp: '2024-11-01T09:30:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k04', studentName: 'Wednesday Addams', gradeLevel: 10, unitName: 'Discovery',
    admitDate: '2024-08-28', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 82, preReadingStd: 122, preReadingGE: '11.5',
    preMathRaw: 78, preMathStd: 118, preMathGE: '11.0',
    preWritingRaw: 85, preWritingStd: 125, preWritingGE: '12.0',
    postReadingRaw: 85, postReadingStd: 126, postReadingGE: '12.2',
    postMathRaw: 80, postMathStd: 120, postMathGE: '11.5',
    postWritingRaw: 87, postWritingStd: 128, postWritingGE: '12.5',
    timestamp: '2025-01-20T11:00:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k05', studentName: 'Forrest Gump', gradeLevel: 9, unitName: 'Harmony',
    admitDate: '2024-11-05', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 38, preReadingStd: 72, preReadingGE: '5.5',
    preMathRaw: 42, preMathStd: 75, preMathGE: '6.0',
    preWritingRaw: 35, preWritingStd: 68, preWritingGE: '5.0',
    postReadingRaw: '', postReadingStd: '', postReadingGE: '',
    postMathRaw: '', postMathStd: '', postMathGE: '',
    postWritingRaw: '', postWritingStd: '', postWritingGE: '',
    timestamp: '2024-11-20T14:00:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k06', studentName: 'Shaggy Rogers', gradeLevel: 9, unitName: 'Serenity',
    admitDate: '2024-10-20', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 40, preReadingStd: 74, preReadingGE: '5.8',
    preMathRaw: 35, preMathStd: 70, preMathGE: '5.2',
    preWritingRaw: 38, preWritingStd: 72, preWritingGE: '5.5',
    postReadingRaw: '', postReadingStd: '', postReadingGE: '',
    postMathRaw: '', postMathStd: '', postMathGE: '',
    postWritingRaw: '', postWritingStd: '', postWritingGE: '',
    timestamp: '2024-11-05T10:30:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k07', studentName: 'Belle French', gradeLevel: 10, unitName: 'Harmony',
    admitDate: '2024-08-18', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 80, preReadingStd: 120, preReadingGE: '11.2',
    preMathRaw: 70, preMathStd: 108, preMathGE: '10.0',
    preWritingRaw: 78, preWritingStd: 118, preWritingGE: '11.0',
    postReadingRaw: 84, postReadingStd: 125, postReadingGE: '12.0',
    postMathRaw: 73, postMathStd: 112, postMathGE: '10.5',
    postWritingRaw: 82, postWritingStd: 122, postWritingGE: '11.8',
    timestamp: '2025-01-10T09:00:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k08', studentName: 'Steve Rogers', gradeLevel: 11, unitName: 'Integrity',
    admitDate: '2024-09-02', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 74, preReadingStd: 108, preReadingGE: '10.2',
    preMathRaw: 72, preMathStd: 106, preMathGE: '10.0',
    preWritingRaw: 70, preWritingStd: 104, preWritingGE: '9.8',
    postReadingRaw: 80, postReadingStd: 115, postReadingGE: '11.0',
    postMathRaw: 78, postMathStd: 112, postMathGE: '10.8',
    postWritingRaw: 76, postWritingStd: 110, postWritingGE: '10.5',
    timestamp: '2025-01-18T13:00:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k09', studentName: 'Sherlock Holmes', gradeLevel: 11, unitName: 'Discovery',
    admitDate: '2024-09-05', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 86, preReadingStd: 128, preReadingGE: '12.5',
    preMathRaw: 82, preMathStd: 125, preMathGE: '12.2',
    preWritingRaw: 75, preWritingStd: 112, preWritingGE: '10.8',
    postReadingRaw: 88, postReadingStd: 130, postReadingGE: '12.8',
    postMathRaw: 85, postMathStd: 128, postMathGE: '12.5',
    postWritingRaw: 78, postWritingStd: 115, postWritingGE: '11.2',
    timestamp: '2025-01-22T10:30:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k10', studentName: 'Huck Finn', gradeLevel: 9, unitName: 'Freedom',
    admitDate: '2024-09-15', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 45, preReadingStd: 78, preReadingGE: '6.2',
    preMathRaw: 50, preMathStd: 82, preMathGE: '6.8',
    preWritingRaw: 42, preWritingStd: 75, preWritingGE: '5.8',
    postReadingRaw: 52, postReadingStd: 85, postReadingGE: '7.0',
    postMathRaw: 56, postMathStd: 88, postMathGE: '7.5',
    postWritingRaw: 48, postWritingStd: 80, postWritingGE: '6.5',
    timestamp: '2025-01-12T14:30:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k11', studentName: 'Draco Malfoy', gradeLevel: 11, unitName: 'Discharged',
    admitDate: '2024-03-15', dischargeDate: '2024-12-20', teacherName: 'John Gawin',
    preReadingRaw: 70, preReadingStd: 102, preReadingGE: '9.5',
    preMathRaw: 72, preMathStd: 105, preMathGE: '9.8',
    preWritingRaw: 68, preWritingStd: 100, preWritingGE: '9.2',
    postReadingRaw: 72, postReadingStd: 104, postReadingGE: '9.8',
    postMathRaw: 73, postMathStd: 106, postMathGE: '10.0',
    postWritingRaw: 70, postWritingStd: 102, postWritingGE: '9.5',
    timestamp: '2024-12-18T11:00:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k12', studentName: 'Leia Organa', gradeLevel: 12, unitName: 'Integrity',
    admitDate: '2024-08-12', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 78, preReadingStd: 115, preReadingGE: '11.0',
    preMathRaw: 76, preMathStd: 112, preMathGE: '10.8',
    preWritingRaw: 80, preWritingStd: 118, preWritingGE: '11.5',
    postReadingRaw: 82, postReadingStd: 120, postReadingGE: '11.8',
    postMathRaw: 80, postMathStd: 118, postMathGE: '11.5',
    postWritingRaw: 84, postWritingStd: 122, postWritingGE: '12.0',
    timestamp: '2025-01-25T09:45:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k13', studentName: 'Gandalf Grey', gradeLevel: 12, unitName: 'Serenity',
    admitDate: '2024-08-01', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 85, preReadingStd: 126, preReadingGE: '12.2',
    preMathRaw: 80, preMathStd: 120, preMathGE: '11.8',
    preWritingRaw: 83, preWritingStd: 124, preWritingGE: '12.0',
    postReadingRaw: 88, postReadingStd: 130, postReadingGE: '12.8',
    postMathRaw: 83, postMathStd: 124, postMathGE: '12.2',
    postWritingRaw: 86, postWritingStd: 128, postWritingGE: '12.5',
    timestamp: '2025-01-28T10:00:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k14', studentName: 'Rocky Balboa', gradeLevel: 10, unitName: 'Determination',
    admitDate: '2024-11-01', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 48, preReadingStd: 80, preReadingGE: '6.5',
    preMathRaw: 52, preMathStd: 84, preMathGE: '7.0',
    preWritingRaw: 45, preWritingStd: 76, preWritingGE: '6.0',
    postReadingRaw: '', postReadingStd: '', postReadingGE: '',
    postMathRaw: '', postMathStd: '', postMathGE: '',
    postWritingRaw: '', postWritingStd: '', postWritingGE: '',
    timestamp: '2024-11-15T09:00:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
  {
    id: 'mock-k15', studentName: 'Mary Poppins', gradeLevel: 11, unitName: 'Serenity',
    admitDate: '2024-09-05', dischargeDate: '', teacherName: 'John Gawin',
    preReadingRaw: 80, preReadingStd: 120, preReadingGE: '11.5',
    preMathRaw: 78, preMathStd: 118, preMathGE: '11.2',
    preWritingRaw: 82, preWritingStd: 122, preWritingGE: '11.8',
    postReadingRaw: 84, postReadingStd: 124, postReadingGE: '12.0',
    postMathRaw: 82, postMathStd: 122, postMathGE: '11.8',
    postWritingRaw: 85, postWritingStd: 125, postWritingGE: '12.2',
    timestamp: '2025-01-30T11:30:00.000Z', lastUpdatedBy: 'john.gawin@lakeland.edu',
  },
];

// ─── ATTENDANCE DATES ──────────────────────────────────────────────────────────
// 15 school days (3 weeks) for generating attendance records

export const ATTENDANCE_DATES = [
  '2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09', '2025-01-10',
  '2025-01-13', '2025-01-14', '2025-01-15', '2025-01-16', '2025-01-17',
  '2025-01-21', '2025-01-22', '2025-01-23', '2025-01-24', '2025-01-27',
];
