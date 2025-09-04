import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Minus, ShoppingCart, X, Printer, Package, Calendar, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/DatePicker";

const SalesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [isCreateSaleOpen, setIsCreateSaleOpen] = useState(false);

  // Handler functions for button actions
  const handlePrintPackingSlips = () => {
    console.log('Print packing slips for all sales');
    
    // Create print content
    const printContent = `
      <html>
        <head>
          <title>Packing Slips</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .slip { page-break-after: always; margin-bottom: 40px; padding: 20px; border: 1px solid #ccc; }
            .header { text-align: center; font-size: 24px; margin-bottom: 20px; }
            .info { margin-bottom: 15px; }
            .items { margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          ${sales.map(sale => `
            <div class="slip">
              <div class="header">Liu Stock - Packing Slip</div>
              <div class="info"><strong>Sale ID:</strong> ${sale.saleId}</div>
              <div class="info"><strong>Customer:</strong> ${sale.customer}</div>
              <div class="info"><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleDateString()}</div>
              <div class="info"><strong>Shipping Address:</strong><br>${sale.shippingInfo.address}</div>
              <div class="items">
                <table>
                  <tr><th>Product</th><th>Quantity</th><th>Price</th></tr>
                  ${sale.items.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>$${item.priceAtSale}</td>
                    </tr>
                  `).join('')}
                </table>
                <p><strong>Total: $${sale.totalAmount}</strong></p>
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleViewSale = (saleId: string) => {
    const sale = sales.find(s => s.saleId === saleId);
    if (sale) {
      alert(`Viewing sale ${saleId}\nCustomer: ${sale.customer}\nTotal: $${sale.totalAmount}\nStatus: ${sale.shippingInfo.status}`);
    }
  };

  const handlePrintSingle = (saleId: string) => {
    const sale = sales.find(s => s.saleId === saleId);
    if (!sale) return;
    
    const printContent = `
      <html>
        <head>
          <title>Packing Slip - ${saleId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; font-size: 24px; margin-bottom: 20px; }
            .info { margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">Liu Stock - Packing Slip</div>
          <div class="info"><strong>Sale ID:</strong> ${sale.saleId}</div>
          <div class="info"><strong>Customer:</strong> ${sale.customer}</div>
          <div class="info"><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleDateString()}</div>
          <div class="info"><strong>Shipping Address:</strong><br>${sale.shippingInfo.address}</div>
          <table>
            <tr><th>Product</th><th>Quantity</th><th>Price</th></tr>
            ${sale.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.priceAtSale}</td>
              </tr>
            `).join('')}
          </table>
          <p><strong>Total: $${sale.totalAmount}</strong></p>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Mock data - will be replaced with real data from Supabase
  const sales = [
    {
      saleId: "SAL-20250815-001",
      customer: "John Doe",
      items: [
        { productId: "TEE001", name: "Basic White T-Shirt", quantity: 2, priceAtSale: 29.99 },
        { productId: "TEE004", name: "Vintage Red T-Shirt", quantity: 1, priceAtSale: 34.99 }
      ],
      totalAmount: 94.97,
      shippingInfo: {
        address: "123 Main St, New York, NY 10001",
        status: "shipped"
      },
      createdAt: "2025-01-15T10:30:00Z"
    },
    {
      saleId: "SAL-20250815-002",
      customer: "Jane Smith", 
      items: [
        { productId: "TEE002", name: "Premium Black T-Shirt", quantity: 3, priceAtSale: 39.99 }
      ],
      totalAmount: 119.97,
      shippingInfo: {
        address: "456 Oak Ave, Los Angeles, CA 90210",
        status: "pending"
      },
      createdAt: "2025-01-15T14:15:00Z"
    },
    {
      saleId: "SAL-20250815-003",
      customer: "Mike Johnson",
      items: [
        { productId: "TEE001", name: "Basic White T-Shirt", quantity: 1, priceAtSale: 29.99 },
        { productId: "TEE003", name: "Designer Blue T-Shirt", quantity: 2, priceAtSale: 49.99 }
      ],
      totalAmount: 129.97,
      shippingInfo: {
        address: "789 Pine St, Chicago, IL 60601",
        status: "delivered"
      },
      createdAt: "2025-01-15T16:45:00Z"
    }
  ];

  const filteredSales = sales.filter(sale =>
    sale.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge className="bg-success text-success-foreground">Delivered</Badge>;
      case 'shipped':
        return <Badge className="bg-primary text-primary-foreground">Shipped</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl">Sales Management</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handlePrintPackingSlips}>
                <Printer className="h-4 w-4" />
                Print Packing Slips
              </Button>
              <Dialog open={isCreateSaleOpen} onOpenChange={setIsCreateSaleOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-accent text-accent-foreground gap-2 shadow-glow">
                    <Plus className="h-4 w-4" />
                    Create Sale
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Sale</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer">Customer Name</Label>
                        <Input id="customer" placeholder="Enter customer name" />
                      </div>
                      <div>
                        <Label htmlFor="saleDate">Sale Date</Label>
                        <DatePicker
                          date={saleDate}
                          onDateChange={(date) => setSaleDate(date || new Date())}
                          placeholder="Select sale date"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Items</Label>
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-4 gap-2 text-sm font-medium text-muted-foreground">
                          <span>Product</span>
                          <span>Quantity</span>
                          <span>Price</span>
                          <span>Total</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <Input placeholder="Search product..." />
                          <Input type="number" placeholder="1" />
                          <Input type="number" placeholder="0.00" />
                          <div className="flex items-center text-sm font-medium">$0.00</div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          Add Item
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Shipping Address</Label>
                      <Textarea 
                        id="address" 
                        placeholder="Enter full shipping address"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-xl font-bold">$0.00</span>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        className="bg-gradient-accent text-accent-foreground flex-1"
                        onClick={() => setIsCreateSaleOpen(false)}
                      >
                        Create Sale
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateSaleOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by sale ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.saleId} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{sale.saleId}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{sale.items.length} item{sale.items.length > 1 ? 's' : ''}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">${sale.totalAmount}</TableCell>
                    <TableCell>
                      {getStatusBadge(sale.shippingInfo.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleViewSale(sale.saleId)}>
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handlePrintSingle(sale.saleId)}>
                          <Printer className="h-3 w-3" />
                          Print
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesManagement;