import { CoachingFormData } from '../types';

export const DEFAULT_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '981778444567-kchln3rj4q2fje7f03im7dlj9biucul1.apps.googleusercontent.com';

export const SHEETS_SCOPES =
  'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

export const SHEET_HEADERS = [
  'S.No.',
  'Timestamp',
  'Full Name',
  'Phone Number',
  'Email',
  'Current Situation (Q1)',
  'Why Become a Coach (Q2)',
  'Belief in Becoming a Successful Coach (Q3)',
  'Biggest Obstacle (Q4)',
  'Current Monthly Income (Q5)',
  'Desired Monthly Income (Q6)',
  'Coaching Business Vision (Q7)',
  'Why Now (Q8)',
  'Interest Level 1-10 (Q9)',
  'Why Consider You (Q10)',
  'Ready to Start Career Path (Q11)',
  'Phone Call Promise (Q12)',
  'Willing to Invest Financially (Q13)',
  'Financial Resources Available (Q14)',
];

export interface ConnectedSheetInfo {
  id: string;
  name: string;
  url: string;
  lastSyncedAt?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              expires_in?: number;
            }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

/**
 * Extract a spreadsheet ID from a raw ID or full Google Sheet URL.
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Get stored token from local storage if still valid.
 */
export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem('monkhood_sheets_token');
    const expiry = localStorage.getItem('monkhood_sheets_token_expiry');
    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
      return token;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Store access token with expiration time (usually 3500 seconds).
 */
export function saveToken(token: string, expiresInSeconds: number = 3600): void {
  try {
    const expiry = Date.now() + (expiresInSeconds - 60) * 1000;
    localStorage.setItem('monkhood_sheets_token', token);
    localStorage.setItem('monkhood_sheets_token_expiry', expiry.toString());
  } catch {
    // ignore
  }
}

export const DEFAULT_SPREADSHEET_ID = '1vEilcKSMLKNJ45iH9TuHGhIAlbWhkyZPrgUarGuBtCI';
export const DEFAULT_SPREADSHEET_NAME = 'Master Coach Application';
export const DEFAULT_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1vEilcKSMLKNJ45iH9TuHGhIAlbWhkyZPrgUarGuBtCI/edit';

/**
 * Get stored connected sheet info, defaulting to Deepanshu's Master Coach Application sheet.
 */
