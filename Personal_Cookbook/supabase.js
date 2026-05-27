import { createClient } from
  '@supabase/supabase-js'

  const supabaseUrl = 'https://jxiqmzsyvleihmwbfrgw.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXFtenN5dmxlaWhtd2Jmcmd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NjAzODksImV4cCI6MjA5NTQzNjM4OX0.VJocP5eEPEgdLNHSo6TKVegGJWPN59WsB1tD-aDKr6s'

  export const supabase = createClient(supabaseUrl, supabaseKey)