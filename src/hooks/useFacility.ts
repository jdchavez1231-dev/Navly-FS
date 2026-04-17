import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

type Facility = {
  id: string
  name: string
  audit_date: string | null
  subscription_status: string
}

export function useFacility() {
  const { user } = useAuth()
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [facility, setFacility] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    supabase
      .from('users')
      .select('facility_id, facilities(id, name, audit_date, subscription_status)')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const f = data?.facilities
        const fac = Array.isArray(f) ? f[0] : f
        setFacilityId(fac?.id ?? null)
        setFacility(fac ?? null)
        setLoading(false)
      })
  }, [user])

  return { facilityId, facility, loading }
}
