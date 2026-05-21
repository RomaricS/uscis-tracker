// The 10 CR1 stages in order
export const CR1_STAGES = [
  'I130_FILED',
  'USCIS_RECEIVED',
  'BIOMETRICS',
  'I130_APPROVED',
  'NVC_RECEIVED',
  'NVC_PROCESSING',
  'DS260_SUBMITTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED',
  'VISA_ISSUED',
] as const

export type CR1Stage = typeof CR1_STAGES[number]

// Stage metadata for display
export const STAGE_LABELS: Record<CR1Stage, string> = {
  I130_FILED: 'I-130 Filed',
  USCIS_RECEIVED: 'USCIS Received',
  BIOMETRICS: 'Biometrics',
  I130_APPROVED: 'I-130 Approved',
  NVC_RECEIVED: 'NVC Received',
  NVC_PROCESSING: 'NVC Processing',
  DS260_SUBMITTED: 'DS-260 Submitted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEW_COMPLETED: 'Interview Completed',
  VISA_ISSUED: 'Visa Issued 🎉',
}

export const STAGE_AGENCY: Record<CR1Stage, 'USCIS' | 'NVC' | 'Consulate'> = {
  I130_FILED: 'USCIS',
  USCIS_RECEIVED: 'USCIS',
  BIOMETRICS: 'USCIS',
  I130_APPROVED: 'USCIS',
  NVC_RECEIVED: 'NVC',
  NVC_PROCESSING: 'NVC',
  DS260_SUBMITTED: 'NVC',
  INTERVIEW_SCHEDULED: 'Consulate',
  INTERVIEW_COMPLETED: 'Consulate',
  VISA_ISSUED: 'Consulate',
}

// Which stages can be auto-fetched from USCIS (vs user-logged)
export const USCIS_FETCHABLE_STAGES = new Set<CR1Stage>([
  'USCIS_RECEIVED',
  'BIOMETRICS',
  'I130_APPROVED',
])

export type VisaType = 'CR1' | 'IR1'

export type NotificationCadence = 'weekly' | 'biweekly' | 'monthly'

// Matches the `cases` table row
export interface Case {
  id: string
  user_id: string
  receipt_no: string
  visa_type: VisaType
  consulate: string | null
  country_birth: string | null
  current_stage: CR1Stage | null
  raw_status: string | null
  last_checked: string | null          // ISO timestamptz
  last_stage_change: string | null     // ISO timestamptz
  opted_in: boolean
  created_at: string                   // ISO timestamptz
}

// Matches the `community_timelines` table row
export interface CommunityTimeline {
  id: string
  visa_type: VisaType
  consulate: string | null
  country_birth: string | null
  stage: CR1Stage
  days_in_stage: number
  year: number
  created_at: string
}

// ETA query result shape
export interface StageETA {
  stage: CR1Stage
  median_days: number
  p10_days: number
  p90_days: number
  sample_size: number
  is_global_fallback: boolean   // true if fell back to visa_type+stage only (no consulate filter)
}
