import React, { useContext } from 'react';
import { ShopContext } from './context/ShopContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Storefront Components
import ProductGrid from './components/storefront/ProductGrid';
import ProductDetail from './components/storefront/ProductDetail';
import CartDrawer from './components/storefront/CartDrawer';
import Checkout from './components/storefront/Checkout';
import AuthModal from './components/storefront/AuthModal';

// Admin Components
import AnalyticsDashboard from './components/admin/AnalyticsDashboard';
import ProductManagement from './components/admin/ProductManagement';
import OrderManagement from './components/admin/OrderManagement';
import CustomerManagement from './components/admin/CustomerManagement';

// Icons for Admin Navigation
import { LayoutDashboard, ShoppingBag, ShoppingCart, Users, ChevronRight } from 'lucide-react';

function App() {
  const {
    view,
    setView,
    adminTab,
    setAdminTab,
    selectedProductId
  } = useContext(ShopContext);

  // Render storefront dynamic states
  const renderStorefrontContent = () => {
    if (selectedProductId !== null) {
      return <ProductDetail />;
    }
    return <ProductGrid />;
  };

  // Render admin tab contents
  const renderAdminTabContent = () => {
    switch (adminTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'customers':
        return <CustomerManagement />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Sticky Header */}
      <Header />

      {/* Main View Router */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {view === 'storefront' && renderStorefrontContent()}
        
        {view === 'checkout' && <Checkout />}

        {view === 'admin' && (
          <div className="admin-shell">
            {/* Admin Sidebar Dashboard Switcher */}
            <aside className="admin-sidebar anim-fade-in">
              <div
                className={`admin-nav-item ${adminTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setAdminTab('dashboard')}
              >
                <LayoutDashboard size={18} />
                Dashboard Metrics
                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: adminTab === 'dashboard' ? 1 : 0 }} />
              </div>
              
              <div
                className={`admin-nav-item ${adminTab === 'products' ? 'active' : ''}`}
                onClick={() => setAdminTab('products')}
              >
                <ShoppingBag size={18} />
                Manage Posts
                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: adminTab === 'products' ? 1 : 0 }} />
              </div>
              
              <div
                className={`admin-nav-item ${adminTab === 'orders' ? 'active' : ''}`}
                onClick={() => setAdminTab('orders')}
              >
                <ShoppingCart size={18} />
                Order Tracking
                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: adminTab === 'orders' ? 1 : 0 }} />
              </div>
              
              <div
                className={`admin-nav-item ${adminTab === 'customers' ? 'active' : ''}`}
                onClick={() => setAdminTab('customers')}
              >
                <Users size={18} />
                Customers Database
                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: adminTab === 'customers' ? 1 : 0 }} />
              </div>
            </aside>

            {/* Admin Page Content */}
            <div className="admin-content">
              {renderAdminTabContent()}
            </div>
          </div>
        )}
      </main>

      {/* Shopping Drawer (slides over storefront when trigger button is clicked) */}
      <CartDrawer />

      {/* Authentication Modal Overlay */}
      <AuthModal />

      {/* Customer Footer (Hidden in Admin Panel views for a clean workspace) */}
      {view !== 'admin' && <Footer />}
    </div>
  );
}

export default App;
