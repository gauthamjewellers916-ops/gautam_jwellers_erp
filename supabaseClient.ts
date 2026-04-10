import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Hardcoded Supabase credentials as requested by the user
const supabaseUrl = 'https://xjoznzhtvojvksvwrjdb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqb3puemh0dm9qdmtzdndyamRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTA5MzUsImV4cCI6MjA5MDk2NjkzNX0.u2QdjmOMYNX6AYU2x8y7LN7lDR0uteO-JmyzLyMopkI';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to get the client (matching the provided code's import style)
export const createClientHelper = () => supabase;