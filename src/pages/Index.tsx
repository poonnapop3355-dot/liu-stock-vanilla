import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
        return <BookManagement />;
      case 'bookstore-pos':
        return <BookstorePOS />;
      case 'products':
        return <ProductManagement />;
      case 'sales':
        return <SalesManagement />;
      case 'pos':
        return <EnhancedPOS />;
      case 'orders':
        return <OrderManagement />;
      case 'crm':
        return <CRMManagement />;
      case 'print':
        return <PrintLabel />;
      case 'users':
        return <UserManagement />;
      case 'guide':
        return <UserGuide />;
      case 'settings':
        return <Settings />;
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
