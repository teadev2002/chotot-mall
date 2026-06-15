import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { Sun, Moon, ShoppingBag, Search, User } from 'lucide-react';

export default function Header() {
  const {
    theme,
    toggleTheme,
    view,
    setView,
    searchQuery,
    setSearchQuery,
    setSelectedProductId,
    currentUser,
    setIsAuthModalOpen,
    logout,
    loadUserListings
  } = useContext(ShopContext);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogoClick = () => {
    setView('storefront');
    setSelectedProductId(null);
    window.history.pushState(null, '', '/');
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Brand Logo */}
        <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <ShoppingBag size={24} strokeWidth={2.5} style={{ color: 'hsl(var(--primary))' }} />
          Chợ Tốt
          <span className="logo-dot"></span>
        </div>

        {/* Global Search Bar (Only display in Storefront Catalog view) */}
        <div className="search-bar-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search posts by title, location, category..."
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

          {/* Sign In / Sign Up Trigger OR Profile controls */}
          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: 0
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </button>

              {isDropdownOpen && (
                <>
                  {/* Invisible backdrop to close dropdown on click outside */}
                  <div
                    onClick={() => setIsDropdownOpen(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998
                    }}
                  />
                  <div
                    className="anim-scale-in"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      background: 'var(--clr-bg-card)',
                      border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '0.5rem 0',
                      minWidth: '180px',
                      zIndex: 999,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--clr-border)', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--clr-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {currentUser.email}
                      </div>
                    </div>
                    
                    <button
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--clr-text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        width: '100%'
                      }}
                      className="dropdown-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        loadUserListings(currentUser.id);
                      }}
                    >
                      My Listings
                    </button>
                    
                    {currentUser.role === 'ADMIN' && (
                      <button
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          color: 'var(--clr-text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          width: '100%'
                        }}
                        className="dropdown-item"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setView('admin');
                        }}
                      >
                        Admin Panel
                      </button>
                    )}
                    
                    <div style={{ height: '1px', background: 'var(--clr-border)', margin: '0.25rem 0' }}></div>
                    
                    <button
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        color: 'var(--clr-danger)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        width: '100%',
                        fontWeight: 600
                      }}
                      className="dropdown-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        logout();
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
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
