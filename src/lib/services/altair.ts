/**
 * Altair InstaPrescreen API Service
 *
 * Handles authentication, program management, and record submission
 * against the Altair DataBridge API for soft-pull credit prescreening.
 */

// Configuration
const ALTAIR_BASE_URL = process.env.ALTAIR_BASE_URL || '';
const ALTAIR_USERNAME = process.env.ALTAIR_USERNAME || '';
const ALTAIR_PASSWORD = process.env.ALTAIR_PASSWORD || '';
const ALTAIR_COMPANY_ID = process.env.ALTAIR_COMPANY_ID || '232';

// Token cache (in-memory, per-process)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

// Token validity: 30 min, refresh 5 min early
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// ============================================================
// Types
// ============================================================

export interface AltairConfig {
  isConfigured: boolean;
  baseUrl: string;
  companyId: string;
}

interface TokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

interface AltairRecord {
  input_id: number;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  ssn?: string;
  date_of_birth?: string;
}

interface BureauOutput {
  credit_score?: number;
  [key: string]: unknown;
}

interface AltairQualifiedRecord {
  input_id: number;
  segment_name?: string;
  outputs?: {
    eq?: BureauOutput;
    tu?: BureauOutput;
    ex?: BureauOutput;
  };
  [key: string]: unknown;
}

