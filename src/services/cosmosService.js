import { CosmosClient } from "@azure/cosmos";

// ⚠️ SECURITY WARNING: In production, these keys belong in Azure Key Vault / Environment Variables.
// For Local Dev/Prototyping, paste them here but DO NOT commit this file to public GitHub.
const ENDPOINT = "https://YOUR-COSMOS-DB-NAME.documents.azure.com:443/";
const KEY = "YOUR_PRIMARY_KEY_HERE";

const client = new CosmosClient({ endpoint: ENDPOINT, key: KEY });
const database = client.database("LakelandHubDB");

// Existing Containers
const kteaContainer = database.container("KTEA_Reports");
const auditContainer = database.container("Audit_Logs");
const gradebookContainer = database.container("Gradebooks");

// New Relational-Style Containers for Grading
const studentsContainer = database.container("Students");
const coursesContainer = database.container("Courses");
const enrollmentsContainer = database.container("Enrollments");

/**
 * @typedef {object} Student
 * @property {string} id - The unique identifier for the student.
 * @property {string} studentName - The full name of the student.
 * @property {number} gradeLevel - The student's current grade level.
 * @property {string} unitName - The name of the residential unit the student belongs to (e.g., "Harmony", "Integrity").
 */

/**
 * @typedef {object} Course
 * @property {string} id - The unique identifier for the course.
 * @property {string} courseName - The name of the course (e.g., "English 9", "Algebra 1").
 * @property {string} teacherName - The name of the teacher assigned to the course.
 * @property {number} credits - The credit value of the course.
 */

/**
 * @typedef {object} Enrollment
 * @property {string} id - The unique identifier for the enrollment record.
 * @property {string} studentId - The ID of the student enrolled.
 * @property {string} courseId - The ID of the course the student is enrolled in.
 * @property {number} percentage - The student's current percentage in the course.
 * @property {string} letterGrade - The student's current letter grade (e.g., "A+", "B-").
 * @property {string} term - The academic term (e.g., "Q1", "S1", "Final").
 */

export const cosmosService = {
  // --- Existing KTEA Functions ---

  // 1. CREATE (Add to Queue/Submit)
  addKteaReport: async (item) => {
    const { resource } = await kteaContainer.items.create({
      ...item,
      id: undefined, // Let Cosmos generate the ID
      timestamp: new Date().toISOString()
    });
    return resource;
  },

  // 2. READ (Search)
  searchKteaReports: async (searchTerm) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE CONTAINS(LOWER(c.studentName), @name)",
      parameters: [{ name: "@name", value: searchTerm.toLowerCase() }]
    };
    const { resources } = await kteaContainer.items.query(querySpec).fetchAll();
    return resources;
  },

  // --- New Grading System Functions ---

  /**
   * Fetches all students belonging to a specific residential unit.
   * @param {string} unitName - The name of the unit (e.g., "Harmony").
   * @returns {Promise<Student[]>} - An array of student objects.
   */
  getStudentsByUnit: async (unitName) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.unitName = @unitName",
      parameters: [{ name: "@unitName", value: unitName }]
    };
    const { resources } = await studentsContainer.items.query(querySpec).fetchAll();
    return resources;
  },

  /**
   * Fetches all courses taught by a specific teacher.
   * @param {string} teacherName - The name of the teacher.
   * @returns {Promise<Course[]>} - An array of course objects.
   */
  getCoursesByTeacher: async (teacherName) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.teacherName = @teacherName",
      parameters: [{ name: "@teacherName", value: teacherName }]
    };
    const { resources } = await coursesContainer.items.query(querySpec).fetchAll();
    return resources;
  },

  /**
   * Upserts a grade record for a specific student in a specific course.
   * @param {Enrollment} enrollmentData - The enrollment data to save.
   * @returns {Promise<Enrollment>} - The saved enrollment resource.
   */
  saveCourseGrade: async (enrollmentData) => {
    const { resource } = await enrollmentsContainer.items.upsert(enrollmentData);
    return resource;
  },

  /**
   * Fetches all Enrollment records for a specific student.
   * @param {string} studentId - The ID of the student.
   * @returns {Promise<Enrollment[]>} - An array of enrollment objects for the student.
   */
  getStudentMasterGrades: async (studentId) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.studentId = @studentId",
      parameters: [{ name: "@studentId", value: studentId }]
    };
    // In a real scenario, you'd likely join this with Courses to get course names.
    // For now, we'll just get the raw enrollment data.
    const { resources } = await enrollmentsContainer.items.query(querySpec).fetchAll();
    return resources;
  },


  // --- Generic & Legacy Functions ---

  // 5. AUDIT LOGGING (HIPAA)
  logAudit: async (user, action, details) => {
    if (!user) return;
    try {
      await auditContainer.items.create({
        userEmail: user.email,
        action,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Audit Logging Failed", e);
    }
  },

  saveGradebook: async (data) => {
    const { resource } = await gradebookContainer.items.upsert(data);
    return resource;
  },

  // 6. GET ALL (For Master Export)
  getAllKteaItems: async () => {
    const querySpec = { query: "SELECT * FROM c" };
    const { resources } = await kteaContainer.items.query(querySpec).fetchAll();
    return resources;
  }
};