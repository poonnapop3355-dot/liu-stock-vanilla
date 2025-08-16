import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OrderItem {
  product_id: number;
  name: string;
  quantity: number;
  price: number;
}

interface POSOrder {
  customer_contact: string;
  order_date: string;
  delivery_date: string;
  items: OrderItem[];
  remarks: string;
}

const POSOrderEntry = () => {
  const [order, setOrder] = useState<POSOrder>({
    customer_contact: "",
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    remarks: ""
  });

  const [newItem, setNewItem] = useState({
    product_id: 0,
    name: "",
    quantity: 1,
    price: 0
  });

  const addItem = () => {
    if (!newItem.name || newItem.price <= 0) {
      toast({
        title: "Invalid Item",
        description: "Please enter product name and valid price",
        variant: "destructive"
      });
      return;
    }

    setOrder(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem, product_id: Date.now() }]
    }));

    setNewItem({
      product_id: 0,
      name: "",
      quantity: 1,
      price: 0
    });
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) return;
    
    setOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }));
  };

  const removeItem = (index: number) => {
    setOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const submitOrder = async () => {
    if (!order.customer_contact.trim()) {
      toast({
        title: "Missing Customer Contact",
        description: "Please enter customer contact information",
        variant: "destructive"
      });
      return;
    }

    if (order.items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the order",
        variant: "destructive"
      });
      return;
    }

    try {
      // This would be your actual API call to Supabase
      console.log("Submitting order:", order);
      
      toast({
        title: "Order Created Successfully",
        description: `Order total: ฿${calculateTotal().toFixed(2)}`,
      });

      // Reset form
      setOrder({
        customer_contact: "",
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        remarks: ""
      });
    } catch (error) {
      toast({
        title: "Error Creating Order",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">POS Order Entry</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customer_contact">Customer Contact</Label>
              <Textarea
                id="customer_contact"
                placeholder="Enter customer details:&#10;Name&#10;Phone&#10;Address&#10;Postal Code"
                value={order.customer_contact}
                onChange={(e) => setOrder(prev => ({ ...prev, customer_contact: e.target.value }))}
                className="min-h-[120px] font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order_date">Order Date</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={order.order_date}
                  onChange={(e) => setOrder(prev => ({ ...prev, order_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={order.delivery_date}
                  onChange={(e) => setOrder(prev => ({ ...prev, delivery_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Special instructions (e.g., แพ็คอย่างดี)"
                value={order.remarks}
                onChange={(e) => setOrder(prev => ({ ...prev, remarks: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Add Items */}
        <Card>
          <CardHeader>
            <CardTitle>Add Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="item_name">Product Name</Label>
              <Input
                id="item_name"
                placeholder="e.g., หนังสือ A"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_quantity">Quantity</Label>
                <Input
                  id="item_quantity"
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="item_price">Price (฿)</Label>
                <Input
                  id="item_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <Button onClick={addItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      {order.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      ฿{item.price.toFixed(2)} × {item.quantity} = ฿{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateItemQuantity(index, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateItemQuantity(index, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span>฿{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={submitOrder} className="w-full" size="lg">
            Create Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default POSOrderEntry;