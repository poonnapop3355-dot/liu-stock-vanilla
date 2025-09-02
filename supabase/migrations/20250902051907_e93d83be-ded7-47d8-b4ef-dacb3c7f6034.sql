-- Let's completely drop and recreate the view to fix the Security Definer issue
DROP VIEW IF EXISTS public.customer_secure_view CASCADE;

-- Create a simple view without any complex functions that might cause issues
CREATE VIEW public.customer_secure_view AS
SELECT 
  c.id,
  c.name,
  c.customer_contact,
  c.phone,
  c.address,
  c.notes,
  c.created_at,
  c.updated_at
FROM public.customers c
WHERE 
  auth.uid() IS NOT NULL AND 
  (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'staff'::app_role)
  );