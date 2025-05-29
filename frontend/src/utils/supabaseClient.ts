import { createClient } from '@supabase/supabase-js';
import { mode, Mode } from 'app';

// Get Supabase URL and key based on current environment
// In production, this would fetch from environment variables or global constants
// For now, we keep configuration consistent between environments
const supabaseUrl = 'https://gckupofshryragnbhddy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdja3Vwb2ZzaHJ5cmFnbmJoZGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NTMyMzcsImV4cCI6MjA2MDUyOTIzN30.0ZmjuwvM7PAYgNSOy1gQ-ri-g5Xf4OiFAGWHnbrS96s';

// Basic check if the values were retrieved
if (!supabaseUrl) {
  throw new Error("Supabase URL is missing. Check configuration.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is missing. Check configuration.");
}

// Log the environment for debugging
console.log(`[Supabase] Initializing client in ${mode} environment`);

// Create and export the Supabase client
// Explicitly setting the schema is good practice.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
        schema: 'public', // Use 'public' unless you have a different schema
    },
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true, // Default: false. Set to true to detect session from URL fragment
    },
});

console.log("Supabase client initialized successfully.");
