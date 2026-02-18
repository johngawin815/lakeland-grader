import { CosmosClient } from "@azure/cosmos";

// ⚠️ PRODUCTION NOTE: Move keys to Environment Variables
const ENDPOINT = "INSERT_ENDPOINT_HERE";
const KEY = "INSERT_AZURE_KEY_HERE"; 
const DATABASE_ID = "INSERT_DB_ID_HERE";
const CONTAINER_ID = "INSERT_CONTAINER_ID_HERE"; 

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