-- Create table to track label batch exports
CREATE TABLE IF NOT EXISTS public.label_batch_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  export_name TEXT NOT NULL,
  export_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivery_date DATE,
  delivery_round TEXT,
  paper_size TEXT NOT NULL DEFAULT 'A4',
  labels_per_page INTEGER NOT NULL DEFAULT 6,
  order_count INTEGER NOT NULL,
  order_ids UUID[] NOT NULL,
  exported_by UUID NOT NULL,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.label_batch_exports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only staff can view label exports"
  ON public.label_batch_exports
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL) AND is_authorized_staff()
  );

CREATE POLICY "Only staff can create label exports"
  ON public.label_batch_exports
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL) AND is_authorized_staff()
  );

CREATE POLICY "Only admin can delete label exports"
  ON public.label_batch_exports
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Create index for faster queries
CREATE INDEX idx_label_exports_delivery_date ON public.label_batch_exports(delivery_date);
CREATE INDEX idx_label_exports_delivery_round ON public.label_batch_exports(delivery_round);
CREATE INDEX idx_label_exports_exported_by ON public.label_batch_exports(exported_by);