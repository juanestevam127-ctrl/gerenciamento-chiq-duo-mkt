import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase config check:', {
    url: supabaseUrl ? 'Defined' : 'UNDEFINED',
    key: supabaseAnonKey ? 'Defined' : 'UNDEFINED',
    bucket: process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'conteudo-chiquinho'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'conteudo-chiquinho';
