-- Create user roles system for proper access control
-- First, create an enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'customer');

-- Create user_roles table to assign roles to users
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has admin or staff role
CREATE OR REPLACE FUNCTION public.is_authorized_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
$$;

-- Drop existing overly permissive customer policies
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

-- Create secure role-based policies for customers table
CREATE POLICY "Only admin and staff can view customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (public.is_authorized_staff());

CREATE POLICY "Only admin and staff can insert customers" 
ON public.customers 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_authorized_staff());

CREATE POLICY "Only admin and staff can update customers" 
ON public.customers 
FOR UPDATE 
TO authenticated
USING (public.is_authorized_staff());

CREATE POLICY "Only admin can delete customers" 
ON public.customers 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create policies for user_roles table (users can view their own roles, only admins can manage roles)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));