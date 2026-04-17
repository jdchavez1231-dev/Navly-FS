export type Status = 'not_assessed' | 'compliant' | 'gap' | 'na'
export type Rating = 'fundamental' | 'major' | 'minor'

export interface BrcgsClause {
  id: string
  title: string
  description: string
  rating: Rating
}

export interface BrcgsSection {
  id: string
  title: string
  clauses: BrcgsClause[]
}

export interface EvidenceItem {
  url: string
  name: string
  type: 'image' | 'video' | 'file'
  createdAt: string
}

export interface ClauseRecord {
  status: Status
  notes: string
  updatedAt: string
  evidence?: EvidenceItem[]
}

export type TrackerData = Record<string, ClauseRecord>

export interface SectionStats {
  total: number
  assessed: number
  compliant: number
  gaps: number
}

export type CAStatus = 'open' | 'in_progress' | 'closed' | 'verified'
export type RCAFramework = 'narrative' | '5_whys' | 'fishbone'

export interface FiveWhysData {
  why1: string; why2: string; why3: string; why4: string; why5: string
}

export interface FishboneData {
  man: string; machine: string; method: string
  material: string; environment: string; measurement: string
}

export type RCAData = FiveWhysData | FishboneData | Record<string, never>

export interface CorrectiveAction {
  id: string
  facility_id: string
  checklist_id: string
  element_code: string
  element_name: string
  severity: Rating
  status: CAStatus
  identified_at: string
  // quick fields
  assigned_to: string
  due_date: string | null
  description: string
  // full CAPA fields
  rca_framework: RCAFramework
  rca_data: RCAData
  immediate_action: string
  root_cause: string
  corrective_action: string
  preventive_action: string
  verification_method: string
  verified_by: string
  verified_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}
