import { CosmosClient } from "@azure/cosmos";
import { mockDatabaseService } from "./mockDatabaseService";

const ENDPOINT = process.env.REACT_APP_COSMOS_ENDPOINT;
const KEY = process.env.REACT_APP_COSMOS_KEY;
const USE_MOCK = !ENDPOINT || !KEY;

if (USE_MOCK) {
  console.warn(
    "[databaseService] No Cosmos DB credentials found. Running with in-memory mock data."
  );
}

// ─── BUILD REAL SERVICE (only when credentials exist) ──────────────────────────

function buildRealService() {
  const client = new CosmosClient({ endpoint: ENDPOINT, key: KEY });
  const database = client.database("LakelandHubDB");

  const studentsContainer = database.container("Students");
  const kteaContainer = database.container("KTEA_Reports");
  const auditContainer = database.container("Audit_Logs");
  const gradebookContainer = database.container("Gradebooks");
  const coursesContainer = database.container("Courses");
  const enrollmentsContainer = database.container("Enrollments");

  return {
    getAllStudents: async () => {
      const { resources } = await studentsContainer.items.query("SELECT * FROM c").fetchAll();
      return resources;
    },
    findStudentByName: async (name) => {
      const { resources } = await studentsContainer.items
        .query({ query: "SELECT * FROM c WHERE CONTAINS(LOWER(c.studentName), @name)", parameters: [{ name: "@name", value: name.toLowerCase() }] })
        .fetchAll();
      return resources;
    },
    upsertStudent: async (studentData) => {
      const { resource } = await studentsContainer.items.upsert(studentData);
      return resource;
    },
    deleteStudent: async (id) => { await studentsContainer.item(id, id).delete(); },
    getStudentsByUnit: async (unitName) => {
      const { resources } = await studentsContainer.items
        .query({ query: "SELECT * FROM c WHERE c.unitName = @unitName", parameters: [{ name: "@unitName", value: unitName }] })
        .fetchAll();
      return resources;
    },
    addKteaReport: async (item) => {
      const { resource } = await kteaContainer.items.create({ ...item, id: undefined, timestamp: new Date().toISOString() });
      return resource;
    },
    searchKteaReports: async (searchTerm) => {
      const { resources } = await kteaContainer.items
        .query({ query: "SELECT * FROM c WHERE CONTAINS(LOWER(c.studentName), @name)", parameters: [{ name: "@name", value: searchTerm.toLowerCase() }] })
        .fetchAll();
      return resources;
    },
    getAllKteaReports: async () => {
      const { resources } = await kteaContainer.items.query("SELECT * FROM c").fetchAll();
      return resources;
    },
    updateKteaReport: async (id, data) => {
      const { resource } = await kteaContainer.items.upsert({ ...data, id });
      return resource;
    },
    deleteKteaReport: async (id) => { await kteaContainer.item(id, id).delete(); },
    getCoursesByTeacher: async (teacherName) => {
      const { resources } = await coursesContainer.items
        .query({ query: "SELECT * FROM c WHERE c.teacherName = @teacherName", parameters: [{ name: "@teacherName", value: teacherName }] })
        .fetchAll();
      return resources;
    },
    saveCourseGrade: async (enrollmentData) => {
      const { resource } = await enrollmentsContainer.items.upsert(enrollmentData);
      return resource;
    },
    getStudentMasterGrades: async (studentId) => {
      const { resources } = await enrollmentsContainer.items
        .query({ query: "SELECT * FROM c WHERE c.studentId = @studentId", parameters: [{ name: "@studentId", value: studentId }] })
        .fetchAll();
      return resources;
    },
    saveGradebook: async (data) => {
      const { resource } = await gradebookContainer.items.upsert(data);
      return resource;
    },
    getAllCourses: async () => {
      const { resources } = await coursesContainer.items.query("SELECT * FROM c").fetchAll();
      return resources;
    },
    addCourse: async (courseData) => {
      const { resource } = await coursesContainer.items.create({ ...courseData, id: courseData.id || `course-${Date.now()}` });
      return resource;
    },
    updateCourse: async (id, courseData) => {
      const { resource } = await coursesContainer.items.upsert({ ...courseData, id });
      return resource;
    },
    deleteCourse: async (id) => { await coursesContainer.item(id, id).delete(); },
    enrollStudent: async (enrollmentData) => {
      const { resource } = await enrollmentsContainer.items.upsert(enrollmentData);
      return resource;
    },
    unenrollStudent: async (enrollmentId) => { await enrollmentsContainer.item(enrollmentId, enrollmentId).delete(); },
    getEnrollmentsByCourse: async (courseId) => {
      const { resources } = await enrollmentsContainer.items
        .query({ query: "SELECT * FROM c WHERE c.courseId = @courseId AND c.status = 'Active'", parameters: [{ name: "@courseId", value: courseId }] })
        .fetchAll();
      return resources;
    },
    getStudentEnrollments: async (studentId) => {
      const { resources } = await enrollmentsContainer.items
        .query({ query: "SELECT * FROM c WHERE c.studentId = @studentId AND c.status = 'Active'", parameters: [{ name: "@studentId", value: studentId }] })
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
    logAudit: async (user, action, details) => {
      if (!user) return;
      try {
        await auditContainer.items.create({ userEmail: user.email, action, details, timestamp: new Date().toISOString() });
      } catch (e) {
        console.error("Audit Logging Failed", e);
      }
    },
  };
}

// ─── RESILIENT WRAPPER ─────────────────────────────────────────────────────────
// When credentials exist but DB is unreachable (wrong endpoint, firewall, etc.),
// auto-fallback to mock after the first failed call with a 3-second timeout.

function createResilientService() {
  const real = buildRealService();
  let fallen = false;

  return new Proxy(real, {
    get(target, prop) {
      if (fallen) return mockDatabaseService[prop];

      const original = target[prop];
      if (typeof original !== 'function') return original;

      return async (...args) => {
        try {
          return await Promise.race([
            original(...args),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Cosmos DB timeout (3s)')), 3000)
            ),
          ]);
        } catch (e) {
          console.warn(
            `[databaseService] Cosmos DB unreachable, switching to in-memory mock data.`,
            e.message
          );
          fallen = true;
          return mockDatabaseService[prop](...args);
        }
      };
    },
  });
}

// ─── EXPORT ────────────────────────────────────────────────────────────────────

export const databaseService = USE_MOCK ? mockDatabaseService : createResilientService();