export function getStoredSheetInfo(): ConnectedSheetInfo | null {
  try {
    const data = localStorage.getItem('monkhood_connected_sheet');
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  return {
    id: DEFAULT_SPREADSHEET_ID,
    name: DEFAULT_SPREADSHEET_NAME,
    url: DEFAULT_SPREADSHEET_URL,
  };
}

/**
 * Save connected sheet info.
 */
export function saveSheetInfo(info: ConnectedSheetInfo): void {
  try {
    localStorage.setItem('monkhood_connected_sheet', JSON.stringify(info));
  } catch {
    // ignore
  }
}

export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbwFR1ewl_Md90-bcHIZlKA6ZvQ7Nfe39mOmI8-jbHBe3rks581Zogq6aksfLugFLghA/exec';

/**
 * Get stored Google Apps Script Webhook URL.
 */
export function getStoredWebhookUrl(): string | null {
  try {
    const fromStorage = localStorage.getItem('monkhood_webhook_url');
    if (fromStorage && fromStorage.trim()) {
      return fromStorage.trim();
    }
    const fromEnv = (import.meta.env.VITE_SHEETS_WEBHOOK_URL as string) || '';
    if (fromEnv && fromEnv.trim()) {
      return fromEnv.trim();
    }
  } catch {
    // ignore
  }
  return DEFAULT_WEBHOOK_URL;
}

/**
 * Save Google Apps Script Webhook URL.
 */
export function saveWebhookUrl(url: string): void {
  try {
    localStorage.setItem('monkhood_webhook_url', url.trim());
  } catch {
    // ignore
  }
}

export const GOOGLE_APPS_SCRIPT_CODE = `// Run testAppend() once by clicking 'Run' (▶️) in Apps Script to authorize spreadsheet access
function testAppend() {
  var SPREADSHEET_ID = "1vEilcKSMLKNJ45iH9TuHGhIAlbWhkyZPrgUarGuBtCI";
  var ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch(err) {}
  if (!ss) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  var sheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("Applications") || ss.getSheets()[0];
  sheet.appendRow([
    0,
    new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    "Deepanshu Bagde (Setup Test)",
    "+91 99999 99999",
    "deepanshubagde@gmail.com",
    "Founder / Coach",
    "To train master coaches",
    "100% Commitment",
    "None",
    "₹2,50,000+",
    "₹10,00,000+",
    "Monkhood Master Coach Certification",
    "Immediate",
    10,
    "Dedicated",
    "Yes",
    "Yes",
    "Yes",
    "Ready"
  ]);
  Logger.log("Successfully added row to: " + ss.getName());
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    message: "Monkhood Master Coach Google Sheets Webhook is Live & Connected!",
    spreadsheetId: "1vEilcKSMLKNJ45iH9TuHGhIAlbWhkyZPrgUarGuBtCI"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var SPREADSHEET_ID = "1vEilcKSMLKNJ45iH9TuHGhIAlbWhkyZPrgUarGuBtCI";
    var ss;
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch(err) {}
    if (!ss) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    }

    // Support Sheet1, Applications, or the first sheet
    var sheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("Applications") || ss.getSheets()[0];

    // Create header row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "S.No.",
        "Timestamp",
        "Full Name",
        "Phone Number",
        "Email",
        "Current Situation (Q1)",
        "Why Become a Coach (Q2)",
        "Belief in Becoming a Successful Coach (Q3)",
        "Biggest Obstacle (Q4)",
        "Current Monthly Income (Q5)",
        "Desired Monthly Income (Q6)",
        "Coaching Business Vision (Q7)",
        "Why Now (Q8)",
        "Interest Level 1-10 (Q9)",
        "Why Consider You (Q10)",
        "Ready to Start Career Path (Q11)",
        "Phone Call Promise (Q12)",
        "Willing to Invest Financially (Q13)",
        "Financial Resources Available (Q14)"
      ]);
    }

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    // Determine row serial number (1, 2, 3...)
    var lastRow = sheet.getLastRow();
    var serial = lastRow > 0 ? lastRow : 1;
    if (data.serialNumber) {
      serial = data.serialNumber;
    }

    sheet.appendRow([
      serial,
      new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      data.fullName || "",
      data.phone || "",
      data.email || "",
      data.q1_describes_you || "",
      data.q2_why_become_coach || "",
      data.q3_why_can_become_coach || "",
      data.q4_biggest_obstacle || "",
      data.q5_monthly_income || "",
      data.q6_desired_income || "",
      data.q7_business_description || "",
      data.q8_why_now || "",
      data.q9_interest_rate || "",
      data.q10_why_consider_you || "",
      data.q11_start_career_path || "",
      data.q12_phone_call_promise || "",
      data.q13_investment_willingness || "",
      data.q14_financial_resources || ""
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", serial: serial }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
};`;

/**
 * Request OAuth token from Google Identity Services.
 */
export function requestGoogleAccessToken(promptConsent: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkGsi = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: DEFAULT_CLIENT_ID,
            scope: SHEETS_SCOPES,
            callback: (response) => {
              if (response.error) {
                reject(new Error(`Google authorization error: ${response.error}`));
                return;
              }
              if (response.access_token) {
                saveToken(response.access_token, response.expires_in || 3600);
                resolve(response.access_token);
              } else {
                reject(new Error('No access token received from Google.'));
              }
            },
          });

          client.requestAccessToken(promptConsent ? { prompt: 'consent' } : undefined);
        } catch (err) {
          reject(err);
        }
      } else if (Date.now() - startTime < 4000) {
        setTimeout(checkGsi, 150);
      } else {
        reject(new Error('Google Identity Services library is still loading. Please try again in a moment.'));
      }
    };

    checkGsi();
  });
}

/**
 * Search user's Drive for existing Master Coach spreadsheet or create a new one.
 */
