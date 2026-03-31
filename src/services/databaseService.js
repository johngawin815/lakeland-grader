import { CosmosClient } from "@azure/cosmos";
import { mockDatabaseService } from "./mockDatabaseService";
import { generateStudentNumber } from "../utils/studentUtils";

const ENDPOINT = process.env.REACT_APP_COSMOS_ENDPOINT;
const KEY = process.env.REACT_APP_COSMOS_KEY;
const USE_MOCK =
  !ENDPOINT || !KEY ||
  process.env.REACT_APP_USE_MOCK === 'true' ||
  ENDPOINT.includes('your_actual');

if (USE_MOCK) {
  console.warn(
    "[databaseService] Running with in-memory mock data (fictional characters)."
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
  const iepContainer = database.container("IEP_Drafts");
  const transcriptPlanContainer = database.container("Transcript_Plans");
  const workbookContainer = database.container("Workbooks");
  const teachersContainer = database.container("Teachers");

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
    updateGlobalStudentName: async (studentId, oldName, newName) => {
      try {
        const querySpec = {
          query: "SELECT * FROM c WHERE c.studentName = @oldName OR c.studentId = @studentId",
          parameters: [
            { name: "@oldName", value: oldName },
            { name: "@studentId", value: studentId }
          ]
        };

        // KTEA Reports
        const { resources: kteaReq } = await kteaContainer.items.query(querySpec).fetchAll();
        for (const item of kteaReq) {
          if (item.studentName !== newName) {
            await kteaContainer.items.upsert({ ...item, studentName: newName });
          }
        }

        // IEP Drafts
        const { resources: iepReq } = await iepContainer.items.query(querySpec).fetchAll();
        for (const item of iepReq) {
          if (item.studentName !== newName) {
            await iepContainer.items.upsert({ ...item, studentName: newName });
          }
        }

        // Transcript Plans
        const { resources: transReq } = await transcriptPlanContainer.items.query(querySpec).fetchAll();
        for (const item of transReq) {
          if (item.studentName !== newName) {
            await transcriptPlanContainer.items.upsert({ ...item, studentName: newName });
          }
        }

        // Workbooks
        const { resources: wbReq } = await workbookContainer.items.query(querySpec).fetchAll();
        for (const item of wbReq) {
          if (item.studentName !== newName) {
            await workbookContainer.items.upsert({ ...item, studentName: newName });
          }
        }
      } catch (err) {
        console.error("Failed executing global name update cascades:", err);
      }
    },
    upsertStudent: async (studentData) => {
      // Auto-assign a 6-digit student number if missing
      if (!studentData.studentNumber) {
        const { resources: allStudents } = await studentsContainer.items.query("SELECT c.studentNumber FROM c WHERE IS_DEFINED(c.studentNumber)").fetchAll();
        const usedNumbers = new Set(allStudents.map(s => s.studentNumber).filter(Boolean));
        studentData.studentNumber = generateStudentNumber(usedNumbers);
      }
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
    getDischargedStudents: async () => {
      const { resources } = await studentsContainer.items
        .query("SELECT * FROM c WHERE c.active = false")
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
    getAllEnrollments: async () => {
      const { resources } = await enrollmentsContainer.items.query("SELECT * FROM c").fetchAll();
      return resources;
    },
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
    // === IEP DRAFTS ===
    saveIepDraft: async (data) => {
      const { resource } = await iepContainer.items.upsert({ ...data, id: data.id || `iep-${Date.now()}`, lastModified: new Date().toISOString() });
      return resource;
    },
    getIepByStudent: async (studentId) => {
      const { resources } = await iepContainer.items
        .query({ query: "SELECT * FROM c WHERE c.studentId = @studentId", parameters: [{ name: "@studentId", value: studentId }] })
        .fetchAll();
      return resources;
    },
    getAllIepDrafts: async () => {
      const { resources } = await iepContainer.items.query("SELECT * FROM c").fetchAll();
      return resources;
    },
    deleteIepDraft: async (id) => { await iepContainer.item(id, id).delete(); },

    // === TRANSCRIPT PLANS ===
    saveTranscriptPlan: async (plan) => {
      const doc = { ...plan, id: plan.id || `tplan-${Date.now()}`, updatedAt: new Date().toISOString() };
      if (!doc.createdAt) doc.createdAt = doc.updatedAt;
      const { resource } = await transcriptPlanContainer.items.upsert(doc);
      return resource;
    },
    getTranscriptPlanByStudent: async (studentId) => {
      const { resources } = await transcriptPlanContainer.items
        .query({ query: "SELECT * FROM c WHERE c.studentId = @sid ORDER BY c.updatedAt DESC", parameters: [{ name: "@sid", value: studentId }] })
        .fetchAll();
      return resources.length > 0 ? resources[0] : null;
    },
    getAllTranscriptPlans: async () => {
      const { resources } = await transcriptPlanContainer.items.query("SELECT * FROM c").fetchAll();
      return resources;
    },
    deleteTranscriptPlan: async (id) => { await transcriptPlanContainer.item(id, id).delete(); },

    // === WORKBOOKS ===
    saveWorkbook: async (wb) => {
      const doc = { ...wb, id: wb.id || `wb-${Date.now()}`, updatedAt: new Date().toISOString() };
      if (!doc.createdAt) doc.createdAt = doc.updatedAt;
      const { resource } = await workbookContainer.items.upsert(doc);
      return resource;
    },
    getWorkbook: async (id) => {
      try {
        const { resource } = await workbookContainer.item(id, id).read();
        return resource || null;
      } catch { return null; }
    },
    getWorkbooksByUnit: async (unitTopic) => {
      const { resources } = await workbookContainer.items
        .query({ query: "SELECT * FROM c WHERE c.unitTopic = @ut ORDER BY c.dayNumber", parameters: [{ name: "@ut", value: unitTopic }] })
        .fetchAll();
      return resources;
    },
    getAllWorkbooks: async () => {
      const { resources } = await workbookContainer.items.query("SELECT * FROM c").fetchAll();
      return resources;
    },
    deleteWorkbook: async (id) => { await workbookContainer.item(id, id).delete(); },

    // === TEACHERS ===
    upsertTeacher: async (teacher) => {
      const { resource } = await teachersContainer.items.upsert({ ...teacher, updatedAt: new Date().toISOString() });
      return resource;
    },
    getTeacher: async (id) => {
      try {
        const { resource } = await teachersContainer.item(id, id).read();
        return resource || null;
      } catch (e) {
        if (e.code === 404) return null;
        throw e;
      }
    },

    // === OCR / TRANSCRIPT EXTRACTION ===
    extractTranscriptCourses: async (file) => {
      const formData = new FormData();
      formData.append('transcript', file);

      const response = await fetch('/api/transcript/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract transcript securely.');
      }
      const data = await response.json();
      return data.courses; 
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
