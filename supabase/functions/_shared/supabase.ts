import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4';

function getEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createAdminClient() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAnonClient() {
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getRecentEventCount(
  client: SupabaseClient,
  eventName: string,
  subjectType: string,
  subjectValue: string,
  since: string,
) {
  const { count, error } = await client
    .from('user_analytics')
    .select('id', { count: 'exact', head: true })
    .eq('event_name', eventName)
    .eq('subject_type', subjectType)
    .eq('subject_value', subjectValue)
    .gte('created_at', since);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getLatestEventAt(
  client: SupabaseClient,
  eventName: string,
  subjectType: string,
  subjectValue: string,
) {
  const { data, error } = await client
    .from('user_analytics')
    .select('created_at')
    .eq('event_name', eventName)
    .eq('subject_type', subjectType)
    .eq('subject_value', subjectValue)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.created_at ?? null;
}

export async function trackEvent(
  client: SupabaseClient,
  params: {
    userId?: string;
    eventName: string;
    subjectType: string;
    subjectValue: string;
    payload?: Record<string, unknown>;
  },
) {
  const { error } = await client.from('user_analytics').insert({
    user_id: params.userId ?? null,
    event_name: params.eventName,
    subject_type: params.subjectType,
    subject_value: params.subjectValue,
    payload: params.payload ?? {},
  });

  if (error) {
    throw error;
  }
}
