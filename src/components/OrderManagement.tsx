import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Upload, Edit, Eye, FileUp, CheckSquare, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { createWorker } from 'tesseract.js';

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
  const [editStatus, setEditStatus] = useState("");
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [imageResults, setImageResults] = useState<Array<{
    fileName: string;
    trackingCount: number;
    trackingNumbers: string[];
  }>>([]);
  const [showResultsSummary, setShowResultsSummary] = useState(false);
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

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Bulk operations
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrderIds);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrderIds(newSelected);
  };

  const toggleAllOrders = () => {
    if (selectedOrderIds.size === paginatedOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(paginatedOrders.map(o => o.id)));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedOrderIds.size === 0 || !bulkStatus) {
      toast({
        title: "Error",
        description: "Please select orders and a status",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: bulkStatus })
        .in('id', Array.from(selectedOrderIds));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${selectedOrderIds.size} order(s) to ${bulkStatus}`
      });

      setSelectedOrderIds(new Set());
      setBulkStatus("");
      fetchOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update orders",
        variant: "destructive"
      });
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    await fetchOrderItems(order.id);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setEditTrackingNumber(order.tracking_number || "");
    setEditDeliveryRound(order.delivery_round || "");
    setEditStatus(order.status);
    setIsEditDialogOpen(true);
  };

  const updateOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      // Auto-transition logic
      let finalStatus = editStatus;
      
      // If tracking number is added and order is pending, auto-change to processing
      if (editTrackingNumber && !selectedOrder.tracking_number && selectedOrder.status === 'pending') {
        finalStatus = 'processing';
        toast({
          title: "Status Auto-Updated",
          description: "Status changed to Processing since tracking number was added",
        });
      }
      
      // If tracking number is added to processing order, suggest shipped
      if (editTrackingNumber && !selectedOrder.tracking_number && selectedOrder.status === 'processing') {
        finalStatus = 'shipped';
        toast({
          title: "Status Auto-Updated",
          description: "Status changed to Shipped since tracking number was added",
        });
      }

      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: editTrackingNumber,
          delivery_round: editDeliveryRound,
          status: finalStatus
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

  const processImageWithOCR = async (file: File, imageIndex: number, totalFiles: number) => {
    // Create Tesseract worker with progress callback
    const worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'loading tesseract core') {
          setOcrStatus(`Image ${imageIndex + 1}/${totalFiles}: Loading OCR engine...`);
          setOcrProgress(m.progress * 20);
        } else if (m.status === 'initializing tesseract') {
          setOcrStatus(`Image ${imageIndex + 1}/${totalFiles}: Initializing OCR...`);
          setOcrProgress(20 + m.progress * 20);
        } else if (m.status === 'loading language traineddata') {
          setOcrStatus(`Image ${imageIndex + 1}/${totalFiles}: Loading language data...`);
          setOcrProgress(40 + m.progress * 20);
        } else if (m.status === 'initializing api') {
          setOcrStatus(`Image ${imageIndex + 1}/${totalFiles}: Preparing OCR...`);
          setOcrProgress(60 + m.progress * 10);
        } else if (m.status === 'recognizing text') {
          setOcrStatus(`Image ${imageIndex + 1}/${totalFiles}: Extracting text...`);
          setOcrProgress(70 + m.progress * 30);
        }
      }
    });
    
    // Perform OCR on the image
    const { data: { text } } = await worker.recognize(file);
    
    // Terminate worker
    await worker.terminate();

    return text;
  };

  const importTrackingFromPDF = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validFiles = Array.from(files).filter(file => allowedTypes.includes(file.type));

    if (validFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG or PNG images.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show progress dialog
      setIsOcrProcessing(true);
      setTotalImages(validFiles.length);
      setCurrentImageIndex(0);
      setOcrProgress(0);
      setOcrStatus("Starting batch processing...");

      let allUpdates: { phone: string; tracking: string }[] = [];
      const results: Array<{
        fileName: string;
        trackingCount: number;
        trackingNumbers: string[];
      }> = [];

      // Process each image
      for (let i = 0; i < validFiles.length; i++) {
        setCurrentImageIndex(i);
        setOcrProgress(0);
        
        const text = await processImageWithOCR(validFiles[i], i, validFiles.length);

        // Extract tracking numbers and phone numbers using regex
        const phonePattern = /0\d{9}/g;
        const trackingPattern = /([A-Z0-9]{10,20})/g;
        
        // Parse line by line to match phone with tracking
        const lines = text.split('\n');
        const imageTrackingNumbers: string[] = [];
        
        for (const line of lines) {
          const phones = line.match(phonePattern);
          const trackings = line.match(trackingPattern);
          
          if (phones && trackings) {
            const trackingNumber = trackings[trackings.length - 1];
            allUpdates.push({
              phone: phones[0],
              tracking: trackingNumber
            });
            imageTrackingNumbers.push(trackingNumber);
          }
        }

        // Store results for this image
        results.push({
          fileName: validFiles[i].name,
          trackingCount: imageTrackingNumbers.length,
          trackingNumbers: imageTrackingNumbers
        });
      }

      // Store results for summary
      setImageResults(results);

      setOcrStatus("Processing all extracted data...");
      setOcrProgress(100);

      // Close progress dialog
      setIsOcrProcessing(false);

      // Show results summary
      setShowResultsSummary(true);

      if (allUpdates.length === 0) {
        toast({
          title: "No data found",
          description: `Could not extract tracking numbers from ${validFiles.length} image(s). Please check the format.`,
          variant: "destructive"
        });
        return;
      }

      const updates = allUpdates;

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
          description: `${unmatched.length} phone numbers don't match any orders without tracking numbers.`,
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
      console.error('OCR error:', error);
      setIsOcrProcessing(false);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const confirmImport = async () => {
    try {
      let successCount = 0;

      for (const match of importPreviewData) {
        // Fetch current order to check status
        const { data: order } = await supabase
          .from('orders')
          .select('status')
          .eq('id', match.orderId)
          .single();

        // Auto-transition logic for bulk import
        let newStatus = order?.status;
        if (order?.status === 'pending') {
          newStatus = 'processing';
        } else if (order?.status === 'processing') {
          newStatus = 'shipped';
        }

        const { error } = await supabase
          .from('orders')
          .update({ 
            tracking_number: match.tracking,
            status: newStatus
          })
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
        description: `Successfully updated ${successCount} orders with tracking numbers. Order statuses were auto-updated based on transitions.`,
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
    const statusConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline", label: string, className?: string } } = {
      pending: { variant: "outline", label: "Pending", className: "border-warning text-warning" },
      processing: { variant: "default", label: "Processing", className: "bg-primary text-primary-foreground" },
      shipped: { variant: "secondary", label: "Shipped", className: "bg-accent text-accent-foreground" },
      delivered: { variant: "default", label: "Delivered", className: "bg-success text-success-foreground" },
      cancelled: { variant: "destructive", label: "Cancelled" }
    };
    
    const config = statusConfig[status] || { variant: "outline", label: status.charAt(0).toUpperCase() + status.slice(1) };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
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
            Import Tracking (Images)
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
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            style={{ display: 'none' }}
            onChange={importTrackingFromPDF}
            multiple
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
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
            
            {/* Bulk Operations */}
            {selectedOrderIds.size > 0 && (
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">
                  {selectedOrderIds.size} order(s) selected
                </span>
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Change status to..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkStatusUpdate} size="sm">
                  Update Status
                </Button>
                <Button 
                  onClick={() => setSelectedOrderIds(new Set())} 
                  variant="outline" 
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedOrderIds.size === paginatedOrders.length && paginatedOrders.length > 0}
                    onCheckedChange={toggleAllOrders}
                  />
                </TableHead>
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
              {paginatedOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedOrderIds.has(order.id)}
                      onCheckedChange={() => toggleOrderSelection(order.id)}
                    />
                  </TableCell>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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
            {/* Auto-transition info */}
            {selectedOrder && !selectedOrder.tracking_number && editTrackingNumber && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                <p className="font-medium text-primary mb-1">Auto Status Transition</p>
                <p className="text-muted-foreground">
                  {selectedOrder.status === 'pending' && 'Adding tracking will change status to Processing'}
                  {selectedOrder.status === 'processing' && 'Adding tracking will change status to Shipped'}
                </p>
              </div>
            )}
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

      {/* OCR Progress Dialog */}
      <Dialog open={isOcrProcessing} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Processing Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {totalImages > 1 && (
              <div className="text-center mb-2">
                <p className="text-sm font-medium">
                  Processing Image {currentImageIndex + 1} of {totalImages}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{ocrStatus}</span>
                <span className="font-medium">{Math.round(ocrProgress)}%</span>
              </div>
              <Progress value={ocrProgress} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              {totalImages > 1 
                ? `Please wait while we process ${totalImages} images...`
                : "Please wait while we extract text from your image..."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* OCR Results Summary Dialog */}
      <Dialog open={showResultsSummary} onOpenChange={setShowResultsSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Batch Processing Results - {imageResults.length} Image{imageResults.length !== 1 ? 's' : ''} Processed
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto space-y-4 py-4">
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Total Images Processed</p>
                  <p className="text-2xl font-bold text-primary">{imageResults.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Tracking Numbers Found</p>
                  <p className="text-2xl font-bold text-primary">
                    {imageResults.reduce((sum, result) => sum + result.trackingCount, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Details by Image</h3>
              {imageResults.map((result, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 space-y-2 bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate" title={result.fileName}>
                        {result.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.trackingCount} tracking number{result.trackingCount !== 1 ? 's' : ''} found
                      </p>
                    </div>
                    <Badge 
                      variant={result.trackingCount > 0 ? "default" : "secondary"}
                      className="ml-2 shrink-0"
                    >
                      {result.trackingCount}
                    </Badge>
                  </div>
                  
                  {result.trackingNumbers.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Tracking Numbers:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.trackingNumbers.map((tracking, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-mono">
                            {tracking}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t">
            <Button 
              onClick={() => setShowResultsSummary(false)} 
              className="w-full"
            >
              Continue to Import Preview
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