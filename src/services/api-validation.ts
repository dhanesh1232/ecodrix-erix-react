/**
 * services/api-validation.ts
 *
 * SDK Validation Service — Handles API key validation against the Ecodrix
 * backend with caching, retry logic, and dev mode bypass.
 *
 * This is a client-side module. Uses `fetch` for HTTP calls.
 * No Node.js-specific APIs.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ValidationErrorCode =
  | "INVALID_CREDENTIALS"
  | "ORG_INACTIVE"
  | "FEATURE_NOT_AVAILABLE"
  | "KEY_EXPIRED"
  | "NETWORK_ERROR";

export interface ValidationResult {
  valid: boolean;
  orgId?: string;
  errorCode?: ValidationErrorCode;
  errorMessage?: string;
}

export interface ValidateOptions {
  apiKey: string;
  clientCode: string;
  apiUrl: string;
  signal?: AbortSignal;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

interface CacheEntry {
  result: ValidationResult;
  timestamp: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const cache = new Map<string, CacheEntry>();

function getCacheKey(apiKey: string, clientCode: string): string {
  return `${apiKey}:${clientCode}`;
}

function getCachedResult(
  apiKey: string,
  clientCode: string,
): ValidationResult | null {
  const key = getCacheKey(apiKey, clientCode);
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age >= CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.result;
}

function setCachedResult(
  apiKey: string,
  clientCode: string,
  result: ValidationResult,
): void {
  const key = getCacheKey(apiKey, clientCode);
  cache.set(key, { result, timestamp: Date.now() });
}

/**
 * Clears the entire validation cache. Useful for testing.
 */
export function clearValidationCache(): void {
  cache.clear();
}

// ─── Dev Bypass ──────────────────────────────────────────────────────────────

/**
 * Checks if the given apiKey/apiUrl combination qualifies for dev bypass.
 *
 * Returns true for:
 * - apiKey === "ERIX-DEV-KEY"
 * - apiUrl pointing to localhost or 127.0.0.1 (any port)
 */
export function isDevBypass(apiKey: string, apiUrl: string): boolean {
  if (apiKey === "ERIX-DEV-KEY") return true;

  try {
    const url = new URL(apiUrl);
    const hostname = url.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  } catch {
    // If URL parsing fails, check with regex fallback
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(apiUrl)) {
      return true;
    }
  }

  return false;
}

// ─── Retry Logic ─────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;
const BACKOFF_DELAYS = [0, 1000, 2000]; // ms delays before each attempt
const REQUEST_TIMEOUT_MS = 10_000; // 10 seconds

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main Validation Function ────────────────────────────────────────────────

/**
 * Validates an editor API key against the Ecodrix backend.
 *
 * **WORKING PROCESS:**
 * 1. Check dev bypass → return valid immediately.
 * 2. Check cache → return cached result if within TTL.
 * 3. Make POST to `${apiUrl}/api/saas/sdk/validate-editor`.
 * 4. Retry up to 2 additional times on network error with exponential backoff.
 * 5. 10-second timeout per attempt via AbortController.
 * 6. Cache successful results.
 * 7. Map HTTP responses to ValidationResult.
 */
export async function validateEditorApiKey(
  options: ValidateOptions,
): Promise<ValidationResult> {
  const { apiKey, clientCode, apiUrl, signal } = options;

  // 1. Dev bypass
  if (isDevBypass(apiKey, apiUrl)) {
    return { valid: true, orgId: "dev" };
  }

  // 2. Check cache
  const cached = getCachedResult(apiKey, clientCode);
  if (cached) return cached;

  // 3. Make request with retry logic
  const url = `${apiUrl}/api/saas/sdk/validate-editor`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Wait for backoff delay (0ms on first attempt)
    if (BACKOFF_DELAYS[attempt] > 0) {
      await delay(BACKOFF_DELAYS[attempt]);
    }

    // Check if externally aborted
    if (signal?.aborted) {
      return {
        valid: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: "Validation request was cancelled",
      };
    }

    try {
      const result = await makeValidationRequest(
        url,
        apiKey,
        clientCode,
        signal,
      );

      // Cache successful results
      if (result.valid) {
        setCachedResult(apiKey, clientCode, result);
      }

      return result;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // If externally aborted, don't retry
      if (signal?.aborted) {
        return {
          valid: false,
          errorCode: "NETWORK_ERROR",
          errorMessage: "Validation request was cancelled",
        };
      }

      // Only retry on network errors, not on HTTP error responses
      // (HTTP errors are handled inside makeValidationRequest and returned as results)
      // If we get here, it's a genuine network/timeout error — continue retrying
    }
  }

  // All attempts failed
  return {
    valid: false,
    errorCode: "NETWORK_ERROR",
    errorMessage:
      lastError?.message ?? "Unable to connect to the validation service",
  };
}

// ─── HTTP Request Helper ─────────────────────────────────────────────────────

async function makeValidationRequest(
  url: string,
  apiKey: string,
  clientCode: string,
  externalSignal?: AbortSignal,
): Promise<ValidationResult> {
  // Create a timeout abort controller
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    REQUEST_TIMEOUT_MS,
  );

  // Combine external signal with timeout signal
  const signal = externalSignal
    ? combineAbortSignals(externalSignal, timeoutController.signal)
    : timeoutController.signal;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-erix-api-key": apiKey,
        "x-erix-client-code": clientCode,
      },
      signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    let body: any;
    try {
      body = await response.json();
    } catch {
      // Non-JSON response — treat as network error
      throw new Error("Invalid response from validation service");
    }

    // Map HTTP responses to ValidationResult
    if (response.ok && body.valid) {
      return {
        valid: true,
        orgId: body.orgId,
      };
    }

    // Error responses
    if (body.error) {
      const errorCode = mapErrorCode(body.error.code);
      return {
        valid: false,
        errorCode,
        errorMessage: body.error.message,
      };
    }

    // Fallback for unexpected response shapes
    return {
      valid: false,
      errorCode: "NETWORK_ERROR",
      errorMessage: "Unexpected response from validation service",
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    // Re-throw network/timeout errors for retry logic
    throw err;
  }
}

function mapErrorCode(code: string | undefined): ValidationErrorCode {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "INVALID_CREDENTIALS";
    case "ORG_INACTIVE":
      return "ORG_INACTIVE";
    case "FEATURE_NOT_AVAILABLE":
      return "FEATURE_NOT_AVAILABLE";
    case "KEY_EXPIRED":
      return "KEY_EXPIRED";
    default:
      return "NETWORK_ERROR";
  }
}

/**
 * Combines multiple AbortSignals into one. Aborts when any input signal aborts.
 */
function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), {
      once: true,
    });
  }

  return controller.signal;
}
