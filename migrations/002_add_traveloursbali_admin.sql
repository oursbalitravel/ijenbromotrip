-- Migration: add admin row for traveloursbali@gmail.com
-- This migration inserts an admin record by looking up the user's UUID in auth.users.
-- If the auth user doesn't exist, the migration will do nothing and raise a NOTICE when run via psql.

BEGIN;

-- Notify if auth user is missing (psql NOTICE only)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'traveloursbali@gmail.com') THEN
    RAISE NOTICE 'auth.users row for traveloursbali@gmail.com not found. Create the auth user first.';
  END IF;
END$$;

-- Insert admin row only if auth user exists and no admin with that email exists yet
INSERT INTO public.admins (user_id, email, role)
SELECT u.id, u.email, 'admin'
FROM auth.users u
WHERE u.email = 'traveloursbali@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.admins a WHERE a.email = u.email);

COMMIT;

-- After applying: verify with
-- SELECT * FROM public.admins WHERE email = 'traveloursbali@gmail.com';
