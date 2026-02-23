import { CosmosClient } from "@azure/cosmos";

const ENDPOINT = process.env.REACT_APP_COSMOS_ENDPOINT;
const KEY = process.env.REACT_APP_COSMOS_KEY;

if (!ENDPOINT || !KEY) {
  console.error(
    "[databaseService] Missing REACT_APP_COSMOS_ENDPOINT or REACT_APP_COSMOS_KEY in environment."
  );
}

const client = new CosmosClient({ endpoint: ENDPOINT, key: KEY });
const database = client.database("LakelandHubDB");

// Containers
const studentsContainer = database.container("Students");
const kteaContainer = database.container("KTEA_Reports");
const auditContainer = database.container("Audit_Logs");
const gradebookContainer = database.container("Gradebooks");
const coursesContainer = database.container("Courses");
const enrollmentsContainer = database.container("Enrollments");

export const databaseService = {

  // =========================================================================
  // STUDENTS
  // =========================================================================

  getAllStudents: async () => {
    const { resources } = await studentsContainer.items
      .query("SELECT * FROM c")
      .fetchAll();
    return resources;
  },

  findStudentByName: async (name) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE CONTAINS(LOWER(c.studentName), @name)",
      parameters: [{ name: "@name", value: name.toLowerCase() }],
    };
    const { resources } = await studentsContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  },

  upsertStudent: async (studentData) => {
    const { resource } = await studentsContainer.items.upsert(studentData);
    return resource;
  },

  deleteStudent: async (id) => {
    await studentsContainer.item(id, id).delete();
  },

  getStudentsByUnit: async (unitName) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.unitName = @unitName",
      parameters: [{ name: "@unitName", value: unitName }],
    };
    const { resources } = await studentsContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  },

  // =========================================================================
  // KTEA REPORTS
  // =========================================================================

  addKteaReport: async (item) => {
    const { resource } = await kteaContainer.items.create({
      ...item,
      id: undefined,
      timestamp: new Date().toISOString(),
    });
    return resource;
  },

  searchKteaReports: async (searchTerm) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE CONTAINS(LOWER(c.studentName), @name)",
      parameters: [{ name: "@name", value: searchTerm.toLowerCase() }],
    };
    const { resources } = await kteaContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  },

  getAllKteaReports: async () => {
    const { resources } = await kteaContainer.items
      .query("SELECT * FROM c")
      .fetchAll();
    return resources;
  },

  updateKteaReport: async (id, data) => {
    const { resource } = await kteaContainer.items.upsert({ ...data, id });
    return resource;
  },

  deleteKteaReport: async (id) => {
    await kteaContainer.item(id, id).delete();
  },

  // =========================================================================
  // GRADING — Courses & Enrollments
  // =========================================================================

  getCoursesByTeacher: async (teacherName) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.teacherName = @teacherName",
      parameters: [{ name: "@teacherName", value: teacherName }],
    };
    const { resources } = await coursesContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  },

  saveCourseGrade: async (enrollmentData) => {
    const { resource } = await enrollmentsContainer.items.upsert(
      enrollmentData
    );
    return resource;
  },

  getStudentMasterGrades: async (studentId) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.studentId = @studentId",
      parameters: [{ name: "@studentId", value: studentId }],
    };
    const { resources } = await enrollmentsContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  },

  saveGradebook: async (data) => {
    const { resource } = await gradebookContainer.items.upsert(data);
    return resource;
  },

  // =========================================================================
  // COURSES — CRUD
  // =========================================================================

  getAllCourses: async () => {
    const { resources } = await coursesContainer.items
      .query("SELECT * FROM c")
      .fetchAll();
    return resources;
  },

  addCourse: async (courseData) => {
    const { resource } = await coursesContainer.items.create({
      ...courseData,
      id: courseData.id || `course-${Date.now()}`,
    });
    return resource;
  },

  updateCourse: async (id, courseData) => {
    const { resource } = await coursesContainer.items.upsert({ ...courseData, id });
    return resource;
  },

  deleteCourse: async (id) => {
    await coursesContainer.item(id, id).delete();
  },

  // =========================================================================
  // ENROLLMENTS — Management
  // =========================================================================

  enrollStudent: async (enrollmentData) => {
    const { resource } = await enrollmentsContainer.items.upsert(enrollmentData);
    return resource;
  },

  unenrollStudent: async (enrollmentId) => {
    await enrollmentsContainer.item(enrollmentId, enrollmentId).delete();
  },

  getEnrollmentsByCourse: async (courseId) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.courseId = @courseId AND c.status = 'Active'",
      parameters: [{ name: "@courseId", value: courseId }],
    };
    const { resources } = await enrollmentsContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  },

  getStudentEnrollments: async (studentId) => {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.studentId = @studentId AND c.status = 'Active'",
      parameters: [{ name: "@studentId", value: studentId }],
    };
    const { resources } = await enrollmentsContainer.items
      .query(querySpec)
      .fetchAll();
    return resources;
  },

  getGradebook: async (courseId) => {
    try {
      const { resource } = await gradebookContainer.item(courseId, courseId).read();
      return resource;
    } catch (e) {
      if (e.code === 404) return null;
      throw e;
    }
  },

  // =========================================================================
  // AUDIT LOGGING (HIPAA)
  // =========================================================================

  logAudit: async (user, action, details) => {
    if (!user) return;
    try {
      await auditContainer.items.create({
        userEmail: user.email,
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Audit Logging Failed", e);
    }
  },
};
