import React, { useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { X, Trash2, ShoppingCart } from 'lucide-react';

export default function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQty,
    removeFromCart,
    setView,
    setSelectedProductId
  } = useContext(ShopContext);

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const FREE_SHIPPING_THRESHOLD = 150;
  const shippingReminder = FREE_SHIPPING_THRESHOLD - subtotal;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    setSelectedProductId(null);
    setView('checkout');
  };

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.15rem' }}>
            <ShoppingCart size={20} />
            Your Shopping Cart
          </div>
          <button className="theme-switch" onClick={() => setIsCartOpen(false)} style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body (Scrollable items) */}
        <div className="cart-items-list">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.cartItemId} className="cart-item anim-scale-in">
                <img src={item.image} alt={item.title} className="cart-item-img" />
                
                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.title}</h4>
                  
                  {/* Selected options metadata */}
                  <div className="cart-item-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      Color:
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: item.color,
                          border: '1px solid var(--clr-border)',
                          display: 'inline-block'
                        }}
                      />
                    </div>
                    <div>Size: {item.size}</div>
                  </div>

                  {/* Quantity adjustments & pricing */}
                  <div className="cart-item-price-qty">
                    <div className="quantity-selector" style={{ borderScale: 0.8 }}>
                      <button
                        className="qty-btn"
                        style={{ width: '28px', height: '28px' }}
                        onClick={() => updateCartQty(item.cartItemId, item.qty - 1)}
                      >
                        -
                      </button>
                      <span style={{ padding: '0 0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>{item.qty}</span>
                      <button
                        className="qty-btn"
                        style={{ width: '28px', height: '28px' }}
                        disabled={item.qty >= item.maxStock}
                        onClick={() => updateCartQty(item.cartItemId, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="cart-item-price">${(item.price * item.qty).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        style={{ color: 'var(--clr-text-muted)' }}
                        className="icon-action-btn delete-btn"
                        title="Remove Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--clr-text-muted)' }}>
              <ShoppingCart size={48} style={{ strokeWidth: 1, margin: '0 auto 1.5rem', opacity: 0.5 }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--clr-text-primary)' }}>Your cart is empty</h4>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Add some products from the storefront catalog to checkout.</p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            {/* Free shipping banner */}
            {shippingReminder > 0 ? (
              <div
                className="badge badge-warning"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '0.5rem',
                  marginBottom: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem'
                }}
              >
                Add <span style={{ fontWeight: 800 }}>${shippingReminder.toFixed(2)}</span> more to qualify for <span style={{ fontWeight: 800 }}>FREE SHIPPING!</span>
              </div>
            ) : (
              <div
                className="badge badge-success"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '0.5rem',
                  marginBottom: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem'
                }}
              >
                🎉 You qualified for <span style={{ fontWeight: 800 }}>FREE SHIPPING!</span>
              </div>
            )}

            <div className="cart-subtotal-row">
              <span>Subtotal</span>
              <span style={{ color: 'var(--clr-primary)' }}>${subtotal.toFixed(2)}</span>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} onClick={handleCheckoutClick}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
