import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Download, Upload, Search } from "lucide-react";

const ProductManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Handler functions for button actions
  const handleImportCSV = () => {
    // Create file input element for CSV import
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('CSV file selected:', file.name);
        // TODO: Parse CSV and import to database
        alert('CSV import functionality requires Supabase connection');
      }
    };
    input.click();
  };

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['SKU', 'Name', 'Price', 'Quantity', 'Low Stock Threshold'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [p.sku, p.name, p.sellingPrice, p.quantity, p.lowStockThreshold].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEditProduct = (sku: string) => {
    console.log('Edit product:', sku);
    alert(`Edit functionality for ${sku} - requires Supabase connection for full implementation`);
  };

  const handleDeleteProduct = (sku: string) => {
    if (confirm(`Are you sure you want to delete product ${sku}?`)) {
      console.log('Delete product:', sku);
      alert(`Delete functionality for ${sku} - requires Supabase connection for full implementation`);
    }
  };

  // Mock data - will be replaced with real data from Supabase
  const products = [
    { 
      sku: "TEE001", 
      name: "Basic White T-Shirt", 
      sellingPrice: 29.99, 
      quantity: 150, 
      lowStockThreshold: 20,
      status: "In Stock"
    },
    { 
      sku: "TEE002", 
      name: "Premium Black T-Shirt", 
      sellingPrice: 39.99, 
      quantity: 8, 
      lowStockThreshold: 15,
      status: "Low Stock"
    },
    { 
      sku: "TEE003", 
      name: "Designer Blue T-Shirt", 
      sellingPrice: 49.99, 
      quantity: 0, 
      lowStockThreshold: 10,
      status: "Out of Stock"
    },
    { 
      sku: "TEE004", 
      name: "Vintage Red T-Shirt", 
      sellingPrice: 34.99, 
      quantity: 75, 
      lowStockThreshold: 25,
      status: "In Stock"
    }
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, quantity: number, threshold: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= threshold) {
      return <Badge className="bg-warning text-warning-foreground">Low Stock</Badge>;
    } else {
      return <Badge className="bg-success text-success-foreground">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl">Product Management</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleImportCSV}>
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary text-primary-foreground gap-2 shadow-glow">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sku">SKU</Label>
                      <Input id="sku" placeholder="e.g., TEE005" />
                    </div>
                    <div>
                      <Label htmlFor="name">Product Name</Label>
                      <Input id="name" placeholder="Enter product name" />
                    </div>
                    <div>
                      <Label htmlFor="price">Selling Price</Label>
                      <Input id="price" type="number" placeholder="0.00" />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Initial Quantity</Label>
                      <Input id="quantity" type="number" placeholder="0" />
                    </div>
                    <div>
                      <Label htmlFor="threshold">Low Stock Threshold</Label>
                      <Input id="threshold" type="number" placeholder="10" />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button 
                        className="bg-gradient-primary text-primary-foreground flex-1"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Add Product
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
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
                placeholder="Search products by name or SKU..."
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.sku} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>${product.sellingPrice}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      {getStatusBadge(product.status, product.quantity, product.lowStockThreshold)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleEditProduct(product.sku)}>
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleDeleteProduct(product.sku)}>
                          <Trash2 className="h-3 w-3" />
                          Delete
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

export default ProductManagement;