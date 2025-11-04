import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Download, Upload, Search } from "lucide-react";
import { productSchema, sanitizeCSVValue, formatZodError } from "@/lib/validationSchemas";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const ProductManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    price: "",
    category: "",
    stock_quantity: "",
    status: "active"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleImportCSV = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Expected headers: SKU, Name, Price, Quantity, Category, Description
      const expectedHeaders = ['SKU', 'Name', 'Price', 'Quantity', 'Category'];
      const hasValidHeaders = expectedHeaders.every(header => 
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );

      if (!hasValidHeaders) {
        toast({
          title: "Invalid CSV Format",
          description: "CSV must have columns: SKU, Name, Price, Quantity, Category",
          variant: "destructive"
        });
        return;
      }

      try {
        const products = [];
        const errors: string[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const productData = {
            sku: values[0],
            name: values[1],
            price: parseFloat(values[2]) || 0,
            stock_quantity: parseInt(values[3]) || 0,
            category: values[4] || 'General',
            description: values[5] || '',
            status: 'active'
          };
          
          // Validate each product using zod schema
          const validationResult = productSchema.safeParse(productData);
          
          if (!validationResult.success) {
            errors.push(`Row ${i}: ${formatZodError(validationResult.error)}`);
            continue;
          }
          
          products.push(validationResult.data);
        }
        
        // Show validation errors if any
        if (errors.length > 0) {
          toast({
            title: "Validation Errors",
            description: `${errors.length} row(s) failed validation. First error: ${errors[0]}`,
            variant: "destructive",
          });
          if (products.length === 0) return;
        }

        // Insert into database
        const { error } = await supabase
          .from('products')
          .upsert(products, { onConflict: 'sku' });

        if (error) throw error;

        toast({
          title: "Import Successful",
          description: `Imported ${products.length} products successfully`
        });

        fetchProducts(); // Refresh the products list
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import products from CSV",
          variant: "destructive"
        });
      }
    };
    fileInput.click();
  };

  const handleExportCSV = async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;

      const csvContent = [
        ['SKU', 'Name', 'Price', 'Quantity', 'Category', 'Description', 'Status'].join(','),
        ...products.map(product => [
          product.sku,
          `"${product.name.replace(/"/g, '""')}"`,
          product.price,
          product.stock_quantity,
          product.category || '',
          `"${(product.description || '').replace(/"/g, '""')}"`,
          product.status
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${products.length} products to CSV`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export products to CSV",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = (product: any) => {
    console.log('Edit product:', product.sku);
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      category: product.category || "",
      stock_quantity: product.stock_quantity.toString(),
      status: product.status
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      // Validate input
      const validationResult = productSchema.safeParse(formData);
      if (!validationResult.success) {
        toast({
          title: "Validation Error",
          description: formatZodError(validationResult.error),
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('products')
        .update({
          sku: validationResult.data.sku,
          name: validationResult.data.name,
          description: validationResult.data.description || null,
          price: parseFloat(validationResult.data.price),
          category: validationResult.data.category || null,
          stock_quantity: parseInt(validationResult.data.stock_quantity),
          status: validationResult.data.status
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: "Product Updated",
        description: "Product updated successfully"
      });

      setIsEditDialogOpen(false);
      setEditingProduct(null);
      setFormData({
        sku: "",
        name: "",
        description: "",
        price: "",
        category: "",
        stock_quantity: "",
        status: "active"
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const handleAddProduct = async () => {
    try {
      // Validate input
      const validationResult = productSchema.safeParse(formData);
      if (!validationResult.success) {
        toast({
          title: "Validation Error",
          description: formatZodError(validationResult.error),
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('products')
        .insert([{
          sku: validationResult.data.sku,
          name: validationResult.data.name,
          description: validationResult.data.description || null,
          price: parseFloat(validationResult.data.price),
          category: validationResult.data.category || null,
          stock_quantity: parseInt(validationResult.data.stock_quantity),
          status: validationResult.data.status
        }]);

      if (error) throw error;

      toast({
        title: "Product Added",
        description: "Product added successfully"
      });

      setIsAddDialogOpen(false);
      setFormData({
        sku: "",
        name: "",
        description: "",
        price: "",
        category: "",
        stock_quantity: "",
        status: "active"
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: "Add Failed",
        description: "Failed to add product",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Product Deleted",
          description: "Product deleted successfully"
        });

        fetchProducts();
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Failed to delete product",
          variant: "destructive"
        });
      }
    }
  };

  const getStatusBadge = (status: string, quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= 10) {
      return <Badge className="bg-warning text-warning-foreground">Low Stock</Badge>;
    } else {
      return <Badge className="bg-success text-success-foreground">In Stock</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

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
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <Label htmlFor="add-sku">SKU *</Label>
                      <Input 
                        id="add-sku" 
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="e.g., PROD001" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-name">Product Name *</Label>
                      <Input 
                        id="add-name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter product name" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-description">Description</Label>
                      <Textarea 
                        id="add-description" 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Product description" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-price">Price *</Label>
                      <Input 
                        id="add-price" 
                        type="number" 
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="0.00" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-category">Category</Label>
                      <Input 
                        id="add-category" 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        placeholder="e.g., Electronics" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-quantity">Stock Quantity *</Label>
                      <Input 
                        id="add-quantity" 
                        type="number" 
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                        placeholder="0" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger id="add-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-gradient-primary text-primary-foreground"
                      onClick={handleAddProduct}
                    >
                      Add Product
                    </Button>
                  </DialogFooter>
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
                {paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{product.sku}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>฿{product.price}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      {getStatusBadge(product.status, product.stock_quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleEditProduct(product)}>
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleDeleteProduct(product.id)}>
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
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

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="edit-sku">SKU *</Label>
              <Input 
                id="edit-sku" 
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                placeholder="e.g., PROD001" 
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input 
                id="edit-name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter product name" 
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Product description" 
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price *</Label>
              <Input 
                id="edit-price" 
                type="number" 
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00" 
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Input 
                id="edit-category" 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="e.g., Electronics" 
              />
            </div>
            <div>
              <Label htmlFor="edit-quantity">Stock Quantity *</Label>
              <Input 
                id="edit-quantity" 
                type="number" 
                value={formData.stock_quantity}
                onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                placeholder="0" 
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-gradient-primary text-primary-foreground"
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;