import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Upload, Edit, Eye, FileUp } from "lucide-react";
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

interface PartialOrder {
  id: string;
  order_code: string;
  customer_contact: string;
  tracking_number: string | null;
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
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<Array<{
    orderId: string;
    orderCode: string;
    customerContact: string;
    phone: string;
    tracking: string;
  }>>([]);
  const [unmatchedEntries, setUnmatchedEntries] = useState<Array<{
    phone: string;
    tracking: string;
  }>>([]);
  const [manualMatchSearch, setManualMatchSearch] = useState<{[key: string]: string}>({});
  const [manualMatchResults, setManualMatchResults] = useState<{[key: string]: PartialOrder[]}>({});
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

  const importTrackingFromPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "PDF Import",
        description: "Processing shipping manifest PDF...",
      });

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          
          // Extract tracking numbers and phone numbers using regex
          const phonePattern = /0\d{9}/g;
          const trackingPattern = /([A-Z0-9]{10,20})/g;
          
          // Parse line by line to match phone with tracking
          const lines = text.split('\n');
          const updates: { phone: string; tracking: string }[] = [];
          
          for (const line of lines) {
            const phones = line.match(phonePattern);
            const trackings = line.match(trackingPattern);
            
            if (phones && trackings) {
              updates.push({
                phone: phones[0],
                tracking: trackings[trackings.length - 1]
              });
            }
          }

          if (updates.length === 0) {
            toast({
              title: "No data found",
              description: "Could not extract tracking numbers from PDF. Please check the format.",
              variant: "destructive"
            });
            return;
          }

          // Match orders and prepare preview
          const previewMatches: Array<{
            orderId: string;
            orderCode: string;
            customerContact: string;
            phone: string;
            tracking: string;
          }> = [];
          
          const unmatched: Array<{
            phone: string;
            tracking: string;
          }> = [];

          for (const update of updates) {
            const { data: matchingOrders, error } = await supabase
              .from('orders')
              .select('id, order_code, customer_contact, tracking_number')
              .ilike('customer_contact', `%${update.phone}%`)
              .is('tracking_number', null);

            if (error) throw error;

            if (matchingOrders && matchingOrders.length > 0) {
              previewMatches.push({
                orderId: matchingOrders[0].id,
                orderCode: matchingOrders[0].order_code,
                customerContact: matchingOrders[0].customer_contact,
                phone: update.phone,
                tracking: update.tracking
              });
            } else {
              unmatched.push({
                phone: update.phone,
                tracking: update.tracking
              });
            }
          }

          if (previewMatches.length === 0 && unmatched.length > 0) {
            toast({
              title: "No matches found",
              description: `${unmatched.length} phone numbers in the PDF don't match any orders without tracking numbers.`,
              variant: "destructive"
            });
            setUnmatchedEntries(unmatched);
            setIsImportPreviewOpen(true);
            return;
          }

          // Show preview dialog
          setImportPreviewData(previewMatches);
          setUnmatchedEntries(unmatched);
          setIsImportPreviewOpen(true);

        } catch (error) {
          console.error('Parse error:', error);
          toast({
            title: "Error",
            description: "Failed to parse PDF file",
            variant: "destructive"
          });
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to import tracking numbers",
        variant: "destructive"
      });
    }
  };

  const confirmImport = async () => {
    try {
      let successCount = 0;

      for (const match of importPreviewData) {
        const { error } = await supabase
          .from('orders')
          .update({ tracking_number: match.tracking })
          .eq('id', match.orderId);

        if (!error) {
          successCount++;
        }
      }

      await fetchOrders();
      setIsImportPreviewOpen(false);
      setImportPreviewData([]);
      setUnmatchedEntries([]);
      setManualMatchSearch({});
      setManualMatchResults({});

      toast({
        title: "Import Complete",
        description: `Successfully updated ${successCount} orders with tracking numbers.`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to update orders",
        variant: "destructive"
      });
    }
  };

  const searchOrdersForManualMatch = async (searchTerm: string, entryKey: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setManualMatchResults({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_code, customer_contact, tracking_number')
        .is('tracking_number', null)
        .or(`order_code.ilike.%${searchTerm}%,customer_contact.ilike.%${searchTerm}%`)
        .limit(5);

      if (error) throw error;

      setManualMatchResults({
        ...manualMatchResults,
        [entryKey]: data || []
      });
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const addManualMatch = (entry: {phone: string; tracking: string}, order: PartialOrder) => {
    // Add to matched data
    setImportPreviewData([
      ...importPreviewData,
      {
        orderId: order.id,
        orderCode: order.order_code,
        customerContact: order.customer_contact,
        phone: entry.phone,
        tracking: entry.tracking
      }
    ]);

    // Remove from unmatched
    setUnmatchedEntries(unmatchedEntries.filter(e => e.phone !== entry.phone || e.tracking !== entry.tracking));

    // Clear search
    const entryKey = `${entry.phone}-${entry.tracking}`;
    const newSearch = {...manualMatchSearch};
    delete newSearch[entryKey];
    setManualMatchSearch(newSearch);

    const newResults = {...manualMatchResults};
    delete newResults[entryKey];
    setManualMatchResults(newResults);

    toast({
      title: "Match Added",
      description: `${order.order_code} will be updated with tracking ${entry.tracking}`,
    });
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
          <Button variant="outline" onClick={() => document.getElementById('pdf-upload')?.click()}>
            <FileUp className="h-4 w-4 mr-2" />
            Import Tracking (PDF)
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={importFromCSV}
          />
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={importTrackingFromPDF}
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

      {/* Import Preview Dialog */}
      <Dialog open={isImportPreviewOpen} onOpenChange={setIsImportPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Review Import - {importPreviewData.length} Matched
              {unmatchedEntries.length > 0 && `, ${unmatchedEntries.length} Unmatched`}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-4">
            {importPreviewData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-green-600">Matched Orders (Will be updated)</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Code</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tracking Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreviewData.map((match) => (
                      <TableRow key={match.orderId}>
                        <TableCell className="font-medium">{match.orderCode}</TableCell>
                        <TableCell>{match.phone}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={match.customerContact}>
                            {match.customerContact.split('\n')[0]}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{match.tracking}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {unmatchedEntries.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-orange-600">Unmatched Entries (No order found)</h3>
                <div className="space-y-4">
                  {unmatchedEntries.map((entry, index) => {
                    const entryKey = `${entry.phone}-${entry.tracking}`;
                    const searchResults = manualMatchResults[entryKey] || [];
                    
                    return (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Phone Number</Label>
                            <p className="font-medium">{entry.phone}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Tracking Number</Label>
                            <Badge variant="outline">{entry.tracking}</Badge>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Status</Label>
                            <p className="text-sm text-orange-600">No automatic match</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm">Search by Order Code or Customer Name</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter order code or customer name..."
                              value={manualMatchSearch[entryKey] || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setManualMatchSearch({
                                  ...manualMatchSearch,
                                  [entryKey]: value
                                });
                                searchOrdersForManualMatch(value, entryKey);
                              }}
                            />
                          </div>
                          
                          {searchResults.length > 0 && (
                            <div className="border rounded-md">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-32">Order Code</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="w-24">Action</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {searchResults.map((order) => (
                                    <TableRow key={order.id}>
                                      <TableCell className="font-medium">{order.order_code}</TableCell>
                                      <TableCell>
                                        <div className="max-w-xs truncate" title={order.customer_contact}>
                                          {order.customer_contact.split('\n')[0]}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => addManualMatch(entry, order)}
                                        >
                                          Match
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                          
                          {manualMatchSearch[entryKey] && manualMatchSearch[entryKey].length >= 2 && searchResults.length === 0 && (
                            <p className="text-sm text-muted-foreground">No orders found matching "{manualMatchSearch[entryKey]}"</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            {importPreviewData.length > 0 ? (
              <Button onClick={confirmImport} className="flex-1">
                Confirm & Update {importPreviewData.length} Orders
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" disabled>
                No Orders to Update
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportPreviewOpen(false);
                setImportPreviewData([]);
                setUnmatchedEntries([]);
                setManualMatchSearch({});
                setManualMatchResults({});
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;