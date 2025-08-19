import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Plus, Minus, ShoppingCart, CreditCard, DollarSign, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  price: number;
  category?: string;
  stock_quantity: number;
  status: string;
}

interface CartItem extends Book {
  quantity: number;
  subtotal: number;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  customer_contact: string;
  address?: string;
}

const BookstorePOS = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerContact, setCustomerContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [booksResult, customersResult] = await Promise.all([
        supabase.from('books').select('*').eq('status', 'active').gt('stock_quantity', 0),
        supabase.from('customers').select('*').order('name')
      ]);

      if (booksResult.error) throw booksResult.error;
      if (customersResult.error) throw customersResult.error;

      setBooks(booksResult.data || []);
      setCustomers(customersResult.data || []);
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

  const addToCart = (book: Book) => {
    const existingItem = cart.find(item => item.id === book.id);
    
    if (existingItem) {
      if (existingItem.quantity >= book.stock_quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${book.stock_quantity} copies available`,
          variant: "destructive",
        });
        return;
      }
      updateCartQuantity(book.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        ...book,
        quantity: 1,
        subtotal: book.price
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartQuantity = (bookId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(bookId);
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (newQuantity > book.stock_quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${book.stock_quantity} copies available`,
        variant: "destructive",
      });
      return;
    }

    setCart(cart.map(item => 
      item.id === bookId 
        ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity }
        : item
    ));
  };

  const removeFromCart = (bookId: string) => {
    setCart(cart.filter(item => item.id !== bookId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer('');
    setCustomerContact('');
    setDiscount(0);
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = (subtotal * discount) / 100;
    return subtotal - discountAmount;
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const processOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing order",
        variant: "destructive",
      });
      return;
    }

    if (!customerContact) {
      toast({
        title: "Customer Required",
        description: "Please select a customer or enter contact information",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderCode = `ORD-${Date.now()}`;
      const totalAmount = calculateTotal();

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_code: orderCode,
          customer_contact: customerContact,
          order_date: new Date().toISOString().split('T')[0],
          total_amount: totalAmount,
          status: 'completed',
          remarks: `Payment method: ${paymentMethod}${discount > 0 ? `, Discount: ${discount}%` : ''}`
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.title,
        quantity: item.quantity,
        price: item.price,
        total_price: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update stock quantities
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('books')
          .update({ stock_quantity: item.stock_quantity - item.quantity })
          .eq('id', item.id);

        if (stockError) throw stockError;
      }

      // Refresh books data
      await fetchData();

      clearCart();
      toast({
        title: "Order Completed",
        description: `Order ${orderCode} processed successfully - Total: $${totalAmount.toFixed(2)}`,
      });

    } catch (error) {
      console.error('Error processing order:', error);
      toast({
        title: "Error",
        description: "Failed to process order",
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bookstore POS</h1>
          <p className="text-muted-foreground">Point of Sale System</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Cart Items: {cart.length}</p>
          <p className="text-lg font-bold">Total: ${calculateTotal().toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search and List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Book Inventory</CardTitle>
              <CardDescription>Search and add books to cart</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search books by title, author, or ISBN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooks.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{book.title}</p>
                            <p className="text-sm text-muted-foreground">{book.author}</p>
                            {book.category && (
                              <Badge variant="secondary" className="text-xs">
                                {book.category}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>${book.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={book.stock_quantity > 10 ? "default" : "secondary"}>
                            {book.stock_quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => addToCart(book)}
                            disabled={book.stock_quantity === 0}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Checkout */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({discount}%):</span>
                        <span>-${((calculateSubtotal() * discount) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base">
                      <span>Total:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer & Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select value={selectedCustomer} onValueChange={(value) => {
                  setSelectedCustomer(value);
                  const customer = customers.find(c => c.id === value);
                  if (customer) {
                    setCustomerContact(customer.customer_contact);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.customer_contact}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contact">Customer Contact</Label>
                <Input
                  id="contact"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="Phone or email"
                />
              </div>

              <div>
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="payment">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={processOrder} 
                  className="flex-1"
                  disabled={cart.length === 0}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Process Order
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookstorePOS;