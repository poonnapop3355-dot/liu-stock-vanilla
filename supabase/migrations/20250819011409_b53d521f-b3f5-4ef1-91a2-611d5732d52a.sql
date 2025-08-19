-- Create books table for the bookstore
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  publisher TEXT,
  publication_date DATE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  pages INTEGER,
  language TEXT DEFAULT 'English',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create book_categories table
CREATE TABLE public.book_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create authors table
CREATE TABLE public.authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  biography TEXT,
  birth_date DATE,
  nationality TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create book_authors junction table for many-to-many relationship
CREATE TABLE public.book_authors (
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, author_id)
);

-- Enable RLS on all tables
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_authors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for books
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Users can manage books" ON public.books FOR ALL USING (true);

-- Create RLS policies for book_categories
CREATE POLICY "Anyone can view book categories" ON public.book_categories FOR SELECT USING (true);
CREATE POLICY "Users can manage book categories" ON public.book_categories FOR ALL USING (true);

-- Create RLS policies for authors
CREATE POLICY "Anyone can view authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Users can manage authors" ON public.authors FOR ALL USING (true);

-- Create RLS policies for book_authors
CREATE POLICY "Anyone can view book authors" ON public.book_authors FOR SELECT USING (true);
CREATE POLICY "Users can manage book authors" ON public.book_authors FOR ALL USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample book categories
INSERT INTO public.book_categories (name, description) VALUES
('Fiction', 'Literary works of fiction including novels and short stories'),
('Non-Fiction', 'Factual books including biographies, history, and educational content'),
('Science Fiction', 'Speculative fiction dealing with futuristic concepts'),
('Mystery', 'Books involving puzzles, crimes, or unexplained events'),
('Romance', 'Books focusing on romantic relationships'),
('Biography', 'Life stories of real people'),
('History', 'Books about historical events and periods'),
('Science', 'Books about scientific subjects and discoveries'),
('Technology', 'Books about technology, programming, and digital innovation'),
('Business', 'Books about business, economics, and entrepreneurship');

-- Insert sample authors
INSERT INTO public.authors (name, biography, nationality) VALUES
('J.K. Rowling', 'British author best known for the Harry Potter series', 'British'),
('Stephen King', 'American author of horror, supernatural fiction, and suspense', 'American'),
('Agatha Christie', 'British crime writer, known for her detective novels', 'British'),
('Isaac Asimov', 'Russian-American writer and professor known for science fiction', 'Russian-American'),
('Jane Austen', 'English novelist known for her social commentary', 'English');

-- Insert sample books
INSERT INTO public.books (title, author, isbn, description, price, category, publisher, stock_quantity, language) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'A classic American novel set in the Jazz Age', 12.99, 'Fiction', 'Scribner', 50, 'English'),
('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'A novel about racial injustice in the American South', 14.99, 'Fiction', 'J.B. Lippincott & Co.', 30, 'English'),
('1984', 'George Orwell', '978-0-452-28423-4', 'A dystopian novel about totalitarian control', 13.99, 'Fiction', 'Secker & Warburg', 40, 'English'),
('Pride and Prejudice', 'Jane Austen', '978-0-14-143951-8', 'A romantic novel about Elizabeth Bennet and Mr. Darcy', 11.99, 'Romance', 'T. Egerton', 25, 'English'),
('The Catcher in the Rye', 'J.D. Salinger', '978-0-316-76948-0', 'A coming-of-age story about Holden Caulfield', 13.50, 'Fiction', 'Little, Brown and Company', 35, 'English');