import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  document.body.innerHTML = '<div style="font-family:sans-serif;padding:2rem;color:red"><b>Configuration error:</b> VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in Vercel environment variables.</div>'
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(url, key)
