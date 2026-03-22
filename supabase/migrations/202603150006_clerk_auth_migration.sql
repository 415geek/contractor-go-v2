-- Phase 6: Migrate user identity from Supabase auth.users to Clerk user IDs.
--
-- Background: The app migrated from Supabase phone-OTP auth to Clerk. Clerk user IDs
-- are text strings (e.g. "user_xxxxx"), not UUIDs, and do not have rows in auth.users.
-- This migration:
--   1. Removes the FK constraint public.users.id -> auth.users.id
--   2. Changes public.users.id (and all referencing user_id columns) from uuid to text
--   3. Recreates FK constraints as text
--   4. Updates all RLS policies to use (auth.jwt() ->> 'sub') instead of auth.uid()
--
-- The edge function get-user.ts upserts a row into public.users on first request using
-- the Clerk user ID as the primary key.

-- ============================================================
-- STEP 1: Drop all dependent FK constraints before altering types
-- ============================================================

-- virtual_numbers
ALTER TABLE public.virtual_numbers DROP CONSTRAINT IF EXISTS virtual_numbers_user_id_fkey;

-- conversations
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;

-- house_estimates
ALTER TABLE public.house_estimates DROP CONSTRAINT IF EXISTS house_estimates_user_id_fkey;

-- permit_searches
ALTER TABLE public.permit_searches DROP CONSTRAINT IF EXISTS permit_searches_user_id_fkey;

-- projects
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- user_permissions (PK is also user_id, so drop PK first)
ALTER TABLE public.user_permissions DROP CONSTRAINT IF EXISTS user_permissions_pkey CASCADE;

-- users PK (which implicitly references auth.users via the original definition)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;

-- ============================================================
-- STEP 2: Change public.users.id from uuid to text
-- ============================================================

ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.users ADD PRIMARY KEY (id);

-- ============================================================
-- STEP 3: Change user_id columns in all dependent tables to text
-- ============================================================

ALTER TABLE public.virtual_numbers ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.virtual_numbers
  ADD CONSTRAINT virtual_numbers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversations ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.house_estimates ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.house_estimates
  ADD CONSTRAINT house_estimates_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.permit_searches ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.permit_searches
  ADD CONSTRAINT permit_searches_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.projects ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_permissions ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.user_permissions ADD PRIMARY KEY (user_id);
ALTER TABLE public.user_permissions
  ADD CONSTRAINT user_permissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================================
-- STEP 4: Recreate all RLS policies using (auth.jwt() ->> 'sub')
--         instead of auth.uid() so Clerk JWT sub claims work.
-- ============================================================

-- public.users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
ON public.users FOR SELECT
USING ((auth.jwt() ->> 'sub') = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
USING ((auth.jwt() ->> 'sub') = id)
WITH CHECK ((auth.jwt() ->> 'sub') = id);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own"
ON public.users FOR INSERT
WITH CHECK ((auth.jwt() ->> 'sub') = id);

-- public.virtual_numbers
DROP POLICY IF EXISTS "virtual_numbers_manage_own" ON public.virtual_numbers;
CREATE POLICY "virtual_numbers_manage_own"
ON public.virtual_numbers FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- public.conversations
DROP POLICY IF EXISTS "conversations_manage_own" ON public.conversations;
CREATE POLICY "conversations_manage_own"
ON public.conversations FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- public.messages (accessed via conversations owned by the user)
DROP POLICY IF EXISTS "messages_manage_own" ON public.messages;
CREATE POLICY "messages_manage_own"
ON public.messages FOR ALL
USING (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = (auth.jwt() ->> 'sub')
  )
)
WITH CHECK (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = (auth.jwt() ->> 'sub')
  )
);

-- public.projects
DROP POLICY IF EXISTS "projects_manage_own" ON public.projects;
CREATE POLICY "projects_manage_own"
ON public.projects FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- public.house_estimates
DROP POLICY IF EXISTS "house_estimates_manage_own" ON public.house_estimates;
CREATE POLICY "house_estimates_manage_own"
ON public.house_estimates FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- public.permit_searches
DROP POLICY IF EXISTS "permit_searches_manage_own" ON public.permit_searches;
CREATE POLICY "permit_searches_manage_own"
ON public.permit_searches FOR ALL
USING ((auth.jwt() ->> 'sub') = user_id)
WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- public.user_permissions
DROP POLICY IF EXISTS "user_permissions_select_own" ON public.user_permissions;
CREATE POLICY "user_permissions_select_own"
ON public.user_permissions FOR SELECT
USING ((auth.jwt() ->> 'sub') = user_id);
