-- Safe migration: ensure `public.admins` exists, then insert admin for traveloursbali@gmail.com
-- Idempotent: safe to run multiple times.

BEGIN;

-- Create table if missing
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- Insert admin row only if auth user exists and admin not present
INSERT INTO public.admins (user_id, email, role)
SELECT u.id, u.email, 'admin'
FROM auth.users u
WHERE u.email = 'traveloursbali@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.admins a WHERE a.email = u.email);

COMMIT;

-- Verify:
-- SELECT * FROM public.admins WHERE email = 'traveloursbali@gmail.com';
