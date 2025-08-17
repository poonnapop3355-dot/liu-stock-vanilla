import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import ProductManagement from "@/components/ProductManagement";
import SalesManagement from "@/components/SalesManagement";
import EnhancedPOS from "@/components/EnhancedPOS";
import OrderManagement from "@/components/OrderManagement";
import CRMManagement from "@/components/CRMManagement";
import PrintLabel from "@/components/PrintLabel";
import AuthLogin from "@/components/AuthLogin";

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
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">User management coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Settings coming soon...</p>
          </div>
        );
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
