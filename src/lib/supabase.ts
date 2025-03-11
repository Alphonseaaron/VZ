import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const supabaseUrl = 'https://qnpztvrljsqxlgllvxmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucHp0dnJsanNxeGxnbGx2eG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2ODgzOTIsImV4cCI6MjA1NzI2NDM5Mn0.nT5mnUuwyZLIp9srEQggbNkjecfBfNGpzbxmCkJl2ns';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Initialize Supabase connection
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user.id);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});