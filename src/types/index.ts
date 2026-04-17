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
