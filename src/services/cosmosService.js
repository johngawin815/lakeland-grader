import { CosmosClient } from "@azure/cosmos";

// ⚠️ SECURITY WARNING: In production, these keys belong in Azure Key Vault / Environment Variables.
// For Local Dev/Prototyping, paste them here but DO NOT commit this file to public GitHub.
const ENDPOINT = "https://YOUR-COSMOS-DB-NAME.documents.azure.com:443/";
const KEY = "YOUR_PRIMARY_KEY_HERE";

const client = new CosmosClient({ endpoint: ENDPOINT, key: KEY });
const database = client.database("LakelandHubDB");
const container = database.container("KTEA_Reports");
const auditContainer = database.container("Audit_Logs");

export const cosmosService = {
  // 1. CREATE (Add to Queue/Submit)
  addItem: async (item) => {
    const { resource } = await container.items.create({
      ...item,
      id: undefined, // Let Cosmos generate the ID, or generate one yourself
      timestamp: new Date().toISOString()
    });
    return resource;
  },

  // 2. READ (Search)
  searchStudents: async (searchTerm) => {
    // SQL Query for Cosmos DB
    const querySpec = {
      query: "SELECT * FROM c WHERE CONTAINS(LOWER(c.studentName), @name)",
      parameters: [{ name: "@name", value: searchTerm.toLowerCase() }]
    };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  },

  // 3. UPDATE
  updateItem: async (id, updatedData) => {
    // Cosmos requires the partition key for updates (usually /id or /gradeLevel)
    const { resource } = await container.item(id, undefined).replace(updatedData);
    return resource;
  },

  // 4. DELETE
  deleteItem: async (id) => {
    await container.item(id, undefined).delete();
  },

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

  // 6. GET ALL (For Master Export)
  getAllItems: async () => {
    // Selects EVERY document in the container
    const querySpec = { query: "SELECT * FROM c" };
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  }
};