-- Fix critical security vulnerability: Implement proper role-based access controls
-- Restrict management operations to authorized staff only

-- PRODUCTS TABLE - Complete staff access control
DROP POLICY IF EXISTS "Users can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view all products" ON public.products;

CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Only staff can insert products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only staff can update products" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin can delete products" 
ON public.products 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- ORDERS TABLE - Complete staff access control
DROP POLICY IF EXISTS "Users can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view all orders" ON public.orders;

CREATE POLICY "Only staff can view orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only staff can insert orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only staff can update orders" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin can delete orders" 
ON public.orders 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- ORDER_ITEMS TABLE - Complete staff access control
DROP POLICY IF EXISTS "Users can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view all order items" ON public.order_items;

CREATE POLICY "Only staff can view order items" 
ON public.order_items 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only staff can insert order items" 
ON public.order_items 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only staff can update order items" 
ON public.order_items 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin can delete order items" 
ON public.order_items 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- BOOKS TABLE - Public read, staff write
DROP POLICY IF EXISTS "Users can manage books" ON public.books;
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;

CREATE POLICY "Anyone can view books" 
ON public.books 
FOR SELECT 
USING (true);

CREATE POLICY "Only staff can insert books" 
ON public.books 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only staff can update books" 
ON public.books 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin can delete books" 
ON public.books 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- BOOK_CATEGORIES TABLE - Public read, staff write
DROP POLICY IF EXISTS "Users can manage book categories" ON public.book_categories;
DROP POLICY IF EXISTS "Anyone can view book categories" ON public.book_categories;

CREATE POLICY "Anyone can view book categories" 
ON public.book_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Only staff can insert book categories" 
ON public.book_categories 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only staff can update book categories" 
ON public.book_categories 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin can delete book categories" 
ON public.book_categories 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- AUTHORS TABLE - Public read, staff write
DROP POLICY IF EXISTS "Users can manage authors" ON public.authors;
DROP POLICY IF EXISTS "Anyone can view authors" ON public.authors;

CREATE POLICY "Anyone can view authors" 
ON public.authors 
FOR SELECT 
USING (true);

CREATE POLICY "Only staff can insert authors" 
ON public.authors 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only staff can update authors" 
ON public.authors 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin can delete authors" 
ON public.authors 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- BOOK_AUTHORS TABLE - Public read, staff write
DROP POLICY IF EXISTS "Users can manage book authors" ON public.book_authors;
DROP POLICY IF EXISTS "Anyone can view book authors" ON public.book_authors;

CREATE POLICY "Anyone can view book authors" 
ON public.book_authors 
FOR SELECT 
USING (true);

CREATE POLICY "Only staff can insert book authors" 
ON public.book_authors 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only staff can update book authors" 
ON public.book_authors 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.is_authorized_staff()
);

CREATE POLICY "Only admin can delete book authors" 
ON public.book_authors 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  public.has_role(auth.uid(), 'admin'::app_role)
);