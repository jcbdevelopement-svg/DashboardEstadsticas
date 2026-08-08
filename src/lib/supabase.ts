import { createClient } from '@supabase/supabase-js'

const defaultUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fmrcitmlhhwqbrsrsxfm.supabase.co'
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtcGNpdG1saGh3cWJyc3JzeGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTA0MDAwMH0.placeholder'

const url = (typeof window !== 'undefined' && localStorage.getItem('jcb_supabase_url')) || defaultUrl
const key = (typeof window !== 'undefined' && localStorage.getItem('jcb_supabase_key')) || defaultKey

export const supabase = createClient(url, key)
