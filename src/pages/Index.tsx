import { useState } from "react";
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
import AuthLogin from "@/components/AuthLogin";
import BookManagement from "@/components/BookManagement";
import BookstorePOS from "@/components/BookstorePOS";
import UserGuide from "@/components/UserGuide";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  if (!isAuthenticated) {
    return <AuthLogin onLogin={() => setIsAuthenticated(true)} />;
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
