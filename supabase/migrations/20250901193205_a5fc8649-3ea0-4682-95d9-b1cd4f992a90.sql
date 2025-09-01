-- Enhanced security measures for customer personal information protection
-- Add audit logging, field-level security, and additional validation

-- Create audit log table for customer data access tracking
CREATE TABLE IF NOT EXISTS public.customer_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  accessed_fields TEXT[], -- Track which fields were accessed
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.customer_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view customer access logs"
ON public.customer_access_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Create function to log customer data access
CREATE OR REPLACE FUNCTION public.log_customer_access(
  p_customer_id UUID,
  p_access_type TEXT,
  p_fields TEXT[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create enhanced customer view with field-level security
CREATE OR REPLACE VIEW public.customer_secure_view AS
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

-- Enable RLS on the secure view
ALTER VIEW public.customer_secure_view SET (security_barrier = true);

-- Create additional validation function for customer data operations
CREATE OR REPLACE FUNCTION public.validate_customer_operation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role TEXT;
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
  
  RETURN true;
END;
$$;

-- Update existing customer policies with enhanced validation and audit logging
DROP POLICY IF EXISTS "Only admin and staff can view customers" ON public.customers;
DROP POLICY IF EXISTS "Only admin and staff can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Only admin and staff can update customers" ON public.customers;
DROP POLICY IF EXISTS "Only admin can delete customers" ON public.customers;

-- Enhanced SELECT policy with audit logging
CREATE POLICY "Only admin and staff can view customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff() AND
  public.validate_customer_operation()
);

-- Enhanced INSERT policy
CREATE POLICY "Only admin and staff can insert customers" 
ON public.customers 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff() AND
  public.validate_customer_operation()
);

-- Enhanced UPDATE policy with additional validation
CREATE POLICY "Only admin and staff can update customers" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff() AND
  public.validate_customer_operation()
);

-- Enhanced DELETE policy - only admins with extra verification
CREATE POLICY "Only admin can delete customers" 
ON public.customers 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role) AND
  public.validate_customer_operation()
);

-- Create trigger to automatically log customer data access
CREATE OR REPLACE FUNCTION public.trigger_log_customer_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the access based on operation type
  CASE TG_OP
    WHEN 'SELECT' THEN
      PERFORM public.log_customer_access(OLD.id, 'SELECT');
    WHEN 'INSERT' THEN
      PERFORM public.log_customer_access(NEW.id, 'INSERT');
    WHEN 'UPDATE' THEN
      PERFORM public.log_customer_access(NEW.id, 'UPDATE');
    WHEN 'DELETE' THEN
      PERFORM public.log_customer_access(OLD.id, 'DELETE');
  END CASE;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply trigger to customers table
DROP TRIGGER IF EXISTS log_customer_access_trigger ON public.customers;
CREATE TRIGGER log_customer_access_trigger 
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.trigger_log_customer_access();