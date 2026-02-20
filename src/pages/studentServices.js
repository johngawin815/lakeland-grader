import { CosmosClient } from "@azure/cosmos";

const ENDPOINT = process.env.REACT_APP_COSMOS_ENDPOINT;
const KEY = process.env.REACT_APP_COSMOS_KEY;
const DATABASE_ID = process.env.REACT_APP_COSMOS_DATABASE_ID || "StudentServicesDB";
const CONTAINER_ID = process.env.REACT_APP_COSMOS_CONTAINER_ID || "audit_logs";
const client = new CosmosClient({ endpoint: ENDPOINT, key: KEY });

async function getContainer() {
  const { database } = await client.databases.createIfNotExists({ id: DATABASE_ID });
  const { container } = await database.containers.createIfNotExists({ 
    id: CONTAINER_ID, 
    partitionKey: "/partitionKey" 
  });
  return container;
}

/**
 * FIND STUDENT (Search Bar)
 */
export const findStudentByName = async (name) => {
  const container = await getContainer();
  const querySpec = {
    query: "SELECT * FROM c WHERE CONTAINS(LOWER(c.studentName), @name)",
    parameters: [{ name: "@name", value: name.toLowerCase() }]
  };
  try {
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources; 
  } catch (err) {
    console.error("Read Error:", err);
    return [];
  }
};

/**
 * SAVE STUDENT
 */
export const saveStudentData = async (partialData) => {
  const container = await getContainer();
  const safeId = partialData.studentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  try {
    let finalDoc;
    try {
        const { resource } = await container.item(safeId, safeId).read();
        if (resource) {
            finalDoc = { ...resource, ...partialData, lastUpdated: new Date().toISOString() };
             if(partialData.kteaData) {
                finalDoc.kteaData = { ...resource.kteaData, ...partialData.kteaData };
            }
        }
    } catch (e) { }

    if (!finalDoc) {
        finalDoc = {
            id: safeId,
            partitionKey: safeId, 
            ...partialData,
            createdAt: new Date().toISOString()
        };
    }

    await container.items.upsert(finalDoc);
    return finalDoc;
  } catch (err) {
    console.error("Save Error:", err);
    throw err;
  }
};

/**
 * 🆕 FETCH ALL STUDENTS (For Dashboard Roster)
 */
export const fetchAllStudents = async () => {
  const container = await getContainer();
  const querySpec = { query: "SELECT * FROM c" };
  try {
    const { resources } = await container.items.query(querySpec).fetchAll();
    return resources;
  } catch (err) {
    console.error("Fetch All Error:", err);
    return [];
  }
};