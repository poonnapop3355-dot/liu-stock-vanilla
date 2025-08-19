import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BookOpen, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  FileText, 
  Settings, 
  CreditCard,
  Plus,
  Search,
  Edit,
  Trash2,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const UserGuide = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">How to Use Liu Stock Bookstore System</h1>
        <p className="text-muted-foreground text-lg">
          Complete guide to managing your bookstore inventory, sales, and operations
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="books">Book Management</TabsTrigger>
          <TabsTrigger value="pos">POS System</TabsTrigger>
          <TabsTrigger value="orders">Orders & Sales</TabsTrigger>
          <TabsTrigger value="users">Users & Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                System Overview
              </CardTitle>
              <CardDescription>
                Liu Stock is a comprehensive bookstore management system designed to handle inventory, sales, and customer management.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      Book Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Manage your book inventory, authors, and categories. Add new books, track stock levels, and organize your catalog.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-green-500" />
                      POS System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Process sales transactions, manage shopping cart, apply discounts, and handle multiple payment methods.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      Order Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Track orders, manage delivery schedules, and monitor sales performance with detailed analytics.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Getting Started</AlertTitle>
                <AlertDescription>
                  Start by setting up your book inventory, then configure your categories and authors. 
                  Once your catalog is ready, you can begin processing sales through the POS system.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Navigation Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Main Features:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>📊 <strong>Dashboard:</strong> Overview of sales and inventory</li>
                    <li>📚 <strong>Book Management:</strong> Complete book catalog management</li>
                    <li>🛒 <strong>Bookstore POS:</strong> Point of sale for processing orders</li>
                    <li>📦 <strong>Products:</strong> General product management</li>
                    <li>📈 <strong>Sales:</strong> Sales analytics and reporting</li>
                    <li>📋 <strong>Orders:</strong> Order tracking and management</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Administration:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>👥 <strong>CRM:</strong> Customer relationship management</li>
                    <li>🏷️ <strong>Print Labels:</strong> Generate product labels</li>
                    <li>👤 <strong>Users:</strong> User account management</li>
                    <li>⚙️ <strong>Settings:</strong> System configuration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="books" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Book Management Guide
              </CardTitle>
              <CardDescription>
                Learn how to manage your book inventory, authors, and categories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">📚 Managing Books</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adding New Books
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-6">
                      <li>Navigate to <Badge>Book Management</Badge> from the sidebar</li>
                      <li>Click the <Badge variant="outline">Add Book</Badge> button</li>
                      <li>Fill in required information:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li><strong>Title:</strong> The book's title</li>
                          <li><strong>Author:</strong> Primary author name</li>
                          <li><strong>ISBN:</strong> International Standard Book Number</li>
                          <li><strong>Price:</strong> Selling price</li>
                          <li><strong>Category:</strong> Book genre/category</li>
                          <li><strong>Stock Quantity:</strong> Number of copies available</li>
                        </ul>
                      </li>
                      <li>Click <Badge>Add Book</Badge> to save</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Searching & Filtering Books
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                      <li>Use the search bar to find books by title, author, or ISBN</li>
                      <li>Filter by category using the dropdown menu</li>
                      <li>View stock levels with color-coded badges:
                        <div className="flex gap-2 mt-1">
                          <Badge>High Stock (10+)</Badge>
                          <Badge variant="secondary">Low Stock (1-9)</Badge>
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Editing & Managing Books
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                      <li>Click the edit button to modify book details</li>
                      <li>Update stock quantities as inventory changes</li>
                      <li>Change book status (Active, Inactive, Discontinued)</li>
                      <li>Delete books that are no longer available</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">👨‍💼 Managing Authors</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Switch to the <Badge variant="outline">Authors</Badge> tab to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>Add new authors with biographical information</li>
                    <li>Track author nationality and birth dates</li>
                    <li>Associate multiple books with each author</li>
                    <li>Maintain author websites and contact information</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">🏷️ Managing Categories</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Switch to the <Badge variant="outline">Categories</Badge> tab to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>Create book categories (Fiction, Science, etc.)</li>
                    <li>Add descriptions for each category</li>
                    <li>Organize your book catalog efficiently</li>
                    <li>Help customers find books more easily</li>
                  </ul>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Pro Tip</AlertTitle>
                <AlertDescription>
                  Set up your categories and authors first, then add books. This makes data entry faster and ensures consistency across your catalog.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pos" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Point of Sale (POS) System Guide
              </CardTitle>
              <CardDescription>
                Learn how to process sales transactions and manage customer orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">🛒 Processing Sales</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Step 1: Find Products</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Use the search bar to find books by title, author, or ISBN</li>
                      <li>Browse the available inventory on the left panel</li>
                      <li>Check stock availability before adding to cart</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Step 2: Add to Cart</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Click the <Badge variant="outline">+</Badge> button next to any book</li>
                      <li>Items appear in the shopping cart on the right</li>
                      <li>Adjust quantities using + and - buttons</li>
                      <li>Remove items using the trash icon</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Step 3: Customer Information</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Select existing customer from dropdown</li>
                      <li>Or enter new customer contact information</li>
                      <li>Contact info is required for order processing</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Step 4: Apply Discounts & Payment</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Enter discount percentage if applicable</li>
                      <li>Select payment method:
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">Cash</Badge>
                          <Badge variant="outline">Card</Badge>
                          <Badge variant="outline">Bank Transfer</Badge>
                        </div>
                      </li>
                      <li>Review total amount before processing</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Step 5: Complete Transaction</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Click <Badge>Process Order</Badge> to complete sale</li>
                      <li>Order is automatically created with unique order code</li>
                      <li>Stock quantities are updated automatically</li>
                      <li>Cart is cleared for next transaction</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Automatic Features</AlertTitle>
                <AlertDescription>
                  The POS system automatically handles stock validation, inventory updates, and order creation. 
                  You'll receive notifications if there's insufficient stock or if the transaction fails.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="text-lg font-semibold mb-3">💡 POS Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Always verify customer information before processing payment</li>
                  <li>Check stock levels if customer wants specific quantities</li>
                  <li>Apply discounts before selecting payment method</li>
                  <li>Keep the cart organized by removing unwanted items promptly</li>
                  <li>Use the clear cart function to start fresh between customers</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Orders & Sales Management
              </CardTitle>
              <CardDescription>
                Track orders, manage deliveries, and analyze sales performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">📋 Order Management</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Order Tracking</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>View all orders in the <Badge variant="outline">Orders</Badge> section</li>
                      <li>Track order status: Pending, Processing, Completed, Cancelled</li>
                      <li>Monitor delivery dates and schedules</li>
                      <li>Update order status as they progress</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Order Details</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Each order includes:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Unique order code for tracking</li>
                          <li>Customer contact information</li>
                          <li>Order date and delivery date</li>
                          <li>Complete item list with quantities</li>
                          <li>Total amount and payment method</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">📊 Sales Analytics</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Access the <Badge variant="outline">Sales</Badge> section for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>Daily, weekly, and monthly sales reports</li>
                    <li>Best-selling books and categories</li>
                    <li>Revenue trends and growth analysis</li>
                    <li>Customer purchase patterns</li>
                    <li>Inventory turnover rates</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">🚚 Delivery Management</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Set delivery dates for customer orders</li>
                  <li>Organize delivery rounds for efficiency</li>
                  <li>Track delivery status and completion</li>
                  <li>Generate delivery schedules and routes</li>
                </ul>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Order Workflow</AlertTitle>
                <AlertDescription>
                  Orders created through the POS system automatically appear in order management. 
                  You can update their status, set delivery dates, and track their progress through completion.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                User Management & System Settings
              </CardTitle>
              <CardDescription>
                Manage user accounts, permissions, and system configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">👥 User Management</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">User Roles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <Badge className="w-fit">Administrator</Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Full system access, user management, and configuration
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <Badge variant="secondary" className="w-fit">Manager</Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Inventory management, sales, and customer operations
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <Badge variant="outline" className="w-fit">Cashier</Badge>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            POS access and basic order processing
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Managing Users</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Add new users with appropriate roles</li>
                      <li>Set user permissions and access levels</li>
                      <li>Deactivate or remove user accounts</li>
                      <li>Reset passwords and update profiles</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">⚙️ System Settings</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Business Configuration</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Store name and contact information</li>
                      <li>Business hours and location details</li>
                      <li>Tax rates and pricing configuration</li>
                      <li>Currency and regional settings</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">System Preferences</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Notification settings and alerts</li>
                      <li>Backup and data export options</li>
                      <li>Security settings and access controls</li>
                      <li>Integration with external services</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">👥 Customer Management (CRM)</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Maintain customer database with contact information</li>
                  <li>Track customer purchase history and preferences</li>
                  <li>Manage customer loyalty programs and discounts</li>
                  <li>Send promotional communications and updates</li>
                </ul>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Note</AlertTitle>
                <AlertDescription>
                  Only administrators can access user management and system settings. 
                  Regularly review user permissions and update passwords for security.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserGuide;