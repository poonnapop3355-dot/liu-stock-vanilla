-- Fix the Security Definer View issue by recreating it as a regular view
DROP VIEW IF EXISTS public.customer_secure_view;

-- Create regular view without SECURITY DEFINER
CREATE VIEW public.customer_secure_view AS
SELECT 
  id,
  name,
  -- Mask sensitive data based on user role
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN customer_contact
    WHEN public.has_role(auth.uid(), 'staff'::app_role) THEN 
      CASE 
        WHEN LENGTH(customer_contact) > 4 THEN 
          LEFT(customer_contact, 2) || REPEAT('*', LENGTH(customer_contact) - 4) || RIGHT(customer_contact, 2)
        ELSE customer_contact
      END
    ELSE '***REDACTED***'
  END as customer_contact,
  -- Phone masking
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN phone
    WHEN public.has_role(auth.uid(), 'staff'::app_role) THEN 
      CASE 
        WHEN phone IS NOT NULL AND LENGTH(phone) > 4 THEN 
          LEFT(phone, 2) || REPEAT('*', LENGTH(phone) - 4) || RIGHT(phone, 2)
        ELSE phone
      END
    ELSE '***REDACTED***'
  END as phone,
  -- Address masking - only show city/state to staff, full address to admin
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::app_role) THEN address
    WHEN public.has_role(auth.uid(), 'staff'::app_role) THEN 
      CASE 
        WHEN address IS NOT NULL THEN 
          REGEXP_REPLACE(address, '^[^,]*,', '***,', 'g')
        ELSE address
      END
    ELSE '***REDACTED***'
  END as address,
  notes,
  created_at,
  updated_at
FROM public.customers
WHERE 
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff();

-- Fix function search paths by ensuring all functions have proper SET search_path
-- Update existing functions that don't have proper search paths set
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.is_authorized_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NULL THEN false
    ELSE (
      public.has_role(auth.uid(), 'admin'::app_role) OR 
      public.has_role(auth.uid(), 'staff'::app_role)
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.log_customer_access(
  p_customer_id UUID DEFAULT NULL,
  p_access_type TEXT DEFAULT 'SELECT',
  p_fields TEXT[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.customer_access_logs (
    user_id,
    customer_id,
    access_type,
    accessed_fields,
    accessed_at
  ) VALUES (
    auth.uid(),
    p_customer_id,
    p_access_type,
    p_fields,
    now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_customer_operation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  access_count INTEGER;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has required role
  IF NOT public.is_authorized_staff() THEN
    RETURN false;
  END IF;
  
  -- Rate limiting: Check if user has made too many requests recently (last 5 minutes)
  SELECT COUNT(*) INTO access_count
  FROM public.customer_access_logs
  WHERE user_id = auth.uid()
    AND accessed_at > (now() - INTERVAL '5 minutes');
  
  -- Limit to 100 customer records per 5 minutes to prevent bulk extraction
  IF access_count > 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Too many customer record accesses in the last 5 minutes.';
  END IF;
  
  -- Log this validation attempt
  PERFORM public.log_customer_access(NULL, 'VALIDATION', NULL);
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;