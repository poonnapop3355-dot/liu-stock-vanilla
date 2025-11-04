-- Fix CRM access by removing log insertion from SELECT policy
-- The validate_customer_operation function was trying to INSERT logs during SELECT queries
-- which causes "read-only transaction" errors

DROP POLICY IF EXISTS "Only admin and staff can view customers" ON public.customers;

CREATE POLICY "Only admin and staff can view customers"
ON public.customers
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_authorized_staff()
);

-- Update other policies to remove validate_customer_operation from SELECT-like operations
DROP POLICY IF EXISTS "Only admin and staff can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Only admin and staff can update customers" ON public.customers;
DROP POLICY IF EXISTS "Only admin can delete customers" ON public.customers;

CREATE POLICY "Only admin and staff can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND is_authorized_staff()
);

CREATE POLICY "Only admin and staff can update customers"
ON public.customers
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND is_authorized_staff()
);

CREATE POLICY "Only admin can delete customers"
ON public.customers
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);