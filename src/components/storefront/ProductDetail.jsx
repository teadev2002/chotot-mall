import React, { useState, useContext, useEffect, useRef } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { ArrowLeft, Phone, MessageCircle, MapPin, Calendar, User, Send, ShieldAlert, Check } from 'lucide-react';

export default function ProductDetail() {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    currentUser,
    setIsAuthModalOpen,
    formatPrice
  } = useContext(ShopContext);

  const product = products.find((p) => p.id === selectedProductId);

  // Fallback if product not found
  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>Listing not found</h2>
        <button className="btn btn-primary" onClick={() => setSelectedProductId(null)} style={{ marginTop: '1rem' }}>
          Back to Listings
        </button>
      </div>
    );
  }

  // Classifieds interactions states
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // Generate a mock phone number based on the author ID
  const mockPhone = `090${(product.authorId * 13) % 10}${(product.id * 17) % 1000000}`;
  // Masked version
  const maskedPhone = `${mockPhone.substring(0, 4)} ••• •••`;

  useEffect(() => {
    setPhoneRevealed(false);
    setPhoneCopied(false);
    setIsChatOpen(false);
    setChatMessages([
      { sender: 'seller', text: `Hi! Thanks for showing interest in my listing "${product.title}". Is there anything specific you would like to know?`, time: 'Just now' }
    ]);
    window.scrollTo(0, 0);
  }, [product]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  const handleRevealPhone = () => {
    if (!phoneRevealed) {
      setPhoneRevealed(true);
      navigator.clipboard.writeText(mockPhone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } else {
      navigator.clipboard.writeText(mockPhone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    }
  };

  const handleOpenChat = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsChatOpen(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'buyer', text: userMessage, time: 'Just now' }]);
    setChatInput('');

    // Trigger mock auto-reply after 1.2s delay
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      const lowerMsg = userMessage.toLowerCase();
      let reply = "I can meet you this weekend to show it to you. Let me know what time works best!";
      
      if (lowerMsg.includes('price') || lowerMsg.includes('discount') || lowerMsg.includes('cheap')) {
        reply = `The price is negotiable, but I cannot go too low. What price were you thinking?`;
      } else if (lowerMsg.includes('condition') || lowerMsg.includes('new') || lowerMsg.includes('damage')) {
        reply = `It is in good condition, exactly as shown in the pictures. Feel free to inspect it in person before buying.`;
      } else if (lowerMsg.includes('where') || lowerMsg.includes('address') || lowerMsg.includes('meet')) {
        reply = `I am located around ${product.location || 'District 1, HCMC'}. Where are you coming from?`;
      } else if (lowerMsg.includes('original') || lowerMsg.includes('box') || lowerMsg.includes('receipt')) {
        reply = `I don't have the original purchase receipt, but you are welcome to verify and test the serial number.`;
      }

      setChatMessages((prev) => [...prev, { sender: 'seller', text: reply, time: 'Just now' }]);
    }, 1200);
  };

  const formattedDate = new Date(product.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="container anim-fade-in" style={{ padding: '2rem 1.5rem', position: 'relative' }}>
      {/* Back navigation */}
      <button
        className="btn btn-secondary"
        onClick={() => setSelectedProductId(null)}
        style={{ marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
      >
        <ArrowLeft size={16} />
        Back to Listings
      </button>

      {/* Product Detail Layout */}
      <div className="product-detail-layout">
        {/* Gallery column */}
        <div className="product-gallery">
          <div className="main-image-container">
            <img src={product.image} alt={product.title} />
          </div>
          {/* Static details helper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--clr-bg-app)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginTop: '1rem' }}>
            <ShieldAlert size={20} style={{ color: 'var(--clr-warning)', flexShrink: 0 }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>
              <strong>Safety Reminder:</strong> Meet the seller in a public place, inspect the item thoroughly, and do not make payments in advance.
            </div>
          </div>
        </div>

        {/* Detailed info column */}
        <div className="detail-info">
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>{product.category}</span>
            <h1 className="detail-title">{product.title}</h1>
          </div>

          {/* Location & Time Info */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--clr-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={16} style={{ color: 'var(--clr-primary)' }} />
              <strong>{product.location}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={16} />
              <span>Posted: {formattedDate}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={16} />
              <span>Seller ID: #{product.authorId}</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="detail-price-row" style={{ margin: '1.5rem 0 1rem' }}>
            <span className="detail-price" style={{ color: 'var(--clr-primary)', fontSize: '2rem', fontWeight: 800 }}>
              {formatPrice(product.price)}
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>Active Listing</span>
          </div>

          <div className="checkout-divider" style={{ margin: '1.5rem 0' }}></div>

          {/* Short description */}
          <div style={{ margin: '1.5rem 0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--clr-text-primary)' }}>Description</h3>
            <p className="detail-description" style={{ color: 'var(--clr-text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>
              {product.description}
            </p>
          </div>

          <div className="checkout-divider" style={{ margin: '1.5rem 0' }}></div>

          {/* Classifieds Contact Box */}
          <div style={{ background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--clr-text-primary)' }}>Interested in this item? Contact Seller</h3>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Phone reveal button */}
              <button
                className={`btn ${phoneRevealed ? 'btn-success' : 'btn-primary'}`}
                style={{
                  flex: 1,
                  minWidth: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem'
                }}
                onClick={handleRevealPhone}
              >
                {phoneCopied ? <Check size={18} /> : <Phone size={18} />}
                <span>
                  {phoneRevealed ? mockPhone : maskedPhone}
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.85, marginLeft: 'auto', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '0.5rem' }}>
                  {phoneCopied ? 'Copied!' : 'Show & Copy'}
                </span>
              </button>

              {/* Chat trigger */}
              <button
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem',
                  border: '1px solid var(--clr-border)'
                }}
                onClick={handleOpenChat}
              >
                <MessageCircle size={18} />
                <span>Chat with Seller</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table Section */}
      <div className="reviews-section" style={{ marginTop: '3rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--clr-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', color: 'var(--clr-text-primary)' }}>
          Detailed Specifications
        </h3>
        
        <div className="anim-fade-in" style={{ color: 'var(--clr-text-secondary)', lineHeight: 1.8 }}>
          <table className="admin-table" style={{ background: 'var(--clr-bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, width: '240px' }}>Category</td>
                <td>{product.category}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Location Location</td>
                <td>{product.location || 'Ho Chi Minh City, Vietnam'}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Date Created</td>
                <td>{new Date(product.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Last Updated</td>
                <td>{new Date(product.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              
              {/* Optional dimensions */}
              {(product.length !== null || product.width !== null || product.height !== null) && (
                <tr>
                  <td style={{ fontWeight: 600 }}>Dimensions (L x W x H)</td>
                  <td>
                    {product.length || 0} cm x {product.width || 0} cm x {product.height || 0} cm
                  </td>
                </tr>
              )}
              {product.weight !== null && (
                <tr>
                  <td style={{ fontWeight: 600 }}>Weight</td>
                  <td>{product.weight} kg</td>
                </tr>
              )}

              <tr>
                <td style={{ fontWeight: 600 }}>Seller Account ID</td>
                <td>User #{product.authorId}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Listing Status</td>
                <td>{product.published ? 'Active & Published' : 'Draft / Private'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Chat Widget */}
      {isChatOpen && (
        <div
          className="anim-scale-in"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '360px',
            height: '460px',
            background: 'var(--clr-bg-card)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-2xl)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden'
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >
                S
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Seller #{product.authorId}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Active on platform</div>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '1.25rem',
                cursor: 'pointer',
                opacity: 0.8
              }}
            >
              &times;
            </button>
          </div>

          {/* Chat Messages */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              background: 'var(--clr-bg-app)'
            }}
          >
            {chatMessages.map((msg, idx) => {
              const isSeller = msg.sender === 'seller';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isSeller ? 'flex-start' : 'flex-end',
                    maxWidth: '80%',
                    background: isSeller ? 'var(--clr-bg-card)' : 'var(--clr-primary)',
                    color: isSeller ? 'var(--clr-text-primary)' : 'white',
                    padding: '0.65rem 0.85rem',
                    borderRadius: isSeller ? '0 12px 12px 12px' : '12px 12px 0 12px',
                    border: isSeller ? '1px solid var(--clr-border)' : 'none',
                    fontSize: '0.85rem',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>{msg.text}</div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      opacity: 0.6,
                      textAlign: 'right',
                      marginTop: '0.25rem'
                    }}
                  >
                    {msg.time}
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: 'var(--clr-bg-card)',
                  color: 'var(--clr-text-secondary)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '0 12px 12px 12px',
                  border: '1px solid var(--clr-border)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span style={{ fontSize: '0.75rem' }}>Typing</span>
                <span className="anim-pulse" style={{ animationDelay: '0s' }}>•</span>
                <span className="anim-pulse" style={{ animationDelay: '0.2s' }}>•</span>
                <span className="anim-pulse" style={{ animationDelay: '0.4s' }}>•</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '0.75rem',
              background: 'var(--clr-bg-card)',
              borderTop: '1px solid var(--clr-border)',
              display: 'flex',
              gap: '0.5rem'
            }}
          >
            <input
              type="text"
              className="form-input"
              style={{
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
                height: '36px',
                padding: '0 1rem'
              }}
              placeholder="Ask the seller about the item..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
