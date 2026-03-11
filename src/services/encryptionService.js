/**
 * encryptionService.js - AES-256-GCM Client-Side Encryption with Azure Key Vault
 *
 * Architecture:
 *   1. On first encrypt/decrypt call, acquires the encryption key from Azure Key Vault
 *      using the active MSAL session (token-based, no client secrets).
 *   2. Caches the derived CryptoKey in memory only (never localStorage/sessionStorage).
 *   3. Falls back to DEV_SECRET ONLY on localhost AND when Key Vault is unreachable.
 *   4. Uses the browser-native Web Crypto API (FIPS 140-2 compliant AES-GCM).
 *
 * HIPAA/FERPA Compliance:
 *   - Encryption key never touches disk or browser storage.
 *   - Key is purged on logout via clearCachedKey().
 *   - 96-bit random IV per encryption operation prevents ciphertext analysis.
 *   - Production environments will hard-fail if Key Vault is unreachable.
 *
 * Azure Prerequisites:
 *   - Key Vault secret named "LRS-Client-Encryption-Key" containing a 32-char key.
 *   - Entra ID App Registration with "Key Vault Secrets User" RBAC role on the vault.
 *   - Key Vault CORS configured to allow your SPA origin.
 */

import { SecretClient } from "@azure/keyvault-secrets";
import { keyVaultConfig } from "../config/authConfig";

// ---------------------------------------------------------------------------
// DEV-ONLY fallback key. Used ONLY when: (a) running on localhost AND
// (b) Key Vault connection fails. This is NOT used in production.
// Replace this with your own 32-character development key.
// ---------------------------------------------------------------------------
const DEV_SECRET = "DEV-ONLY-lakeland-aes256-key-00";

// In-memory cache — survives only for the lifetime of the browser tab.
let cachedCryptoKey = null;

// ---------------------------------------------------------------------------
// MSAL Token Credential Adapter
// ---------------------------------------------------------------------------

/**
 * Creates an Azure SDK-compatible TokenCredential from an existing MSAL
 * PublicClientApplication instance. This avoids importing @azure/identity
 * and reuses the user's active session — no extra login prompts.
 *
 * @param {import("@azure/msal-browser").PublicClientApplication} msalInstance
 * @param {import("@azure/msal-browser").AccountInfo} account
 * @returns {{ getToken: (scopes: string | string[]) => Promise<{token: string, expiresOnTimestamp: number}> }}
 */
