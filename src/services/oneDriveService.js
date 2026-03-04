import { msalInstance, ensureMsalInitialized, isMsalConfigured } from "../config/msalInstance";
import { graphFilesRequest } from "../config/authConfig";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

/**
 * Acquires a Microsoft Graph access token, signing the user in if needed.
 * Uses silent acquisition first, falling back to a popup.
 *
 * @returns {Promise<string>} Access token
 */
async function acquireGraphToken() {
  await ensureMsalInitialized();

  let account = msalInstance.getAllAccounts()[0];

  if (!account) {
    const response = await msalInstance.loginPopup({
      scopes: ["User.Read", ...graphFilesRequest.scopes],
    });
    account = response.account;
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes: graphFilesRequest.scopes,
      account,
    });
    return response.accessToken;
  } catch {
    const response = await msalInstance.acquireTokenPopup({
      scopes: graphFilesRequest.scopes,
    });
    return response.accessToken;
  }
}

/**
 * Uploads a PDF to the user's OneDrive under /Lakeland Workbooks/.
 * Uses the Microsoft Graph simple upload endpoint (files up to 4 MB).
 * The folder is auto-created if it doesn't exist.
 *
 * @param {string} fileName - File name including .pdf extension
 * @param {Blob} pdfBlob - The PDF file content
 * @returns {Promise<{webUrl: string}>} Upload response with link to file
 */
export async function uploadToOneDrive(fileName, pdfBlob) {
  if (!isMsalConfigured()) {
    throw new Error(
      "OneDrive requires Microsoft account setup. Contact IT to configure Entra ID."
    );
  }

  const accessToken = await acquireGraphToken();

  const safeName = fileName.replace(/[/\\:*?"<>|]/g, "_");
  const url = `${GRAPH_BASE}/me/drive/root:/Lakeland Workbooks/${safeName}:/content`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/pdf",
    },
    body: pdfBlob,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OneDrive upload failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}
