-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table for CRM
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_contact TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_code TEXT NOT NULL UNIQUE,
  customer_contact TEXT NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  delivery_round TEXT,
  tracking_number TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  remarks TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view all products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can manage products" 
ON public.products 
FOR ALL 
TO authenticated
USING (true);

CREATE POLICY "Users can view all customers" 
ON public.customers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can manage customers" 
ON public.customers 
FOR ALL 
TO authenticated
USING (true);

CREATE POLICY "Users can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can manage orders" 
ON public.orders 
FOR ALL 
TO authenticated
USING (true);

CREATE POLICY "Users can view all order items" 
ON public.order_items 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can manage order items" 
ON public.order_items 
FOR ALL 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_orders_code ON public.orders(order_code);
CREATE INDEX idx_orders_date ON public.orders(order_date);
CREATE INDEX idx_orders_delivery_round ON public.orders(delivery_round);
CREATE INDEX idx_customers_contact ON public.customers(customer_contact);

-- Insert sample products
INSERT INTO public.products (sku, name, price, stock_quantity, category, description) VALUES
('BOOK001', 'หนังสือ A', 110.00, 50, 'Books', 'หนังสือเรียนภาษาไทย'),
('BOOK002', 'หนังสือ B', 150.00, 30, 'Books', 'หนังสือเรียนคณิตศาสตร์'),
('BOOK003', 'หนังสือ C', 200.00, 25, 'Books', 'หนังสือเรียนวิทยาศาสตร์'),
('PEN001', 'ปากกา A', 25.00, 100, 'Stationery', 'ปากกาลูกลื่นสีน้ำเงิน'),
('PEN002', 'ปากกา B', 35.00, 80, 'Stationery', 'ปากกาลูกลื่นสีดำ'),
('NOTE001', 'สมุดโน๊ต A', 45.00, 60, 'Stationery', 'สมุดโน๊ต 100 หน้า');