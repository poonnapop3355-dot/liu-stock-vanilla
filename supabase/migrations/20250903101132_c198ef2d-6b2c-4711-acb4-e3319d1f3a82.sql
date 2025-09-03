-- Insert admin email into user_roles table
-- Note: This assumes the user with this email already exists in auth.users
-- If the user doesn't exist, they will need to sign up first with this email

-- Create a function to add admin role by email
CREATE OR REPLACE FUNCTION public.add_admin_by_email(admin_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Get user ID from auth.users by email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = admin_email;
  
  -- If user exists, add admin role
  IF user_uuid IS NOT NULL THEN
    -- Insert admin role (will do nothing if already exists due to unique constraint)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_uuid, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role granted to user: %', admin_email;
  ELSE
    RAISE NOTICE 'User with email % not found. User must sign up first.', admin_email;
  END IF;
END;
$$;

-- Add the specific admin email
SELECT public.add_admin_by_email('poonnapop3355@gmail.com');