import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useFacility } from './useFacility'
import type { CorrectiveAction, Rating } from '../types'

export function useCorrectiveActions() {
  const { facilityId } = useFacility()
  const [actions, setActions] = useState<CorrectiveAction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!facilityId) { setLoading(false); return }
    load()
  }, [facilityId])

  async function load() {
    const { data } = await supabase
      .from('corrective_actions')
      .select('*')
      .eq('facility_id', facilityId)
      .order('identified_at', { ascending: false })
    if (data) setActions(data as CorrectiveAction[])
    setLoading(false)
  }

  const createAction = useCallback(async (params: {
    checklistId: string
    elementCode: string
    elementName: string
    severity: Rating
    description?: string
  }): Promise<CorrectiveAction | null> => {
    if (!facilityId) return null

    // Don't duplicate — return existing open CA if one already exists for this clause
    const existing = await supabase
      .from('corrective_actions')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('element_code', params.elementCode)
      .neq('status', 'verified')
      .maybeSingle()

    if (existing.data) return existing.data as CorrectiveAction

    const { data } = await supabase
      .from('corrective_actions')
      .insert({
        facility_id: facilityId,
        checklist_id: params.checklistId,
        element_code: params.elementCode,
        element_name: params.elementName,
        severity: params.severity,
        status: 'open',
        identified_at: new Date().toISOString(),
        assigned_to: '',
        due_date: null,
        description: params.description ?? '',
        rca_framework: 'narrative',
        rca_data: {},
        immediate_action: '',
        root_cause: '',
        corrective_action: '',
        preventive_action: '',
        verification_method: '',
        verified_by: '',
        verified_at: null,
        closed_at: null,
      })
      .select('*')
      .single()

    if (data) {
      const ca = data as CorrectiveAction
      setActions(prev => [ca, ...prev])
      return ca
    }
    return null
  }, [facilityId])

  const createManualAction = useCallback(async (params: {
    category: string
    title: string
    severity: Rating
    description?: string
    assigned_to?: string
    due_date?: string
  }): Promise<CorrectiveAction | null> => {
    if (!facilityId) return null
    const { data } = await supabase
      .from('corrective_actions')
      .insert({
        facility_id: facilityId,
        checklist_id: 'manual',
        element_code: params.category,
        element_name: params.title,
        severity: params.severity,
        status: 'open',
        identified_at: new Date().toISOString(),
        assigned_to: params.assigned_to ?? '',
        due_date: params.due_date ?? null,
        description: params.description ?? '',
        rca_framework: 'narrative',
        rca_data: {},
        immediate_action: '',
        root_cause: '',
        corrective_action: '',
        preventive_action: '',
        verification_method: '',
        verified_by: '',
        verified_at: null,
        closed_at: null,
      })
      .select('*')
      .single()

    if (data) {
      const ca = data as CorrectiveAction
      setActions(prev => [ca, ...prev])
      return ca
    }
    return null
  }, [facilityId])

  const updateAction = useCallback(async (id: string, patch: Partial<CorrectiveAction>) => {
    const updates = { ...patch, updated_at: new Date().toISOString() }

    // Auto-set timestamps
    if (patch.status === 'closed' || patch.status === 'verified') {
      if (!patch.closed_at) updates.closed_at = new Date().toISOString()
    }
    if (patch.status === 'verified') {
      if (!patch.verified_at) updates.verified_at = new Date().toISOString()
    }

    setActions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
    await supabase.from('corrective_actions').update(updates).eq('id', id)
  }, [])

  const getByClause = useCallback((elementCode: string) =>
    actions.find(a => a.element_code === elementCode && a.status !== 'verified'),
    [actions]
  )

  const stats = {
    open: actions.filter(a => a.status === 'open').length,
    in_progress: actions.filter(a => a.status === 'in_progress').length,
    overdue: actions.filter(a =>
      a.due_date && new Date(a.due_date) < new Date() && a.status !== 'closed' && a.status !== 'verified'
    ).length,
    closed: actions.filter(a => a.status === 'closed' || a.status === 'verified').length,
  }

  return { actions, loading, createAction, createManualAction, updateAction, getByClause, stats, reload: load }
}
