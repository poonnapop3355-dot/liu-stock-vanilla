import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Upload, Edit, Plus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  customer_contact: string;
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const CRMManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    customer_contact: "",
    name: "",
    phone: "",
    address: "",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      });
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.customer_contact.toLowerCase().includes(searchLower) ||
      (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
      (customer.address && customer.address.toLowerCase().includes(searchLower))
    );
  });

  const handleAddCustomer = async () => {
    try {
      const { error } = await supabase
        .from('customers')
        .insert(formData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer added successfully"
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive"
      });
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update(formData)
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer updated successfully"
      });

      setIsEditDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      customer_contact: "",
      name: "",
      phone: "",
      address: "",
      notes: ""
    });
    setSelectedCustomer(null);
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customer_contact: customer.customer_contact,
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      notes: customer.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Phone', 'Address', 'Full Contact', 'Notes', 'Created Date'].join(','),
      ...filteredCustomers.map(customer => [
        `"${(customer.name || '').replace(/"/g, '""')}"`,
        `"${(customer.phone || '').replace(/"/g, '""')}"`,
        `"${(customer.address || '').replace(/"/g, '""')}"`,
        `"${customer.customer_contact.replace(/"/g, '""')}"`,
        `"${(customer.notes || '').replace(/"/g, '""')}"`,
        customer.created_at.split('T')[0]
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      try {
        const customersToImport = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const customer = {
            customer_contact: values[3] || '', // Full Contact
            name: values[0] || '',
            phone: values[1] || '',
            address: values[2] || '',
            notes: values[4] || ''
          };
          
          if (customer.customer_contact) {
            customersToImport.push(customer);
          }
        }

        const { error } = await supabase
          .from('customers')
          .upsert(customersToImport, { onConflict: 'customer_contact' });

        if (error) throw error;

        toast({
          title: "CSV Import Successful",
          description: `Imported ${customersToImport.length} customers`
        });

        fetchCustomers();
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import customers from CSV",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const importCustomersFromOrders = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('customer_contact')
        .not('customer_contact', 'is', null);

      if (error) throw error;

      const uniqueContacts = [...new Set(orders.map(order => order.customer_contact))];
      const customersToImport = uniqueContacts.map(contact => {
        const lines = contact.split('\n');
        return {
          customer_contact: contact,
          name: lines[0] || '',
          phone: lines[1] || '',
          address: lines.slice(2).join('\n') || ''
        };
      });

      const { error: insertError } = await supabase
        .from('customers')
        .upsert(customersToImport, { onConflict: 'customer_contact' });

      if (insertError) throw insertError;

      toast({
        title: "Import Successful",
        description: `Imported ${customersToImport.length} customers from orders`
      });

      fetchCustomers();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import customers from orders",
        variant: "destructive"
      });
    }
  };

  const CustomerForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="customer_contact">Full Contact Block</Label>
        <Textarea
          id="customer_contact"
          placeholder="สมชาย รักดี&#10;0812345678&#10;123/45 กรุงเทพฯ 10150"
          value={formData.customer_contact}
          onChange={(e) => setFormData({...formData, customer_contact: e.target.value})}
          rows={4}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Customer name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          placeholder="Customer address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes about the customer"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CRM Management</h1>
        <div className="flex gap-2">
          <Button onClick={importCustomersFromOrders} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import from Orders
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <CustomerForm />
              <Button onClick={handleAddCustomer} className="w-full">
                Add Customer
              </Button>
            </DialogContent>
          </Dialog>
          
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
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, phone, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map(customer => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name || '-'}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{customer.address || '-'}</TableCell>
                  <TableCell>{customer.created_at.split('T')[0]}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openViewDialog(customer)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(customer)}>
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

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div>
                <Label>Full Contact Block</Label>
                <div className="mt-1 p-3 bg-muted rounded">
                  <pre className="whitespace-pre-wrap text-sm">{selectedCustomer.customer_contact}</pre>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p className="mt-1">{selectedCustomer.name || '-'}</p>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="mt-1">{selectedCustomer.phone || '-'}</p>
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <p className="mt-1">{selectedCustomer.address || '-'}</p>
              </div>

              {selectedCustomer.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="mt-1">{selectedCustomer.notes}</p>
                </div>
              )}

              <div>
                <Label>Created Date</Label>
                <p className="mt-1">{new Date(selectedCustomer.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm />
          <Button onClick={handleEditCustomer} className="w-full">
            Update Customer
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMManagement;