import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import RoleGuard from "@/components/RoleGuard";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import ProductManagement from "@/components/ProductManagement";
import SalesManagement from "@/components/SalesManagement";
import EnhancedPOS from "@/components/EnhancedPOS";
import OrderManagement from "@/components/OrderManagement";
import CRMManagement from "@/components/CRMManagement";
import PrintLabel from "@/components/PrintLabel";
import UserManagement from "@/components/UserManagement";
import Settings from "@/components/Settings";
import Auth from "@/components/Auth";
import BookManagement from "@/components/BookManagement";
import BookstorePOS from "@/components/BookstorePOS";
import UserGuide from "@/components/UserGuide";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'books':
        return <RoleGuard requiredRole="staff"><BookManagement /></RoleGuard>;
      case 'bookstore-pos':
        return <RoleGuard requiredRole="staff"><BookstorePOS /></RoleGuard>;
      case 'products':
        return <RoleGuard requiredRole="staff"><ProductManagement /></RoleGuard>;
      case 'sales':
        return <RoleGuard requiredRole="staff"><SalesManagement /></RoleGuard>;
      case 'pos':
        return <RoleGuard requiredRole="staff"><EnhancedPOS /></RoleGuard>;
      case 'orders':
        return <RoleGuard requiredRole="staff"><OrderManagement /></RoleGuard>;
      case 'crm':
        return <RoleGuard requiredRole="staff"><CRMManagement /></RoleGuard>;
      case 'print':
        return <RoleGuard requiredRole="staff"><PrintLabel /></RoleGuard>;
      case 'users':
        return <RoleGuard requiredRole="admin"><UserManagement /></RoleGuard>;
      case 'guide':
        return <UserGuide />;
      case 'settings':
        return <RoleGuard requiredRole="staff"><Settings /></RoleGuard>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex">
      <div className="w-64 flex-shrink-0">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
      </div>
      <main className="flex-1 p-6 bg-background overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
