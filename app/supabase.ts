import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  // Fail fast with a clear error instead of cryptic runtime issues.
  throw new Error(
    [
      'Supabase env vars missing.',
      `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl ? 'set' : 'missing'}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey ? 'set' : 'missing'}`,
    ].join(' ')
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)