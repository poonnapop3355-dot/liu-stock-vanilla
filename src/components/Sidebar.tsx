import { cn } from "@/lib/utils";
import { BarChart3, Package, ShoppingCart, Users, Settings, LogOut, CreditCard, FileText, UserCheck, Printer, BookOpen, TrendingUp } from "lucide-react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'books', label: 'Book Management', icon: BookOpen },
    { id: 'bookstore-pos', label: 'Bookstore POS', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'pos', label: 'POS System', icon: CreditCard },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'crm', label: 'CRM', icon: UserCheck },
    { id: 'print', label: 'Print Labels', icon: Printer },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-surface border-r border-border shadow-medium">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Liu Stock
            </h1>
            <p className="text-xs text-muted-foreground">Inventory Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                    "hover:bg-white/60 hover:shadow-soft",
                    activeView === item.id
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-lg text-left transition-colors hover:bg-destructive/10 text-destructive">
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;