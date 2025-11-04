-- Add unique constraint to customer_contact for import functionality
-- This allows upsert operations to work when importing customers from orders

ALTER TABLE public.customers 
ADD CONSTRAINT customers_customer_contact_key UNIQUE (customer_contact);