/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CoachInternalModal } from './components/CoachInternalModal';
import { RatingInput } from './components/RatingInput';
import { RadioGroup } from './components/RadioGroup';
import { CoachingFormData, FormErrors } from './types';
import { AlertCircle, ExternalLink, Lock } from 'lucide-react';
import {
  appendSubmissionToGoogleSheet,
  getStoredSheetInfo,
  getStoredToken,
  getStoredWebhookUrl,
  sendSubmissionViaWebhook,
} from './lib/googleSheets';

const INITIAL_FORM: CoachingFormData = {
  fullName: '',
  phone: '',
  email: '',
  q1_describes_you: '',
  q2_why_become_coach: '',
  q3_why_can_become_coach: '',
  q4_biggest_obstacle: '',
  q5_monthly_income: '',
  q6_desired_income: '',
  q7_business_description: '',
  q8_why_now: '',
  q9_interest_rate: null,
  q10_why_consider_you: '',
  q11_start_career_path: '',
  q12_phone_call_promise: '',
  q13_investment_willingness: '',
  q14_financial_resources: '',
};

export default function App() {
  const [formData, setFormData] = useState<CoachingFormData>(() => {
    try {
      const saved = localStorage.getItem('monkhood_form_draft');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_FORM;
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  // Check if admin/coach mode requested via URL parameter (?coach=true or ?admin=true)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('coach') === 'true' || params.get('admin') === 'true') {
        setIsCoachModalOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-save draft to local storage
  useEffect(() => {
    try {
      localStorage.setItem('monkhood_form_draft', JSON.stringify(formData));
    } catch {
      // ignore
    }
  }, [formData]);

  const updateField = <K extends keyof CoachingFormData>(
    field: K,
    value: CoachingFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Calculate completed fields count
  const totalQuestions = 17;
  const completedCount = [
    Boolean(formData.fullName.trim()),
    Boolean(formData.phone.trim()),
    Boolean(formData.email.trim()),
    Boolean(formData.q1_describes_you),
    Boolean(formData.q2_why_become_coach.trim()),
    Boolean(formData.q3_why_can_become_coach.trim()),
    Boolean(formData.q4_biggest_obstacle.trim()),
    Boolean(formData.q5_monthly_income.trim()),
    Boolean(formData.q6_desired_income),
    Boolean(formData.q7_business_description.trim()),
    Boolean(formData.q8_why_now.trim()),
    formData.q9_interest_rate !== null,
    Boolean(formData.q10_why_consider_you.trim()),
    Boolean(formData.q11_start_career_path),
    Boolean(formData.q12_phone_call_promise),
    Boolean(formData.q13_investment_willingness),
    Boolean(formData.q14_financial_resources),
  ].filter(Boolean).length;

  const progressPercentage = Math.round((completedCount / totalQuestions) * 100);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Please enter your full name';
    if (!formData.phone.trim()) newErrors.phone = 'Please enter your phone number';
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.q1_describes_you) newErrors.q1_describes_you = 'Please choose one option';
    if (!formData.q2_why_become_coach.trim())
      newErrors.q2_why_become_coach = 'Please answer this question';
    if (!formData.q3_why_can_become_coach.trim())
      newErrors.q3_why_can_become_coach = 'Please answer this question';
    if (!formData.q4_biggest_obstacle.trim())
      newErrors.q4_biggest_obstacle = 'Please describe your biggest obstacle';
    if (!formData.q5_monthly_income.trim())
      newErrors.q5_monthly_income = 'Please write your monthly income in numbers';
    if (!formData.q6_desired_income)
      newErrors.q6_desired_income = 'Please select your desired monthly income';
    if (!formData.q7_business_description.trim())
      newErrors.q7_business_description = 'Please describe your business or work';
    if (!formData.q8_why_now.trim())
      newErrors.q8_why_now = 'Please share why now is the right time';
    if (formData.q9_interest_rate === null)
      newErrors.q9_interest_rate = 'Please rate your interest on a scale from 1 to 10';
    if (!formData.q10_why_consider_you.trim())
      newErrors.q10_why_consider_you = 'Please describe why we should consider you';
    if (!formData.q11_start_career_path)
      newErrors.q11_start_career_path = 'Please select your coaching career plan';
    if (!formData.q12_phone_call_promise)
      newErrors.q12_phone_call_promise = 'Please indicate your commitment';
    if (!formData.q13_investment_willingness)
      newErrors.q13_investment_willingness = 'Please select your investment range';
    if (!formData.q14_financial_resources)
      newErrors.q14_financial_resources = 'Please select your financial resources stage';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      // Scroll to first invalid field
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }
    return true;
  };

  const CHECKOUT_URL =
    'https://monkhood.org/checkout/fb5543ae-c4fb-4a45-99fe-0cb933afae68';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    let currentSerial = 1;

    // Save record to local storage log immediately
    try {
      const existing = JSON.parse(
        localStorage.getItem('monkhood_submissions') || '[]'
      );
      currentSerial = existing.length + 1;
      const submissionRecord = {
        serialNumber: currentSerial,
        ...formData,
        id: 'sub_' + Date.now(),
        submittedAt: new Date().toISOString(),
      };
      existing.unshift(submissionRecord);
      localStorage.setItem('monkhood_submissions', JSON.stringify(existing));
      localStorage.removeItem('monkhood_form_draft');
    } catch {
      // ignore
    }

    // Send submission to connected Google Sheet
    try {
      const webhookUrl = getStoredWebhookUrl();
      const sheetInfo = getStoredSheetInfo();
      const token = getStoredToken();
      const targetSheetId =
        sheetInfo?.id ||
        (import.meta.env.VITE_GOOGLE_SPREADSHEET_ID as string) ||
        '';

      const syncPromises: Promise<any>[] = [];

      // Method 1: Google Apps Script Webhook (works 100% reliably for public visitors)
      if (webhookUrl) {
        syncPromises.push(sendSubmissionViaWebhook(webhookUrl, formData, currentSerial));
      }

      // Method 2: Direct Google Sheets API via OAuth token
      if (targetSheetId && token) {
        syncPromises.push(appendSubmissionToGoogleSheet(targetSheetId, token, formData, currentSerial));
      }

      if (syncPromises.length > 0) {
        // Wait up to 1.5 seconds for network dispatch before redirecting (keepalive ensures delivery)
        await Promise.race([
          Promise.allSettled(syncPromises),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      }
    } catch (sheetErr) {
      console.warn('Google Sheets sync warning:', sheetErr);
    }

    // Direct, immediate navigation to checkout URL without any intermediate screen
    const executeRedirect = () => {
      // 1. Try navigating top window (if inside an iframe)
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = CHECKOUT_URL;
          return;
        }
      } catch {
        // Cross-origin iframe top navigation may be restricted
      }

      // 2. Direct browser location assignment
      try {
        window.location.href = CHECKOUT_URL;
        return;
      } catch {
        // ignore
      }

      // 3. Fallback: programmatic anchor click
      try {
        const link = document.createElement('a');
        link.href = CHECKOUT_URL;
        link.target = '_top';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        window.location.assign(CHECKOUT_URL);
      }
    };

    executeRedirect();
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-neutral-900 flex flex-col selection:bg-amber-500 selection:text-white">
      {/* Header with small, short and sweet logo */}
      <Header onOpenCoachModal={() => setIsCoachModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6 sm:space-y-7 bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8 shadow-sm"
        >
            {/* Full Name */}
            <div id="field-fullName" className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="block text-sm font-semibold text-neutral-900"
              >
                Full Name <span className="text-red-600 font-bold">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none transition ${
                  errors.fullName
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.fullName && (
                <p className="text-xs text-red-600 font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Phone Number - Stacked */}
            <div id="field-phone" className="space-y-1.5">
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-neutral-900"
              >
                Phone Number <span className="text-red-600 font-bold">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none transition ${
                  errors.phone
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-red-600 font-medium">{errors.phone}</p>
              )}
            </div>

            {/* Email - Below Phone Number */}
            <div id="field-email" className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-neutral-900"
              >
                Email <span className="text-red-600 font-bold">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none transition ${
                  errors.email
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Q1: What Describes you best? (Kept side-by-side as requested) */}
            <div id="field-q1_describes_you" className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-900">
                Q1: What Describes you best? <span className="text-red-600 font-bold">*</span>
              </label>
              <RadioGroup
                name="q1_describes_you"
                value={formData.q1_describes_you}
                onChange={(val) => updateField('q1_describes_you', val)}
                error={errors.q1_describes_you}
                columns={2}
                options={['Already Coach', 'Aspiring To Be Coach']}
              />
            </div>

            {/* Q2: Why Do You want to Become a Coach? */}
            <div id="field-q2_why_become_coach" className="space-y-2">
              <label
                htmlFor="q2_why_become_coach"
                className="block text-sm sm:text-base font-semibold text-neutral-900"
              >
                Q2: Why Do You want to Become a Coach?{' '}
                <span className="text-red-600 font-bold">*</span>
              </label>
              <textarea
                id="q2_why_become_coach"
                rows={3}
                value={formData.q2_why_become_coach}
                onChange={(e) => updateField('q2_why_become_coach', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none resize-y transition ${
                  errors.q2_why_become_coach
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.q2_why_become_coach && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.q2_why_become_coach}
                </p>
              )}
            </div>

            {/* Q3: Why Do You think You can become a Coach? */}
            <div id="field-q3_why_can_become_coach" className="space-y-2">
              <label
                htmlFor="q3_why_can_become_coach"
                className="block text-sm sm:text-base font-semibold text-neutral-900"
              >
                Q3: Why Do You think You can become a Coach?{' '}
                <span className="text-red-600 font-bold">*</span>
              </label>
              <textarea
                id="q3_why_can_become_coach"
                rows={3}
                value={formData.q3_why_can_become_coach}
                onChange={(e) => updateField('q3_why_can_become_coach', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none resize-y transition ${
                  errors.q3_why_can_become_coach
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.q3_why_can_become_coach && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.q3_why_can_become_coach}
                </p>
              )}
            </div>

            {/* Q4: Biggest Obstacle */}
            <div id="field-q4_biggest_obstacle" className="space-y-2">
              <label
                htmlFor="q4_biggest_obstacle"
                className="block text-sm sm:text-base font-semibold text-neutral-900 leading-snug"
              >
                Q4: Whats the #1 Single biggest obstacle holding back right now from reaching your growth goals?{' '}
                <span className="text-red-600 font-bold">*</span>
              </label>
              <textarea
                id="q4_biggest_obstacle"
                rows={4}
                value={formData.q4_biggest_obstacle}
                onChange={(e) => updateField('q4_biggest_obstacle', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none resize-y transition ${
                  errors.q4_biggest_obstacle
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.q4_biggest_obstacle && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.q4_biggest_obstacle}
                </p>
              )}
            </div>

            {/* Q5: What is your MONTHLY Income? */}
            <div id="field-q5_monthly_income" className="space-y-2">
              <label
                htmlFor="q5_monthly_income"
                className="block text-sm sm:text-base font-semibold text-neutral-900"
              >
                Q5: What is your MONTHLY Income? (Write it in numbers){' '}
                <span className="text-red-600 font-bold">*</span>
              </label>
              <input
                type="text"
                id="q5_monthly_income"
                value={formData.q5_monthly_income}
                onChange={(e) => updateField('q5_monthly_income', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none transition ${
                  errors.q5_monthly_income
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.q5_monthly_income && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.q5_monthly_income}
                </p>
              )}
            </div>

            {/* Q-6 What is your desired Monthly Income? (Stacked vertically) */}
            <div id="field-q6_desired_income" className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-900">
                Q-6 What is your desired Monthly Income?{' '}
                <span className="text-red-600 font-bold">*</span>
              </label>
              <RadioGroup
                name="q6_desired_income"
                value={formData.q6_desired_income}
                onChange={(val) => updateField('q6_desired_income', val)}
                error={errors.q6_desired_income}
                columns={1}
                options={[
                  '50k - 1 Lakh',
                  '1 Lakh - 2 Lakh',
                  '2 Lakh - 5 Lakh',
                  '5 Lakh - 10 Lakh',
                ]}
              />
            </div>

            {/* Q-7: Briefly Describe Your Business/work */}
            <div id="field-q7_business_description" className="space-y-2">
              <label
                htmlFor="q7_business_description"
                className="block text-sm sm:text-base font-semibold text-neutral-900"
              >
                Q-7: Briefly Describe Your Business/work, What Do You Sell, To Whom & At
                What Price Point? <span className="text-red-600 font-bold">*</span>
              </label>
              <textarea
                id="q7_business_description"
                rows={3}
                value={formData.q7_business_description}
                onChange={(e) =>
                  updateField('q7_business_description', e.target.value)
                }
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none resize-y transition ${
                  errors.q7_business_description
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.q7_business_description && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.q7_business_description}
                </p>
              )}
            </div>

            {/* Q-8: Why Is now a good time */}
            <div id="field-q8_why_now" className="space-y-2">
              <label
                htmlFor="q8_why_now"
                className="block text-sm sm:text-base font-semibold text-neutral-900"
              >
                Q-8: Why Is now a good time to get involved in this programme & scale
                your coaching business? <span className="text-red-600 font-bold">*</span>
              </label>
              <textarea
                id="q8_why_now"
                rows={3}
                value={formData.q8_why_now}
                onChange={(e) => updateField('q8_why_now', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none resize-y transition ${
                  errors.q8_why_now
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.q8_why_now && (
                <p className="text-xs text-red-600 font-medium">{errors.q8_why_now}</p>
              )}
            </div>

            {/* Q-9: Interest Rating 1 to 10 */}
            <div id="field-q9_interest_rate" className="space-y-2.5">
              <label className="block text-sm sm:text-base font-semibold text-neutral-900 leading-snug">
                Q-9: On A Rate From 1 To 10 (Where 1 Being Not Interested & 10 Being
                Very Interested), How Much Interested Are You to join the Master Coach
                Program? <span className="text-red-600 font-bold">*</span>
              </label>
              <RatingInput
                id="rating-input-q9"
                value={formData.q9_interest_rate}
                onChange={(val) => updateField('q9_interest_rate', val)}
                error={errors.q9_interest_rate}
              />
            </div>

            {/* Q-10: Why consider you */}
            <div id="field-q10_why_consider_you" className="space-y-2">
              <label
                htmlFor="q10_why_consider_you"
                className="block text-sm sm:text-base font-semibold text-neutral-900"
              >
                Q-10: Briefly Describe Why Do you Want Us To Consider You To Be A Part
                Of This Programme? <span className="text-red-600 font-bold">*</span>
              </label>
              <textarea
                id="q10_why_consider_you"
                rows={3}
                value={formData.q10_why_consider_you}
                onChange={(e) => updateField('q10_why_consider_you', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-neutral-900 text-sm sm:text-base focus:outline-none resize-y transition ${
                  errors.q10_why_consider_you
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-neutral-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              {errors.q10_why_consider_you && (
                <p className="text-xs text-red-600 font-medium">
                  {errors.q10_why_consider_you}
                </p>
              )}
            </div>

            {/* Q-11: How Do You want to Start your coaching career? */}
            <div id="field-q11_start_career_path" className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-900">
                Q-11: How Do You want to Start your coaching career?{' '}
                <span className="text-red-600 font-bold">*</span>
              </label>
              <RadioGroup
                name="q11_start_career_path"
                value={formData.q11_start_career_path}
                onChange={(val) => updateField('q11_start_career_path', val)}
                error={errors.q11_start_career_path}
                columns={1}
                options={[
                  'Part Time Side Hustle',
                  'Full Time Thriving Career',
                  'Use Coaching Skills in my existing Business/Career',
                ]}
              />
            </div>

            {/* Q-12: Promise to show up (Stacked vertically) */}
            <div id="field-q12_phone_call_promise" className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-900">
                Q-12: So, do you promise if you qualify for the phone call, you will
                show up at desired time? <span className="text-red-600 font-bold">*</span>
              </label>
              <RadioGroup
                name="q12_phone_call_promise"
                value={formData.q12_phone_call_promise}
                onChange={(val) => updateField('q12_phone_call_promise', val)}
                error={errors.q12_phone_call_promise}
                columns={1}
                options={['Yes', 'No']}
              />
            </div>

            {/* Q-13: Investment Willingness */}
            <div id="field-q13_investment_willingness" className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-900 leading-snug">
                Q-13 Finally, If you get selected to work one-on-one with Mr. Deepanshu
                and his team, How Much You are willing to Invest in a Master coach?{' '}
                <span className="text-red-600 font-bold">*</span>
              </label>
              <RadioGroup
                name="q13_investment_willingness"
                value={formData.q13_investment_willingness}
                onChange={(val) => updateField('q13_investment_willingness', val)}
                error={errors.q13_investment_willingness}
                columns={1}
                options={['50k - 1Lakh', '1Lakh - 1.5Lakh', 'Money is not an Issue']}
              />
            </div>

            {/* Q-14: Financial Resources */}
            <div id="field-q14_financial_resources" className="space-y-2">
              <label className="block text-sm sm:text-base font-semibold text-neutral-900">
                Q-14 What Describes You The Best?{' '}
                <span className="text-red-600 font-bold">*</span>
              </label>
              <RadioGroup
                name="q14_financial_resources"
                value={formData.q14_financial_resources}
                onChange={(val) => updateField('q14_financial_resources', val)}
                error={errors.q14_financial_resources}
                columns={1}
                options={[
                  '1) I Have The Financial Resources To Invest In Master coach Right Now.',
                  '2) I Have The Ability To Generate Financial Resources To Invest In Master coach.',
                  "3) I Don't Have The Financial Resources To Invest In Master coach Anytime Soon.",
                ]}
              />
            </div>

            {/* Error summary bar if submission failed */}
            {Object.keys(errors).length > 0 && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                <span>
                  Please answer all compulsory questions ({Object.keys(errors).length}{' '}
                  remaining) before submitting.
                </span>
              </div>
            )}

            {/* Submit Action Area */}
            <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                id="submit-btn"
                disabled={isSubmitting}
                className={`w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                  isSubmitting
                    ? 'bg-amber-400 text-neutral-950 cursor-wait'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/10 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Redirecting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>

              {isSubmitting && (
                <a
                  href={CHECKOUT_URL}
                  target="_top"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-600 hover:text-neutral-950 flex items-center gap-1 underline underline-offset-2 py-1"
                >
                  <span>Click here if not redirected automatically</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </form>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-neutral-500 border-t border-neutral-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          <p className="font-medium text-neutral-700">
            Monkhood &bull; Master Coach Certification Boot Camp
          </p>
          <div className="flex items-center justify-center gap-2">
            <span>&copy; Monkhood. All Rights Reserved. Private & Confidential.</span>
            {/* Discreet coach management entry - subtle lock for Coach Deepanshu */}
            <button
              type="button"
              onClick={() => setIsCoachModalOpen(true)}
              title="Coach Portal"
              className="text-neutral-400 hover:text-neutral-700 p-0.5 rounded transition cursor-pointer"
              aria-label="Coach Portal"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>

      {/* Internal Coach Management Portal (Only visible to Coach Deepanshu) */}
      <CoachInternalModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
      />
    </div>
  );
}
