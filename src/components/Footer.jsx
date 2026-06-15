import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function Footer() {
  const { setView, setSelectedProductId, setSelectedCategory } = useContext(ShopContext);

  const handleFooterLink = (category) => {
    setView('storefront');
    setSelectedProductId(null);
    setSelectedCategory(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: Info */}
          <div className="footer-info">
            <div className="logo" style={{ marginBottom: '1rem' }}>
              <ShoppingBag size={24} style={{ color: 'hsl(var(--primary))' }} />
              Chotot Mall
              <span className="logo-dot"></span>
            </div>
            <p style={{ fontSize: '0.9rem', maxWidth: '300px' }}>
              Discover curated premium products from tech gadgets to fashion essentials. Handcrafted quality, fast shipping, and exceptional support.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <a href="#" className="theme-switch" style={{ width: '36px', height: '36px' }} aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" className="theme-switch" style={{ width: '36px', height: '36px' }} aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="theme-switch" style={{ width: '36px', height: '36px' }} aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Categories */}
          <div>
            <h4 className="footer-col-title">Shop Categories</h4>
            <div className="footer-links">
              <button onClick={() => handleFooterLink('All')} style={{ textAlign: 'left' }}>All Products</button>
              <button onClick={() => handleFooterLink('Electronics')} style={{ textAlign: 'left' }}>Electronics</button>
              <button onClick={() => handleFooterLink('Fashion')} style={{ textAlign: 'left' }}>Fashion & Apparel</button>
              <button onClick={() => handleFooterLink('Accessories')} style={{ textAlign: 'left' }}>Accessories</button>
            </div>
          </div>

          {/* Column 3: Links */}
          <div>
            <h4 className="footer-col-title">Support & Info</h4>
            <div className="footer-links">
              <a href="#">About Chotot</a>
              <a href="#">Track Orders</a>
              <a href="#">Returns & Exchanges</a>
              <a href="#">Frequently Asked Questions</a>
            </div>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="footer-col-title">Stay Updated</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)', marginBottom: '1rem' }}>
              Subscribe to get notified about sales, custom drops, and restocks.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} style={{ position: 'relative' }}>
              <input
                type="email"
                required
                placeholder="Your email address"
                className="form-input"
                style={{ borderRadius: 'var(--radius-full)', paddingRight: '3rem', fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                className="btn-primary"
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label="Subscribe"
              >
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright details */}
        <div className="footer-bottom">
          <div>&copy; {new Date().getFullYear()} Chotot Mall. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
