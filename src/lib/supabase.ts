import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qnpztvrljsqxlgllvxmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucHp0dnJsanNxeGxnbGx2eG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2ODgzOTIsImV4cCI6MjA1NzI2NDM5Mn0.nT5mnUuwyZLIp9srEQggbNkjecfBfNGpzbxmCkJl2ns';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);