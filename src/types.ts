export interface CoachingFormData {
  fullName: string;
  phone: string;
  email: string;
  q1_describes_you: string;
  q2_why_become_coach: string;
  q3_why_can_become_coach: string;
  q4_biggest_obstacle: string;
  q5_monthly_income: string;
  q6_desired_income: string;
  q7_business_description: string;
  q8_why_now: string;
  q9_interest_rate: number | null;
  q10_why_consider_you: string;
  q11_start_career_path: string;
  q12_phone_call_promise: string;
  q13_investment_willingness: string;
  q14_financial_resources: string;
}

export type FormErrors = Partial<Record<keyof CoachingFormData, string>>;

export interface FormSubmissionRecord extends CoachingFormData {
  submittedAt: string;
  id: string;
}
