import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Minus, ShoppingCart, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock_quantity: number;
  category: string;
  description?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock_quantity: number;
}

interface OrderData {
  customer_contact: string;
  order_date: string;
  delivery_date: string;
  remarks: string;
}

const EnhancedPOS = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderData, setOrderData] = useState<OrderData>({
    customer_contact: "",
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: new Date().toISOString().split('T')[0],
    remarks: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${product.stock_quantity} items available`,
          variant: "destructive"
        });
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock_quantity === 0) {
        toast({
          title: "Out of Stock",
          description: "This product is out of stock",
          variant: "destructive"
        });
        return;
      }
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock_quantity: product.stock_quantity
      }]);
    }
  };

  const updateCartQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== id));
      return;
    }
    
    const item = cart.find(item => item.id === id);
    if (item && newQuantity > item.stock_quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${item.stock_quantity} items available`,
        variant: "destructive"
      });
      return;
    }
    
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const generateOrderCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `ORD${timestamp}`;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }

    if (!orderData.customer_contact.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter customer contact information",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const orderCode = generateOrderCode();
      const totalAmount = getTotalPrice();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_code: orderCode,
          customer_contact: orderData.customer_contact,
          order_date: orderData.order_date,
          delivery_date: orderData.delivery_date,
          total_amount: totalAmount,
          remarks: orderData.remarks
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items and update stock
      for (const item of cart) {
        // Insert order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            total_price: item.price * item.quantity
          });

        if (itemError) throw itemError;

        // Update product stock
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: item.stock_quantity - item.quantity 
          })
          .eq('id', item.id);

        if (stockError) throw stockError;
      }

      // Extract customer info and save to CRM
      const lines = orderData.customer_contact.split('\n');
      const name = lines[0] || '';
      const phone = lines[1] || '';
      const address = lines.slice(2).join('\n') || '';

      await supabase
        .from('customers')
        .upsert({
          customer_contact: orderData.customer_contact,
          name,
          phone,
          address
        }, {
          onConflict: 'customer_contact'
        });

      toast({
        title: "Order Created",
        description: `Order ${orderCode} has been created successfully`,
      });

      // Reset form
      setCart([]);
      setOrderData({
        customer_contact: "",
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        remarks: ""
      });
      setIsCheckoutOpen(false);
      fetchProducts(); // Refresh products to show updated stock

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">POS System</h1>
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Checkout ({cart.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Checkout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Cart Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span>{item.name}</span>
                        <span>{item.quantity} × ฿{item.price} = ฿{item.quantity * item.price}</span>
                      </div>
                    ))}
                    <hr />
                    <div className="font-bold text-lg">
                      Total: ฿{getTotalPrice()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <div className="space-y-2">
                <Label htmlFor="customer_contact">Customer Contact (Name, Phone, Address)</Label>
                <Textarea
                  id="customer_contact"
                  placeholder="สมชาย รักดี&#10;0812345678&#10;123/45 กรุงเทพฯ 10150"
                  value={orderData.customer_contact}
                  onChange={(e) => setOrderData({...orderData, customer_contact: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_date">Order Date</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={orderData.order_date}
                    onChange={(e) => setOrderData({...orderData, order_date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={orderData.delivery_date}
                    onChange={(e) => setOrderData({...orderData, delivery_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  placeholder="Special instructions..."
                  value={orderData.remarks}
                  onChange={(e) => setOrderData({...orderData, remarks: e.target.value})}
                />
              </div>

              <Button 
                onClick={handleCheckout} 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Complete Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredProducts.map(product => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => addToCart(product)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge variant={product.stock_quantity > 10 ? "default" : product.stock_quantity > 0 ? "destructive" : "secondary"}>
                          {product.stock_quantity} left
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{product.sku}</p>
                      <p className="text-lg font-bold">฿{product.price}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Cart</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">฿{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span>฿{getTotalPrice()}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPOS;