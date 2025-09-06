import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, AlertTriangle } from "lucide-react";

const Dashboard = () => {
  // Mock data - will be replaced with real data from Supabase
  const stats = {
    totalProducts: 156,
    totalSales: 2847,
    revenue: 125780,
    lowStockItems: 12
  };

  const recentSales = [
    { id: "SAL-20250815-001", customer: "John Doe", amount: 299.99, status: "Shipped" },
    { id: "SAL-20250815-002", customer: "Jane Smith", amount: 459.50, status: "Pending" },
    { id: "SAL-20250815-003", customer: "Mike Johnson", amount: 189.00, status: "Delivered" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-primary text-primary-foreground shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs opacity-80">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent text-accent-foreground shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs opacity-80">+8% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-medium hover:shadow-large transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>

        <Card className="shadow-medium hover:shadow-large transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{sale.id}</p>
                  <p className="text-sm text-muted-foreground">{sale.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">฿{sale.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    sale.status === 'Delivered' ? 'bg-success text-success-foreground' :
                    sale.status === 'Shipped' ? 'bg-primary text-primary-foreground' :
                    'bg-warning text-warning-foreground'
                  }`}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;