/**
 * googleDriveService.js - Upload PDFs to Google Drive via Google Identity Services
 *
 * Requires REACT_APP_GOOGLE_CLIENT_ID in .env.local (OAuth 2.0 Client ID
 * from Google Cloud Console). Uses minimal scope (drive.file) so the app
 * can only access files it creates — not the user's entire Drive.
 */

let gisLoaded = false;

function loadGIS() {
  return new Promise((resolve, reject) => {
    if (gisLoaded || window.google?.accounts?.oauth2) {
      gisLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

function requestAccessToken(clientId) {
  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (response) => {
        if (response.error) {
          reject(
            new Error(response.error_description || response.error)
          );
        } else {
          resolve(response.access_token);
        }
      },
    });
    tokenClient.requestAccessToken();
  });
}

export function isGoogleDriveConfigured() {
  return Boolean(process.env.REACT_APP_GOOGLE_CLIENT_ID);
}

/**
 * Uploads a PDF to the user's Google Drive root.
 *
 * @param {string} fileName - File name including .pdf extension
 * @param {Blob} pdfBlob - The PDF file content
 * @returns {Promise<{id: string, name: string}>} Created file metadata
 */
export async function uploadToGoogleDrive(fileName, pdfBlob) {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Google Drive requires setup. Add REACT_APP_GOOGLE_CLIENT_ID to .env.local."
    );
  }

  await loadGIS();
  const accessToken = await requestAccessToken(clientId);

  const safeName = fileName.replace(/[/\\:*?"<>|]/g, "_");
  const metadata = { name: safeName, mimeType: "application/pdf" };

  // Build multipart/related body (required by Drive API v3)
  const boundary = "lakeland_" + Date.now();
  const fileBuffer = await pdfBlob.arrayBuffer();

  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
    fileBuffer,
    `\r\n--${boundary}--`,
  ]);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive upload failed (${response.status}): ${errText}`);
  }

  return response.json();
}
