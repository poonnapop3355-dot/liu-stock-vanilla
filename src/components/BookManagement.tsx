import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Plus, Search, Download, Upload, Book, Eye, BookOpen, Users, Tag } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { bookSchema, authorSchema, categorySchema, formatZodError } from "@/lib/validationSchemas";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  price: number;
  category?: string;
  publisher?: string;
  publication_date?: string;
  stock_quantity: number;
  cover_image_url?: string;
  pages?: number;
  language: string;
  status: string;
  created_at: string;
}

interface Author {
  id: string;
  name: string;
  biography?: string;
  birth_date?: string;
  nationality?: string;
  website?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

const BookManagement = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    price: '',
    category: '',
    publisher: '',
    publication_date: '',
    stock_quantity: '',
    cover_image_url: '',
    pages: '',
    language: 'English',
    status: 'active'
  });

  const [newAuthor, setNewAuthor] = useState({
    name: '',
    biography: '',
    birth_date: new Date(),
    nationality: '',
    website: ''
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [booksResult, authorsResult, categoriesResult] = await Promise.all([
        supabase.from('books').select('*').order('created_at', { ascending: false }),
        supabase.from('authors').select('*').order('name'),
        supabase.from('book_categories').select('*').order('name')
      ]);

      if (booksResult.error) throw booksResult.error;
      if (authorsResult.error) throw authorsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setBooks(booksResult.data || []);
      setAuthors(authorsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    try {
      // Validate input data
      const validationResult = bookSchema.safeParse(newBook);
      
      if (!validationResult.success) {
        toast({
          title: "Validation Error",
          description: formatZodError(validationResult.error),
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.from('books').insert([{
        title: validationResult.data.title,
        author: validationResult.data.author,
        isbn: validationResult.data.isbn || null,
        description: validationResult.data.description || null,
        price: parseFloat(validationResult.data.price),
        category: validationResult.data.category || null,
        publisher: validationResult.data.publisher || null,
        stock_quantity: parseInt(validationResult.data.stock_quantity),
        pages: validationResult.data.pages ? parseInt(validationResult.data.pages) : null,
        language: validationResult.data.language,
        cover_image_url: validationResult.data.cover_image_url || null,
        publication_date: newBook.publication_date || null,
        status: newBook.status
      }]).select();

      if (error) throw error;

      setBooks([data[0], ...books]);
      setNewBook({
        title: '', author: '', isbn: '', description: '', price: '', category: '', 
        publisher: '', publication_date: '', stock_quantity: '', cover_image_url: '', 
        pages: '', language: 'English', status: 'active'
      });
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Book added successfully" });
    } catch (error) {
      console.error('Error adding book:', error);
      toast({ title: "Error", description: "Failed to add book", variant: "destructive" });
    }
  };

  const handleAddAuthor = async () => {
    try {
      // Validate input data
      const validationResult = authorSchema.safeParse(newAuthor);
      
      if (!validationResult.success) {
        toast({
          title: "Validation Error",
          description: formatZodError(validationResult.error),
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.from('authors').insert([{
        name: validationResult.data.name,
        biography: validationResult.data.biography || null,
        nationality: validationResult.data.nationality || null,
        website: validationResult.data.website || null,
        birth_date: newAuthor.birth_date.toISOString().split('T')[0]
      }]).select();

      if (error) throw error;

      setAuthors([...authors, data[0]]);
      setNewAuthor({ name: '', biography: '', birth_date: new Date(), nationality: '', website: '' });
      toast({ title: "Success", description: "Author added successfully" });
    } catch (error) {
      console.error('Error adding author:', error);
      toast({ title: "Error", description: "Failed to add author", variant: "destructive" });
    }
  };

  const handleAddCategory = async () => {
    try {
      // Validate input data
      const validationResult = categorySchema.safeParse(newCategory);
      
      if (!validationResult.success) {
        toast({
          title: "Validation Error",
          description: formatZodError(validationResult.error),
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.from('book_categories').insert([{
        name: validationResult.data.name,
        description: validationResult.data.description || null
      }]).select();

      if (error) throw error;

      setCategories([...categories, data[0]]);
      setNewCategory({ name: '', description: '' });
      toast({ title: "Success", description: "Category added successfully" });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;

      setBooks(books.filter(book => book.id !== id));
      toast({ title: "Success", description: "Book deleted successfully" });
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({ title: "Error", description: "Failed to delete book", variant: "destructive" });
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.isbn?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-yellow-500';
      case 'discontinued': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookstore Management</h1>
          <p className="text-muted-foreground">Manage your book inventory, authors, and categories</p>
        </div>
      </div>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="authors">Authors</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search books by title, author, or ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>Add a new book to your inventory</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newBook.title}
                        onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                        placeholder="Book title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="author">Author</Label>
                      <Input
                        id="author"
                        value={newBook.author}
                        onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                        placeholder="Author name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        value={newBook.isbn}
                        onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                        placeholder="978-0-123456-78-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={newBook.price}
                        onChange={(e) => setNewBook({...newBook, price: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newBook.description}
                      onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                      placeholder="Book description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newBook.category} onValueChange={(value) => setNewBook({...newBook, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={newBook.stock_quantity}
                        onChange={(e) => setNewBook({...newBook, stock_quantity: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddBook}>Add Book</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Books Inventory ({filteredBooks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        {book.category && (
                          <Badge variant="secondary">{book.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>฿{book.price}</TableCell>
                      <TableCell>
                        <Badge variant={book.stock_quantity > 10 ? "default" : book.stock_quantity > 0 ? "secondary" : "destructive"}>
                          {book.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(book.status)}>
                          {book.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteBook(book.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authors" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Authors</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Author
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Author</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="authorName">Name</Label>
                    <Input
                      id="authorName"
                      value={newAuthor.name}
                      onChange={(e) => setNewAuthor({...newAuthor, name: e.target.value})}
                      placeholder="Author name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="biography">Biography</Label>
                    <Textarea
                      id="biography"
                      value={newAuthor.biography}
                      onChange={(e) => setNewAuthor({...newAuthor, biography: e.target.value})}
                      placeholder="Author biography"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nationality">Nationality</Label>
                      <Input
                        id="nationality"
                        value={newAuthor.nationality}
                        onChange={(e) => setNewAuthor({...newAuthor, nationality: e.target.value})}
                        placeholder="Nationality"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthDate">Birth Date</Label>
                      <DatePicker
                        date={newAuthor.birth_date}
                        onDateChange={(date) => setNewAuthor({...newAuthor, birth_date: date || new Date()})}
                        placeholder="Select birth date"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddAuthor}>Add Author</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Authors ({authors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Birth Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authors.map((author) => (
                    <TableRow key={author.id}>
                      <TableCell className="font-medium">{author.name}</TableCell>
                      <TableCell>{author.nationality || 'N/A'}</TableCell>
                      <TableCell>{author.birth_date || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Categories</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="categoryName">Name</Label>
                    <Input
                      id="categoryName"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      placeholder="Category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryDescription">Description</Label>
                    <Textarea
                      id="categoryDescription"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                      placeholder="Category description"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleAddCategory}>Add Category</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Categories ({categories.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookManagement;