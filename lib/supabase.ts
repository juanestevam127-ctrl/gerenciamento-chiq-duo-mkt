import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase config check:', {
    url: supabaseUrl ? 'Defined' : 'UNDEFINED',
    key: supabaseAnonKey ? 'Defined' : 'UNDEFINED',
    bucket: process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'conteudo-chiquinho'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
        fetch: (url, options) => {
            console.log('[SUPABASE FETCH IN NEXT.JS]', url);
            return fetch(url, { ...options, cache: 'no-store' });
        }
    }
});

export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'conteudo-chiquinho';