function createMsalTokenCredential(msalInstance, account) {
  return {
    async getToken(scopes) {
      const scopeArray = Array.isArray(scopes) ? scopes : [scopes];

      try {
        // Attempt silent token acquisition first (uses cached/refresh tokens)
        const response = await msalInstance.acquireTokenSilent({
          scopes: scopeArray,
          account,
        });
        return {
          token: response.accessToken,
          expiresOnTimestamp: response.expiresOn.getTime(),
        };
      } catch {
        // Silent failed (e.g., token expired, consent required) — try interactive
        const response = await msalInstance.acquireTokenPopup({
          scopes: scopeArray,
        });
        return {
          token: response.accessToken,
          expiresOnTimestamp: response.expiresOn.getTime(),
        };
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Key Vault Integration
// ---------------------------------------------------------------------------

/**
 * Determines whether the app is running on a local development server.
 * @returns {boolean}
 */
function isLocalhost() {
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

/**
 * Fetches the encryption secret from Azure Key Vault using the active MSAL
 * session. No client secrets are sent — authentication is purely token-based.
 *
 * @param {import("@azure/msal-browser").PublicClientApplication} msalInstance
 * @param {import("@azure/msal-browser").AccountInfo} account
 * @returns {Promise<string>} The raw secret value from Key Vault.
 * @throws {Error} If Key Vault URL is not configured or the secret is empty.
 */
export async function fetchKeyFromVault(msalInstance, account) {
  if (!keyVaultConfig.url) {
    throw new Error(
      "REACT_APP_KEYVAULT_URL is not set. Cannot connect to Key Vault."
    );
  }

  const credential = createMsalTokenCredential(msalInstance, account);
  const client = new SecretClient(keyVaultConfig.url, credential);
  const secret = await client.getSecret(keyVaultConfig.secretName);

  if (!secret.value) {
    throw new Error(
      `Key Vault secret "${keyVaultConfig.secretName}" exists but has an empty value.`
    );
  }

  return secret.value;
}

// ---------------------------------------------------------------------------
// Key Resolution (Vault → localhost fallback)
// ---------------------------------------------------------------------------

/**
 * Converts a raw string key into a CryptoKey usable by Web Crypto AES-GCM.
 * Truncates or pads to exactly 32 bytes (256 bits).
 *
 * @param {string} rawKey - The raw key string.
 * @returns {Promise<CryptoKey>}
 */
async function importKey(rawKey) {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(rawKey);

  // Ensure exactly 32 bytes for AES-256
  const normalized = new Uint8Array(32);
  normalized.set(keyBytes.slice(0, 32));

  return crypto.subtle.importKey(
    "raw",
    normalized,
    { name: "AES-GCM" },
    false, // non-extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Resolves the encryption CryptoKey. Attempts Key Vault first; on localhost,
 * gracefully falls back to DEV_SECRET if the vault call fails.
 *
 * In production (non-localhost), a Key Vault failure is a hard error —
 * the app must not encrypt/decrypt with a dev key.
 *
 * @param {import("@azure/msal-browser").PublicClientApplication} msalInstance
 * @param {import("@azure/msal-browser").AccountInfo} account
 * @returns {Promise<CryptoKey>}
 */
export async function getEncryptionKey(msalInstance, account) {
  if (cachedCryptoKey) {
    return cachedCryptoKey;
  }

  try {
    const keyString = await fetchKeyFromVault(msalInstance, account);
    cachedCryptoKey = await importKey(keyString);
    console.info("[EncryptionService] Encryption key loaded from Azure Key Vault.");
    return cachedCryptoKey;
  } catch (vaultError) {
    if (isLocalhost()) {
      console.warn(
        "[EncryptionService] Key Vault unreachable on localhost — using DEV_SECRET fallback.",
        vaultError.message
      );
      cachedCryptoKey = await importKey(DEV_SECRET);
      return cachedCryptoKey;
    }

    // Production: hard fail — never fall back to dev key
    throw new Error(
      `[EncryptionService] PRODUCTION FAILURE — could not retrieve encryption key from Key Vault. ` +
        `Ensure REACT_APP_KEYVAULT_URL is set, CORS is configured, and the app registration ` +
        `has "Key Vault Secrets User" role. Original error: ${vaultError.message}`
    );
  }
}

// ---------------------------------------------------------------------------
// AES-256-GCM Encrypt / Decrypt
// ---------------------------------------------------------------------------

/**
 * Encrypts plaintext using AES-256-GCM.
 *
 * Output format: Base64( 12-byte IV || ciphertext || 16-byte auth tag )
 * The IV is generated randomly per call — never reused.
 *
 * @param {string} plaintext - The string to encrypt.
 * @param {import("@azure/msal-browser").PublicClientApplication} msalInstance
 * @param {import("@azure/msal-browser").AccountInfo} account
 * @returns {Promise<string>} Base64-encoded ciphertext bundle.
 */
export async function encrypt(plaintext, msalInstance, account) {
  const key = await getEncryptionKey(msalInstance, account);
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV per NIST SP 800-38D

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );

  // Combine: IV (12 bytes) + ciphertext+tag
  const cipherArray = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(iv.length + cipherArray.length);
  combined.set(iv);
  combined.set(cipherArray, iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 *
 * @param {string} encryptedBase64 - Base64-encoded IV + ciphertext bundle.
 * @param {import("@azure/msal-browser").PublicClientApplication} msalInstance
 * @param {import("@azure/msal-browser").AccountInfo} account
 * @returns {Promise<string>} The decrypted plaintext.
 */
export async function decrypt(encryptedBase64, msalInstance, account) {
  const key = await getEncryptionKey(msalInstance, account);
  const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
    c.charCodeAt(0)
  );

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}

// ---------------------------------------------------------------------------
// Session Cleanup
// ---------------------------------------------------------------------------

/**
 * Clears the in-memory cached CryptoKey. Call this on user logout to ensure
 * the key does not persist across sessions.
 */
export function clearCachedKey() {
  cachedCryptoKey = null;
}