interface AltairFailedRecord {
  input_id: number;
  error?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface AltairSubmitResult {
  success: boolean;
  qualified: AltairQualifiedRecord[];
  failed: AltairFailedRecord[];
  error?: string;
}

export interface AltairProgramConfig {
  name: string;
  description?: string;
  min_score?: number;
  max_score?: number;
  eq_enabled?: boolean;
  ex_enabled?: boolean;
  tu_enabled?: boolean;
  eq_score_version?: string;
  tu_score_version?: string;
  ex_score_version?: string;
  [key: string]: unknown;
}

interface AltairProgramResponse {
  id: number;
  name: string;
  [key: string]: unknown;
}

// ============================================================
// Configuration Check
// ============================================================

export function getAltairConfig(): AltairConfig {
  return {
    isConfigured: !!(ALTAIR_BASE_URL && ALTAIR_USERNAME && ALTAIR_PASSWORD),
    baseUrl: ALTAIR_BASE_URL,
    companyId: ALTAIR_COMPANY_ID,
  };
}

// ============================================================
// Token Management
// ============================================================

function clearTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

async function getToken(): Promise<TokenResult> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return { success: true, token: cachedToken };
  }

  const config = getAltairConfig();
  if (!config.isConfigured) {
    return { success: false, error: 'Altair API not configured. Set ALTAIR_BASE_URL, ALTAIR_USERNAME, and ALTAIR_PASSWORD.' };
  }

  try {
    console.log(`[ALTAIR] Authenticating as ${ALTAIR_USERNAME}...`);
    const authAbort = AbortController ? new AbortController() : null;
    const authTimer = authAbort ? setTimeout(() => authAbort.abort(), 5000) : null;
    const response = await fetch(`${ALTAIR_BASE_URL}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        username: ALTAIR_USERNAME,
        password: ALTAIR_PASSWORD,
      }),
      ...(authAbort ? { signal: authAbort.signal } : {}),
    });
    if (authTimer) clearTimeout(authTimer);

    const contentType = response.headers.get('content-type') || '';
    console.log(`[ALTAIR] Auth response: ${response.status} (${contentType})`);

    if (!response.ok) {
      const text = await response.text();
      const isBlocked = text.includes('Permission Required') || contentType.includes('text/html');
      console.error('[ALTAIR] Auth failed:', response.status, isBlocked ? 'IP BLOCKED by firewall' : text.slice(0, 500));
      return { success: false, error: isBlocked ? 'IP blocked by Altair firewall. Contact dbsupport@altairdata.com.' : `Authentication failed: ${response.status}` };
    }

    const data = await response.json();
    const token = data.token || data.access_token;

    if (!token) {
      console.error('[ALTAIR] No token in response:', JSON.stringify(data).slice(0, 200));
      return { success: false, error: 'No token in auth response' };
    }

    cachedToken = token;
    tokenExpiresAt = Date.now() + 30 * 60 * 1000;
    console.log('[ALTAIR] Auth successful, token cached for 30 min');

    return { success: true, token };
  } catch (error: any) {
    console.error('[ALTAIR] Auth error:', error.message);
    return { success: false, error: `Auth error: ${error.message}` };
  }
}

// ============================================================
// Authenticated Fetch Wrapper
// ============================================================

async function altairFetch(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<Response> {
  const tokenResult = await getToken();
  if (!tokenResult.success || !tokenResult.token) {
    throw new Error(tokenResult.error || 'Failed to get auth token');
  }

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 10000);
  const response = await fetch(`${ALTAIR_BASE_URL}/instaprescreen${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenResult.token}`,
      ...(options.headers || {}),
    },
    signal: abort.signal,
  });
  clearTimeout(timer);

  // Auto-retry on 401 (token expired)
  if (response.status === 401 && !retried) {
    clearTokenCache();
    return altairFetch(path, options, true);
  }

  return response;
}

/**
 * Authenticated fetch for non-instaprescreen endpoints (e.g. /reports/).
 * Uses ALTAIR_BASE_URL + path directly (no /instaprescreen prefix).
 */
async function altairBaseFetch(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<Response> {
  const tokenResult = await getToken();
  if (!tokenResult.success || !tokenResult.token) {
    throw new Error(tokenResult.error || 'Failed to get auth token');
  }

  const abort2 = new AbortController();
  const timer2 = setTimeout(() => abort2.abort(), 10000);
  const response = await fetch(`${ALTAIR_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenResult.token}`,
      ...(options.headers || {}),
    },
    signal: abort2.signal,
  });
  clearTimeout(timer2);

  if (response.status === 401 && !retried) {
    clearTokenCache();
    return altairBaseFetch(path, options, true);
  }

  return response;
}

// ============================================================
// Program Management
// ============================================================

export async function listPrograms(): Promise<{ success: boolean; programs?: AltairProgramResponse[]; error?: string }> {
  try {
    const response = await altairFetch(`/companies/${ALTAIR_COMPANY_ID}/programs`);
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Failed to list programs: ${response.status} ${text}` };
    }
    const data = await response.json();
    return { success: true, programs: Array.isArray(data) ? data : data.programs || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProgram(config: AltairProgramConfig): Promise<{ success: boolean; program?: AltairProgramResponse; error?: string }> {
  try {
    const response = await altairFetch(`/companies/${ALTAIR_COMPANY_ID}/programs`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Failed to create program: ${response.status} ${text}` };
    }
    const program = await response.json();
    return { success: true, program };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProgram(programId: number): Promise<{ success: boolean; program?: AltairProgramResponse; error?: string }> {
  try {
    const response = await altairFetch(`/companies/${ALTAIR_COMPANY_ID}/programs/${programId}`);
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Failed to get program: ${response.status} ${text}` };
    }
    const program = await response.json();
    return { success: true, program };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProgram(programId: number, config: Partial<AltairProgramConfig>): Promise<{ success: boolean; program?: AltairProgramResponse; error?: string }> {
  try {
    const response = await altairFetch(`/companies/${ALTAIR_COMPANY_ID}/programs/${programId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `Failed to update program: ${response.status} ${text}` };
    }
    const program = await response.json();
    return { success: true, program };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// Record Submission
// ============================================================

export async function submitRecords(
  altairProgramId: number,
  records: AltairRecord[],
): Promise<AltairSubmitResult> {
  const endpoint = `/companies/${ALTAIR_COMPANY_ID}/programs/${altairProgramId}/records`;
  const payload = { records };

  console.log(`[ALTAIR] Submitting ${records.length} records to ${endpoint}`);
  console.log('[ALTAIR] Request payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await altairFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log(`[ALTAIR] Response status: ${response.status}`);
    console.log(`[ALTAIR] Response body: ${text.slice(0, 2000)}`);

    // Altair returns 404 when 0 records qualify but still includes data
    // Parse any JSON response that has qualified/failed arrays
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        qualified: [],
        failed: [],
        error: `Submit failed: ${response.status} ${text}`,
      };
    }

    if (!response.ok && !data.qualified && !data.failed) {
      return {
        success: false,
        qualified: [],
        failed: [],
        error: `Submit failed: ${response.status} ${text}`,
      };
    }

    console.log(`[ALTAIR] Qualified: ${(data.qualified || []).length}, Failed: ${(data.failed || []).length}`);
    return {
      success: true,
      qualified: data.qualified || [],
      failed: data.failed || [],
    };
  } catch (error: any) {
    console.error('[ALTAIR] Submit error:', error.message);
    return {
      success: false,
      qualified: [],
      failed: [],
      error: error.message,
    };
  }
}

// ============================================================
// Score & Tier Logic
// ============================================================

/**
 * Compute the "middle score" from available bureau scores.
 * Requires all 3 bureau scores. Returns the true middle (median).
 * Returns null if any bureau score is missing.
 */
export function computeMiddleScore(scores: (number | null | undefined)[]): number | null {
  const valid = scores.filter((s): s is number => s != null && !isNaN(s));
  if (valid.length < 3) return null;
  valid.sort((a, b) => a - b);
  return valid[1]; // middle of 3
}

/**
 * Assign a tier based on the middle score.
 * - 620+    tier_1
 * - 580-619 tier_2
 * - 500-579 tier_3
 * - <500    below
 * - null    pending
 */
export function computeTier(score: number | null): 'tier_1' | 'tier_2' | 'tier_3' | 'below' | 'pending' {
  if (score == null) return 'pending';
  if (score >= 620) return 'tier_1';
  if (score >= 580) return 'tier_2';
  if (score >= 500) return 'tier_3';
  return 'below';
}

/**
 * Format a record for submission to Altair API.
 * Uppercases names, strips SSN dashes, formats DOB.
 */
export function formatRecordForAltair(
  record: {
    firstName: string;
    lastName: string;
    middleInitial?: string;
    address?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    ssn?: string;
    dob?: string;
  },
  inputId: number,
): AltairRecord {
  const formatted: AltairRecord = {
    input_id: inputId,
    first_name: record.firstName.toUpperCase().trim(),
    last_name: record.lastName.toUpperCase().trim(),
  };

  if (record.middleInitial) formatted.middle_initial = record.middleInitial.toUpperCase().trim();
  if (record.address) formatted.address = record.address.toUpperCase().trim();
  if (record.address2) formatted.address_2 = record.address2.toUpperCase().trim();
  if (record.city) formatted.city = record.city.toUpperCase().trim();
  if (record.state) formatted.state = record.state.toUpperCase().trim();
  if (record.zip) formatted.zip = record.zip.replace(/\D/g, '').slice(0, 5);
  if (record.ssn) formatted.ssn = record.ssn.replace(/\D/g, '');
  if (record.dob) formatted.date_of_birth = record.dob; // Expected: YYYY-MM-DD

  return formatted;
}

// ============================================================
// Billing / Reporting
// ============================================================

export interface BillingRecord {
  date: string;
  bureau: string;
  matches: number;
  base_cost: number;
  income_est: number;
  cltv: number;
  est_value: number;
  owner_status: number;
  total: number;
}

export interface BillingReportResult {
  success: boolean;
  records?: BillingRecord[];
  error?: string;
}

/**
 * Fetch billing report from Altair Reporting API.
 * GET /reports/instaprescreen/basic/company/{companyId}?startDate=...&endDate=...
 */
export async function getBillingReport(
  startDate: string,
  endDate: string,
): Promise<BillingReportResult> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await altairBaseFetch(
      `/reports/instaprescreen/basic/company/${ALTAIR_COMPANY_ID}?${params}`,
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('[ALTAIR] Billing report error:', response.status, text.slice(0, 500));
      return { success: false, error: `Report API returned ${response.status}` };
    }

    const data = await response.json();
    const records: BillingRecord[] = Array.isArray(data) ? data : data.records || data.data || [];

    return { success: true, records };
  } catch (error: any) {
    console.error('[ALTAIR] Billing report error:', error.message);
    return { success: false, error: error.message };
  }
}
