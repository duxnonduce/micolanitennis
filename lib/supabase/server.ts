import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Client "server" — usa i cookie di sessione, rispetta RLS come l'utente loggato.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chiamato da un Server Component: ignorabile se c'è middleware a refreshare la sessione
          }
        },
      },
    }
  );
}

// Client con service role — bypassa RLS. Solo per operazioni server-side privilegiate
// (invio email dopo insert, job di approvazione, generazione lezioni). MAI esporlo al client.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
