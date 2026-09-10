import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Link as LinkIcon,
  X,
  Lock,
  Download,
  ListOrdered,
  Copy,
  Check,
  Send,
  Code2,
  Users,
  Sparkles,
} from 'lucide-react';
import {
  getStoredSheetInfo,
  getStoredToken,
  requestGoogleAccessToken,
  findOrCreateMasterCoachSheet,
  extractSpreadsheetId,
  saveSheetInfo,
  ConnectedSheetInfo,
  ensureHeaders,
  getStoredWebhookUrl,
  saveWebhookUrl,
  sendSubmissionViaWebhook,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../lib/googleSheets';

interface CoachInternalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSheetConnected?: (sheet: ConnectedSheetInfo) => void;
}

export const CoachInternalModal: React.FC<CoachInternalModalProps> = ({
  isOpen,
  onClose,
  onSheetConnected,
}) => {
  const [activeTab, setActiveTab] = useState<'webhook' | 'oauth' | 'submissions'>('webhook');
  const [sheetInfo, setSheetInfo] = useState<ConnectedSheetInfo | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [localSubmissions, setLocalSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const storedSheet = getStoredSheetInfo();
    if (storedSheet) {
      setSheetInfo(storedSheet);
      onSheetConnected?.(storedSheet);
    }

    const storedWebhook = getStoredWebhookUrl();
    if (storedWebhook) {
      setWebhookUrl(storedWebhook);
    }

    try {
      const records = JSON.parse(localStorage.getItem('monkhood_submissions') || '[]');
      setLocalSubmissions(records);
    } catch {
      // ignore
    }
  }, [isOpen, onSheetConnected]);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setStatusMessage({ type: 'success', text: 'Apps Script code copied to clipboard!' });
    setTimeout(() => {
      setCopiedScript(false);
      setStatusMessage(null);
    }, 3000);
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = webhookUrl.trim();
    if (!cleanUrl) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Web App URL.' });
      return;
    }
    saveWebhookUrl(cleanUrl);
    setStatusMessage({ type: 'success', text: 'Google Sheet Web App URL saved successfully!' });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleTestWebhook = async () => {
    const cleanUrl = webhookUrl.trim() || getStoredWebhookUrl();
    if (!cleanUrl) {
      setStatusMessage({ type: 'error', text: 'Save a Web App URL first to test connection.' });
      return;
    }

    setIsTestingWebhook(true);
    setStatusMessage({ type: 'info', text: 'Sending sample test row to your Google Sheet...' });

    try {
      const testData = {
        fullName: 'Test Participant (Deepanshu Coach Verification)',
        phone: '+91 98765 43210',
        email: 'test.participant@monkhood.org',
        q1_describes_you: 'Aspiring High-Ticket Life Coach',
        q2_why_become_coach: 'Testing live Google Sheets data sync',
        q3_why_can_become_coach: 'Verified sync setup',
        q4_biggest_obstacle: 'None - verified',
        q5_monthly_income: '₹1,00,000 - ₹2,50,000',
        q6_desired_income: '₹5,00,000+',
        q7_business_description: 'Monkhood Life Coaching Program',
        q8_why_now: 'Immediate enrollment',
        q9_interest_rate: 10,
        q10_why_consider_you: 'Ready to take immediate action',
        q11_start_career_path: 'Yes, absolutely ready',
        q12_phone_call_promise: 'Yes, 100% committed',
        q13_investment_willingness: 'Yes, ready to invest',
        q14_financial_resources: 'Credit Card / UPI / Savings',
      };

      await sendSubmissionViaWebhook(cleanUrl, testData, 1);
      setStatusMessage({
        type: 'success',
        text: 'Success! Test row sent to your Google Sheet. Check your sheet now.',
      });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to send test row: ' + ((err as Error)?.message || 'Unknown error'),
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Connecting with Google Account...' });
    try {
      const token = await requestGoogleAccessToken(true);
      setStatusMessage({ type: 'info', text: 'Locating or initializing Master Coach sheet...' });
      const sheet = await findOrCreateMasterCoachSheet(token);
      setSheetInfo(sheet);
      onSheetConnected?.(sheet);
      setStatusMessage({ type: 'success', text: `Connected: "${sheet.name}"` });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Failed to connect Google Sheets';
      setStatusMessage({ type: 'error', text: `Error: ${errorMsg}` });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkCustomSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const spreadsheetId = extractSpreadsheetId(customInput);
    if (!spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Invalid Google Sheet URL or ID.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Linking Google Sheet...' });

    try {
      let token = getStoredToken();
      let sheetTitle = 'Master Coach Application Data';

      if (token) {
        try {
          const checkRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties(title)`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (checkRes.ok) {
            const meta = await checkRes.json();
            sheetTitle = meta.properties?.title || sheetTitle;
          }
          await ensureHeaders(spreadsheetId, token);
        } catch {
          // ignore
        }
      }

      const newInfo: ConnectedSheetInfo = {
        id: spreadsheetId,
        name: sheetTitle,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      };

      saveSheetInfo(newInfo);
      setSheetInfo(newInfo);
      onSheetConnected?.(newInfo);
      setStatusMessage({ type: 'success', text: `Successfully linked: "${sheetTitle}"` });
      setTimeout(() => setStatusMessage(null), 4000);
      setCustomInput('');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Linked successfully';
      setStatusMessage({ type: 'info', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const exportSubmissionsCSV = () => {
    if (localSubmissions.length === 0) {
      alert('No participant submissions recorded yet.');
      return;
    }

    const headers = [
      'S.No.',
      'Timestamp',
      'Full Name',
      'Phone Number',
      'Email',
      'Q1_Describes_You',
      'Q2_Why_Become_Coach',
      'Q3_Belief_In_Becoming_Coach',
      'Q4_Biggest_Obstacle',
      'Q5_Monthly_Income',
      'Q6_Desired_Income',
      'Q7_Business_Description',
      'Q8_Why_Now',
      'Q9_Interest_Rate_1_to_10',
      'Q10_Why_Consider_You',
      'Q11_Ready_To_Start',
      'Q12_Phone_Call_Promise',
      'Q13_Investment_Willingness',
      'Q14_Financial_Resources',
    ];

    const rows = localSubmissions.map((sub, index) => [
      sub.serialNumber || index + 1,
      `"${sub.submittedAt || sub.timestamp || ''}"`,
      `"${(sub.fullName || '').replace(/"/g, '""')}"`,
      `"${(sub.phone || '').replace(/"/g, '""')}"`,
      `"${(sub.email || '').replace(/"/g, '""')}"`,
      `"${(sub.q1_describes_you || '').replace(/"/g, '""')}"`,
      `"${(sub.q2_why_become_coach || '').replace(/"/g, '""')}"`,
      `"${(sub.q3_why_can_become_coach || '').replace(/"/g, '""')}"`,
      `"${(sub.q4_biggest_obstacle || '').replace(/"/g, '""')}"`,
      `"${(sub.q5_monthly_income || '').replace(/"/g, '""')}"`,
      `"${(sub.q6_desired_income || '').replace(/"/g, '""')}"`,
      `"${(sub.q7_business_description || '').replace(/"/g, '""')}"`,
      `"${(sub.q8_why_now || '').replace(/"/g, '""')}"`,
      sub.q9_interest_rate || '',
      `"${(sub.q10_why_consider_you || '').replace(/"/g, '""')}"`,
      `"${(sub.q11_start_career_path || '').replace(/"/g, '""')}"`,
      `"${(sub.q12_phone_call_promise || '').replace(/"/g, '""')}"`,
      `"${(sub.q13_investment_willingness || '').replace(/"/g, '""')}"`,
      `"${(sub.q14_financial_resources || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monkhood_Master_Coach_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncAllToWebhook = async () => {
    const cleanUrl = webhookUrl.trim() || getStoredWebhookUrl();
    if (!cleanUrl) {
      setStatusMessage({ type: 'error', text: 'Please configure your Web App URL first.' });
      return;
    }
    if (localSubmissions.length === 0) {
      setStatusMessage({ type: 'info', text: 'No submissions to sync.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: `Syncing ${localSubmissions.length} submissions to Google Sheet...` });

    try {
      for (let i = 0; i < localSubmissions.length; i++) {
        const sub = localSubmissions[i];
        await sendSubmissionViaWebhook(cleanUrl, sub, sub.serialNumber || i + 1);
      }
      setStatusMessage({
        type: 'success',
        text: `All ${localSubmissions.length} submissions successfully pushed to your Google Sheet!`,
      });
    } catch (err: unknown) {
      setStatusMessage({
        type: 'error',
        text: 'Sync error: ' + ((err as Error)?.message || 'Failed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-neutral-200 text-neutral-900 relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-950 text-amber-400 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                  Coach Deepanshu &bull; Data Portal
                </h3>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Internal Only
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Setup your Google Sheet so all applicant submissions stream directly to you.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'webhook'
                ? 'border-amber-500 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Google Sheet Webhook (100% Reliable)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'oauth'
                ? 'border-amber-500 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Account / Link</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'submissions'
                ? 'border-amber-500 text-neutral-950'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-neutral-600" />
            <span>Submissions ({localSubmissions.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-150 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-neutral-400 hover:text-neutral-700 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: Google Apps Script Webhook (Bulletproof for Public Visitors) */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Why this is the best method for receiving applicant data</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  When applicants fill out your form online, they are not signed in to your personal Google account. 
                  Adding this lightweight Google Apps Script to your Google Sheet allows <strong>every applicant</strong> to submit data straight into your sheet automatically without requiring any permissions.
                </p>
              </div>

              {/* Connected Target Sheet Info */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                    Target Spreadsheet
                  </div>
                  <div className="font-bold text-emerald-950 text-sm">
                    Master Coach Application
                  </div>
                  <div className="text-emerald-700 font-mono text-[11px] truncate max-w-[280px] sm:max-w-md">
                    ID: 1vEilcKSMLKNJ45iH9TuHGhIAlbWhkyZPrgUarGuBtCI
                  </div>
                </div>
                <a
                  href="https://docs.google.com/spreadsheets/d/1vEilcKSMLKNJ45iH9TuHGhIAlbWhkyZPrgUarGuBtCI/edit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold flex items-center gap-1 hover:bg-emerald-500 transition shadow-xs text-xs flex-shrink-0"
                >
                  <span>Open Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 3 Step Setup Guide */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Quick 1-Minute Setup Guide for Deepanshu
                </h4>
                <ol className="text-xs text-neutral-700 space-y-2.5 list-decimal list-inside">
                  <li>
                    In your open tab for <strong>Master Coach Application</strong>, click <strong>Extensions</strong> (top menu) &rarr; <strong>Apps Script</strong>.
                  </li>
                  <li>
                    Select and delete any default code inside the editor, then paste this script:
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition text-xs shadow-xs"
                      >
                        {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedScript ? 'Code Copied!' : 'Copy Apps Script Code'}</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    Click the blue <strong>Deploy</strong> button (top right) &rarr; <strong>New deployment</strong>.
                    <div className="mt-1 pl-4 text-[11px] text-neutral-600 space-y-0.5">
                      <div>&bull; Click the gear icon next to "Select type" &rarr; Choose <strong>Web app</strong></div>
                      <div>&bull; <strong>Execute as:</strong> Me (<code>deepanshubagde@gmail.com</code>)</div>
                      <div>&bull; <strong>Who has access:</strong> <span className="font-bold text-neutral-900">Anyone</span> (allows form visitors to write)</div>
                    </div>
                  </li>
                  <li>
                    Click <strong>Deploy</strong>, copy the generated <strong>Web app URL</strong> (ends in <code>/exec</code>), and paste it below:
                  </li>
                </ol>
              </div>

              {/* Webhook Input Form */}
              <form onSubmit={handleSaveWebhook} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1">
                    Your Google Apps Script Web App URL:
                  </label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2.5 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition shadow-xs"
                  >
                    Save Web App URL
                  </button>

                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook || !webhookUrl.trim()}
                    className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isTestingWebhook ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending Test...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-amber-400" />
                        <span>Send Test Row</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Google Account OAuth / Direct Link */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              {sheetInfo ? (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Active Connected Sheet
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-neutral-900 truncate">
                    {sheetInfo.name}
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <a
                      href={sheetInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition shadow-xs"
                    >
                      <span>Open in Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-600">
                  <p className="font-semibold text-neutral-800 mb-1">Direct Google Drive Authorization</p>
                  <p>
                    Authenticate with your Google account to automatically locate or create a dedicated Master Coach spreadsheet.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60 shadow-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>{sheetInfo ? 'Re-authorize Google Account' : 'Connect with Google Account'}</span>
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-neutral-200 w-full" />
                <span className="bg-white px-3 text-[10px] text-neutral-400 uppercase font-bold tracking-wider">
                  OR LINK BY SPREADSHEET URL
                </span>
              </div>

              <form onSubmit={handleLinkCustomSheet} className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Google Spreadsheet Link or ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full pl-8 pr-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <LinkIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !customInput.trim()}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  Save Google Sheet Link
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Submissions Explorer & CSV Backup */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                <div>
                  <div className="text-xs text-neutral-500">Stored Participant Records</div>
                  <div className="text-base font-bold text-neutral-900">{localSubmissions.length} Submissions</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportSubmissionsCSV}
                    disabled={localSubmissions.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncAllToWebhook}
                    disabled={localSubmissions.length === 0 || isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Sync All to Sheet</span>
                  </button>
                </div>
              </div>

              {localSubmissions.length > 0 ? (
                <div className="border border-neutral-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-100 text-neutral-700 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2 border-b border-neutral-200">S.No.</th>
                        <th className="p-2 border-b border-neutral-200">Name</th>
                        <th className="p-2 border-b border-neutral-200">Phone</th>
                        <th className="p-2 border-b border-neutral-200">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-800">
                      {localSubmissions.map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-neutral-50">
                          <td className="p-2 font-mono text-neutral-500">{sub.serialNumber || idx + 1}</td>
                          <td className="p-2 font-medium">{sub.fullName || '—'}</td>
                          <td className="p-2">{sub.phone || '—'}</td>
                          <td className="p-2 text-neutral-500 truncate max-w-[120px]">{sub.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No applicant submissions recorded yet. Once participants submit, their complete application answers will appear here and in your Google Sheet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span>Protected Monkhood Management</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
