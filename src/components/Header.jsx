import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Sun, Moon, ShoppingCart, LayoutDashboard, ShoppingBag, Search, User, LogOut } from 'lucide-react';

export default function Header() {
  const {
    theme,
    toggleTheme,
    view,
    setView,
    cart,
    setIsCartOpen,
    searchQuery,
    setSearchQuery,
    setSelectedProductId,
    currentUser,
    setIsAuthModalOpen,
    logout
  } = useContext(ShopContext);

  const cartItemsCount = cart.reduce((total, item) => total + item.qty, 0);

  const handleLogoClick = () => {
    setView('storefront');
    setSelectedProductId(null);
  };

  const handleViewToggle = () => {
    if (view === 'storefront') {
      setView('admin');
    } else {
      setView('storefront');
    }
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Brand Logo */}
        <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <ShoppingBag size={24} strokeWidth={2.5} style={{ color: 'hsl(var(--primary))' }} />
          Chotot Mall
          <span className="logo-dot"></span>
        </div>

        {/* Global Search Bar (Only display in Storefront Catalog view) */}
        <div className="search-bar-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search products by title, details..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Clear product detailed view if user starts searching
              setSelectedProductId(null);
              // Ensure we are in storefront catalog
              setView('storefront');
            }}
          />
        </div>

        {/* Actions panel */}
        <div className="header-actions">
          {/* Light / Dark Mode Toggle */}
          <button
            className="theme-switch"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Cart Icon (Only available in Storefront view) */}
          {view === 'storefront' && (
            <button
              className="theme-switch icon-btn-badge"
              onClick={() => setIsCartOpen(true)}
              title="Open Cart"
            >
              <ShoppingCart size={20} />
              {cartItemsCount > 0 && (
                <span className="badge-count anim-scale-in">{cartItemsCount}</span>
              )}
            </button>
          )}

          {/* Sign In / Sign Up Trigger OR Profile controls */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                title={`Logged in as ${currentUser.name} (${currentUser.email})`}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: '1px solid var(--clr-border)',
                  cursor: 'default',
                  userSelect: 'none'
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <button
                className="theme-switch"
                style={{ width: '38px', height: '38px' }}
                onClick={logout}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={() => setIsAuthModalOpen(true)}
              title="Sign In or Sign Up"
            >
              <User size={15} />
              Sign In
            </button>
          )}

          {/* Switch View Trigger (Only visible to authenticated Administrators) */}

        </div>
      </div>
    </header>
  );
}
