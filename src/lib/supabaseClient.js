import { createClient } from '@supabase/supabase-js'

// Ces deux valeurs viennent de ton projet Supabase :
// Project Settings > API > Project URL / anon public key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Configuration Supabase manquante : vérifie ton fichier .env (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY)"
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
