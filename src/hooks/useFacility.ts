import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export function useFacility() {
  const { user } = useAuth()
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    supabase
      .from('users')
      .select('facility_id')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setFacilityId(data?.facility_id ?? null)
        setLoading(false)
      })
  }, [user])

  return { facilityId, loading }
}
