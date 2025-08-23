-- Fix security vulnerability: Strengthen authentication verification in RLS functions
-- Ensure proper authentication checks before role validation

-- Update has_role function to explicitly check authentication
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Explicitly check if user is authenticated and user_id is not null
  SELECT CASE 
    WHEN _user_id IS NULL THEN false
    WHEN _user_id != auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
  END
$$;

-- Update is_authorized_staff function with explicit authentication check
CREATE OR REPLACE FUNCTION public.is_authorized_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE (
      public.has_role(auth.uid(), 'admin'::app_role) OR 
      public.has_role(auth.uid(), 'staff'::app_role)
    )
  END
$$;

-- Add additional security function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Update customer RLS policies to include explicit authentication checks
DROP POLICY IF EXISTS "Only admin and staff can view customers" ON public.customers;
DROP POLICY IF EXISTS "Only admin and staff can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Only admin and staff can update customers" ON public.customers;
DROP POLICY IF EXISTS "Only admin can delete customers" ON public.customers;

-- Create enhanced policies with double authentication verification
CREATE POLICY "Only admin and staff can view customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin and staff can insert customers" 
ON public.customers 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin and staff can update customers" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin can delete customers" 
ON public.customers 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);