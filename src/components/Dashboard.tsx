import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    revenue: 0,
    lowStockItems: 0,
    revenueGrowth: 0,
    salesGrowth: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [salesTrend, setSalesTrend] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total products and low stock items
      const { data: products } = await supabase
        .from('products')
        .select('id, stock_quantity, category')
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

      // Calculate growth (compare last 7 days vs previous 7 days)
      const last7Days = orders?.filter(o => {
        const orderDate = new Date(o.created_at);
        const weekAgo = subDays(new Date(), 7);
        return orderDate >= weekAgo;
      }) || [];
      
      const previous7Days = orders?.filter(o => {
        const orderDate = new Date(o.created_at);
        const twoWeeksAgo = subDays(new Date(), 14);
        const weekAgo = subDays(new Date(), 7);
        return orderDate >= twoWeeksAgo && orderDate < weekAgo;
      }) || [];

      const revenueGrowth = previous7Days.length > 0 
        ? ((last7Days.reduce((sum, o) => sum + Number(o.total_amount), 0) - 
            previous7Days.reduce((sum, o) => sum + Number(o.total_amount), 0)) / 
           previous7Days.reduce((sum, o) => sum + Number(o.total_amount), 0)) * 100
        : 0;

      const salesGrowth = previous7Days.length > 0
        ? ((last7Days.length - previous7Days.length) / previous7Days.length) * 100
        : 0;

      // Sales trend data (last 7 days)
      const salesTrendData = [];
      for (let i = 6; i >= 0; i--) {
        const date = startOfDay(subDays(new Date(), i));
        const dayOrders = orders?.filter(o => {
          const orderDate = startOfDay(new Date(o.created_at));
          return orderDate.getTime() === date.getTime();
        }) || [];
        
        salesTrendData.push({
          date: format(date, 'MMM dd'),
          sales: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
        });
      }

      // Category stats
      const categoryMap = new Map();
      products?.forEach(p => {
        const cat = p.category || 'Uncategorized';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      
      const categoryStatsData = Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

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
        lowStockItems,
        revenueGrowth,
        salesGrowth
      });
      setRecentSales(recentSalesData);
      setSalesTrend(salesTrendData);
      setCategoryStats(categoryStatsData);
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
            <p className="text-xs opacity-80">{stats.lowStockItems > 0 ? `${stats.lowStockItems} low stock` : 'All in stock'}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-accent text-accent-foreground shadow-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <div className="flex items-center text-xs opacity-80">
              {stats.salesGrowth >= 0 ? (
                <><TrendingUp className="h-3 w-3 mr-1" /> +{stats.salesGrowth.toFixed(1)}%</>
              ) : (
                <><TrendingDown className="h-3 w-3 mr-1" /> {stats.salesGrowth.toFixed(1)}%</>
              )}
              <span className="ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-medium hover:shadow-large transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{stats.revenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.revenueGrowth >= 0 ? (
                <><TrendingUp className="h-3 w-3 mr-1 text-success" /> +{stats.revenueGrowth.toFixed(1)}%</>
              ) : (
                <><TrendingDown className="h-3 w-3 mr-1 text-destructive" /> {stats.revenueGrowth.toFixed(1)}%</>
              )}
              <span className="ml-1">vs last week</span>
            </div>
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

      {/* Sales Trend Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Sales Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => `฿${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    radius={[8, 8, 0, 0]}
                    name="Revenue (฿)"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      {categoryStats.length > 0 && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--accent))" 
                  radius={[0, 8, 8, 0]}
                  name="Products"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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