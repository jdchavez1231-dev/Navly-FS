import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { BRCGS_SECTIONS } from '../data/brcgs'
import { useFacility } from './useFacility'
import type { Status, TrackerData, EvidenceItem } from '../types'

const STANDARD = 'BRCGS'

type Row = {
  id: string
  element_code: string
  status: Status
  notes: string
  updated_at: string
  evidence: EvidenceItem[] | null
}

export function useTracker() {
  const { facilityId, loading: facilityLoading } = useFacility()
  const [data, setData] = useState<TrackerData>({})
  const [rowIds, setRowIds] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (facilityLoading) return
    if (!facilityId) { setLoading(false); return }

    async function load() {
      const { data: rows } = await supabase
        .from('checklists')
        .select('id, element_code, status, notes, updated_at, evidence')
        .eq('facility_id', facilityId)
        .eq('standard', STANDARD)

      if (rows && rows.length > 0) {
        hydrate(rows as Row[])
      } else {
        await seed(facilityId!)
      }
      setLoading(false)
    }

    load()
  }, [facilityId, facilityLoading])

  function hydrate(rows: Row[]) {
    const newData: TrackerData = {}
    const newIds: Record<string, string> = {}
    for (const row of rows) {
      newData[row.element_code] = {
        status: row.status,
        notes: row.notes ?? '',
        updatedAt: row.updated_at,
        evidence: row.evidence ?? [],
      }
      newIds[row.element_code] = row.id
    }
    setData(newData)
    setRowIds(newIds)
  }

  async function seed(fid: string) {
    const allClauses = BRCGS_SECTIONS.flatMap(s =>
      s.clauses.map(c => ({
        facility_id: fid,
        standard: STANDARD,
        element_code: c.id,
        element_name: c.title,
        status: 'not_assessed',
        notes: '',
        evidence: [],
      }))
    )

    const { data: inserted } = await supabase
      .from('checklists')
      .insert(allClauses)
      .select('id, element_code, status, notes, updated_at, evidence')

    if (inserted) hydrate(inserted as Row[])
  }

  const updateClause = useCallback(
    async (id: string, patch: { status?: Status; notes?: string; evidence?: EvidenceItem[] }) => {
      setData(prev => {
        const existing = prev[id]
        const next: import('../types').ClauseRecord = {
          status: existing?.status ?? 'not_assessed',
          notes: existing?.notes ?? '',
          updatedAt: new Date().toISOString(),
          evidence: existing?.evidence ?? [],
          ...patch,
        }
        return { ...prev, [id]: next }
      })

      const rowId = rowIds[id]
      if (!rowId) return

      await supabase
        .from('checklists')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', rowId)
    },
    [rowIds]
  )

  return { data, updateClause, loading }
}
