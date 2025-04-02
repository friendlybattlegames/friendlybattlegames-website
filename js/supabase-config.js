// js/supabase-config.js

// Supabase configuration
const supabaseUrl = 'https://gsctedyynsdzfzndsjpa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY3RlZHl5bnNkemZ6bmRzanBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDI4NzYsImV4cCI6MjA1NzgxODg3Nn0.Pqm7x00EwCyfUFlbSJFcVcaNV6lAaLV-q2AldbT3AUo';

// Create a promise that resolves when the Supabase client is ready
const supabasePromise = new Promise((resolve) => {
    if (window.supabase) {
        resolve(window.supabase.createClient(supabaseUrl, supabaseAnonKey));
    } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            resolve(window.supabase.createClient(supabaseUrl, supabaseAnonKey));
        };
        document.head.appendChild(script);
    }
});

// Export the function to get the Supabase client
window.getSupabase = () => supabasePromise;

// Export the Supabase client for modules that need direct access
export const supabase = await supabasePromise;
