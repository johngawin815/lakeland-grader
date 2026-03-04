/**
 * authConfig.js - Microsoft Entra ID (MSAL) Configuration
 *
 * HIPAA/FERPA Compliance Notes:
 * - Uses PKCE flow (SPA) — no client secret stored in frontend code.
 * - Session storage scoped to browser tab; cleared on tab close.
 * - Key Vault scope enables token-based secret retrieval without exposing secrets.
 *
 * Required Environment Variables (set in .env.local):
 *   REACT_APP_AZURE_CLIENT_ID   - Entra ID App Registration client ID
 *   REACT_APP_AZURE_TENANT_ID   - Azure AD tenant ID
 *   REACT_APP_KEYVAULT_URL      - Full Key Vault URL (e.g., https://my-vault.vault.azure.net)
 */

export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || "",
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || "common"}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};

export const keyVaultConfig = {
  url: process.env.REACT_APP_KEYVAULT_URL || "",
  secretName: "LRS-Client-Encryption-Key",
};

// Scope required to read secrets from Azure Key Vault
export const keyVaultTokenRequest = {
  scopes: ["https://vault.azure.net/.default"],
};

// Scope required to upload files to OneDrive via Microsoft Graph
// Requested on-demand (incremental consent) when user clicks "Save to OneDrive"
export const graphFilesRequest = {
  scopes: ["Files.ReadWrite"],
};
