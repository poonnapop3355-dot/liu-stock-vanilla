import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Upload, Edit, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_code: string;
  customer_contact: string;
  order_date: string;
  delivery_date: string;
  delivery_round?: string;
  tracking_number?: string;
  total_amount: number;
  remarks?: string;
  status: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  total_price: number;
}

const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editDeliveryRound, setEditDeliveryRound] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    }
  };

  const fetchOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      
      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch order items",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.tracking_number && order.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditTrackingNumber(order.tracking_number || "");
    setEditDeliveryRound(order.delivery_round || "");
    setIsEditDialogOpen(true);
  };

  const updateOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: editTrackingNumber,
          delivery_round: editDeliveryRound
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order updated successfully"
      });

      setIsEditDialogOpen(false);
      fetchOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Order Code', 'Customer Contact', 'Order Date', 'Delivery Date', 'Total Amount', 'Status', 'Tracking Number', 'Delivery Round', 'Remarks'].join(','),
      ...filteredOrders.map(order => [
        order.order_code,
        `"${order.customer_contact.replace(/"/g, '""')}"`,
        order.order_date,
        order.delivery_date,
        order.total_amount,
        order.status,
        order.tracking_number || '',
        order.delivery_round || '',
        `"${(order.remarks || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',');
      
      toast({
        title: "CSV Import",
        description: `Found ${lines.length - 1} rows. Import functionality would be implemented here.`
      });
    };
    reader.readAsText(file);
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      processing: "default",
      shipped: "secondary",
      delivered: "default",
      cancelled: "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={importFromCSV}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order code, customer, or tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_code}</TableCell>
                  <TableCell>{order.customer_contact.split('\n')[0]}</TableCell>
                  <TableCell>{order.order_date}</TableCell>
                  <TableCell>{order.delivery_date}</TableCell>
                  <TableCell>฿{order.total_amount}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{order.tracking_number || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewOrder(order)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditOrder(order)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_code}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Contact</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    <pre className="whitespace-pre-wrap text-sm">{selectedOrder.customer_contact}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label>Order Date</Label>
                    <p>{selectedOrder.order_date}</p>
                  </div>
                  <div>
                    <Label>Delivery Date</Label>
                    <p>{selectedOrder.delivery_date}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div>{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Order Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>฿{item.price}</TableCell>
                        <TableCell>฿{item.total_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold">Total: ฿{selectedOrder.total_amount}</div>
              </div>

              {selectedOrder.remarks && (
                <div>
                  <Label>Remarks</Label>
                  <p className="mt-1">{selectedOrder.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order - {selectedOrder?.order_code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tracking">Tracking Number</Label>
              <Input
                id="tracking"
                value={editTrackingNumber}
                onChange={(e) => setEditTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label htmlFor="delivery-round">Delivery Round</Label>
              <Input
                id="delivery-round"
                value={editDeliveryRound}
                onChange={(e) => setEditDeliveryRound(e.target.value)}
                placeholder="Enter delivery round"
              />
            </div>
            <Button onClick={updateOrder} className="w-full">
              Update Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;