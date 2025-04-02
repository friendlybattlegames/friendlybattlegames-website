// Initialize Supabase client
const SUPABASE_URL = 'https://gsctedyynsdzfzndsjpa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY3RlZHl5bnNkemZ6bmRzanBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDI4NzYsImV4cCI6MjA1NzgxODg3Nn0.Pqm7x00EwCyfUFlbSJFcVcaNV6lAaLV-q2AldbT3AUo';

// Create Supabase client
// Ensure the Supabase library is loaded via CDN in your HTML first
// Example: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make client available globally
window.supabaseClient = supabaseClient;
