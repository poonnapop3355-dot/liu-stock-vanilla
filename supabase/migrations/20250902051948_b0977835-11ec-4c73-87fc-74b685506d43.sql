-- Remove the problematic view entirely since it may be causing security issues
DROP VIEW IF EXISTS public.customer_secure_view CASCADE;

-- We'll handle data masking in the application layer instead
-- This eliminates the Security Definer view issue