import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    revenue: 0,
    lowStockItems: 0
  });
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total products and low stock items
      const { data: products } = await supabase
        .from('products')
        .select('id, stock_quantity')
        .eq('status', 'active');

      // Fetch orders for sales and revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, status, order_code, customer_contact, created_at')
        .order('created_at', { ascending: false });

      // Calculate stats
      const totalProducts = products?.length || 0;
      const lowStockItems = products?.filter(p => p.stock_quantity < 10).length || 0;
      const totalSales = orders?.length || 0;
      const revenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Get recent sales (last 5)
      const recentSalesData = orders?.slice(0, 5).map(order => ({
        id: order.order_code,
        customer: order.customer_contact,
        amount: Number(order.total_amount),
        status: order.status === 'pending' ? 'Pending' : 
                order.status === 'shipped' ? 'Shipped' : 
                order.status === 'delivered' ? 'Delivered' : 'Pending'
      })) || [];

      setStats({
        totalProducts,
        totalSales,
        revenue,
        lowStockItems
      });
      setRecentSales(recentSalesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : recentSales.length > 0 ? (
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{sale.id}</p>
                    <p className="text-sm text-muted-foreground">{sale.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">฿{sale.amount.toLocaleString()}</p>
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No sales data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;