export async function findOrCreateMasterCoachSheet(token: string): Promise<ConnectedSheetInfo> {
  // 1. First check if user stored a manual sheet ID
  const existing = getStoredSheetInfo();
  if (existing?.id) {
    try {
      // Verify sheet is accessible
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${existing.id}?fields=properties(title)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (checkRes.ok) {
        const sheetMeta = await checkRes.json();
        const updated = {
          ...existing,
          name: sheetMeta.properties?.title || existing.name,
        };
        saveSheetInfo(updated);
        return updated;
      }
    } catch {
      // ignore, fall through to search/create
    }
  }

  // 2. Search Drive for spreadsheet titled "Master Coach Application Data" or similar
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and (name contains 'Master Coach' or name contains 'Coaching Application')&fields=files(id,name,webViewLink)&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const found = data.files[0];
        const sheetInfo: ConnectedSheetInfo = {
          id: found.id,
          name: found.name,
          url: found.webViewLink || `https://docs.google.com/spreadsheets/d/${found.id}/edit`,
        };
        saveSheetInfo(sheetInfo);
        // Ensure headers exist in the sheet
        await ensureHeaders(sheetInfo.id, token);
        return sheetInfo;
      }
    }
  } catch (err) {
    console.warn('Drive search failed, proceeding to create sheet:', err);
  }

  // 3. Create a brand new Google Sheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Master Coach Application Data',
      },
      sheets: [
        {
          properties: {
            title: 'Applications',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${errText}`);
  }

  const newSheet = await createRes.json();
  const sheetInfo: ConnectedSheetInfo = {
    id: newSheet.spreadsheetId,
    name: newSheet.properties?.title || 'Master Coach Application Data',
    url: newSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${newSheet.spreadsheetId}/edit`,
  };

  saveSheetInfo(sheetInfo);

  // Initialize header row
  await ensureHeaders(sheetInfo.id, token);

  return sheetInfo;
}

/**
 * Make sure the sheet has the required header row.
 */
export async function ensureHeaders(spreadsheetId: string, token: string): Promise<void> {
  const possibleRanges = ['Sheet1!A1:S1', 'Applications!A1:S1', 'A1:S1'];
  for (const range of possibleRanges) {
    try {
      const checkRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let needsHeaders = true;
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.values && data.values.length > 0 && data.values[0].length > 0) {
          needsHeaders = false;
        }
      }

      if (needsHeaders) {
        const putRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              range: range,
              majorDimension: 'ROWS',
              values: [SHEET_HEADERS],
            }),
          }
        );
        if (putRes.ok) {
          return;
        }
      } else {
        return;
      }
    } catch {
      // try next range
    }
  }
}

/**
 * Format form data into row array matching headers.
 * Column 1 is =ROW()-1 which evaluates automatically to 1, 2, 3, 4... in Google Sheets.
 */
export function formatRowValues(formData: CoachingFormData, explicitSerial?: number): (string | number)[] {
  const serialFormula = explicitSerial !== undefined ? explicitSerial : '=ROW()-1';
  return [
    serialFormula,
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    formData.fullName || '',
    formData.phone || '',
    formData.email || '',
    formData.q1_describes_you || '',
    formData.q2_why_become_coach || '',
    formData.q3_why_can_become_coach || '',
    formData.q4_biggest_obstacle || '',
    formData.q5_monthly_income || '',
    formData.q6_desired_income || '',
    formData.q7_business_description || '',
    formData.q8_why_now || '',
    formData.q9_interest_rate ?? '',
    formData.q10_why_consider_you || '',
    formData.q11_start_career_path || '',
    formData.q12_phone_call_promise || '',
    formData.q13_investment_willingness || '',
    formData.q14_financial_resources || '',
  ];
}

/**
 * Send participant submission to Google Apps Script Webhook.
 * This runs directly without requiring applicant Google sign-in.
 */
export async function sendSubmissionViaWebhook(
  webhookUrl: string,
  formData: CoachingFormData,
  serialNumber?: number
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  const payload = {
    ...formData,
    serialNumber: serialNumber || 1,
    timestamp: new Date().toISOString(),
  };

  try {
    // Mode 'no-cors' is required for Google Apps Script Web Apps to prevent cross-origin redirect errors
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    console.warn('Webhook dispatch error:', err);
    return false;
  }
}

/**
 * Append participant answers to Google Sheet via Google Sheets REST API.
 */
export async function appendSubmissionToGoogleSheet(
  spreadsheetId: string,
  token: string,
  formData: CoachingFormData,
  serialNumber?: number
): Promise<boolean> {
  const rowValues = formatRowValues(formData, serialNumber);

  // Try appending to "Applications" tab first, then fallback to general append
  const ranges = ['Applications!A1', 'Sheet1!A1', 'A1'];

  for (const range of ranges) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
          range
        )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          keepalive: true,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            majorDimension: 'ROWS',
            values: [rowValues],
          }),
        }
      );

      if (response.ok) {
        return true;
      }

      // If token expired or invalid, throw to trigger re-auth
      if (response.status === 401) {
        throw new Error('AUTH_EXPIRED');
      }
    } catch (err) {
      if ((err as Error)?.message === 'AUTH_EXPIRED') {
        throw err;
      }
      // try next range
    }
  }

  return false;
}

