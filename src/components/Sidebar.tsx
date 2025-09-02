import { cn } from "@/lib/utils";
import { BarChart3, Package, ShoppingCart, Users, Settings, LogOut, CreditCard, FileText, UserCheck, Printer, BookOpen, TrendingUp, HelpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('staff');

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserRole();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setProfile(data);
  };

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setUserRole(data.role);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = getInitials(displayName);
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
    { id: 'guide', label: 'How to Use', icon: HelpCircle },
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

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-destructive/10 text-destructive text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;