import React, { useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { ArrowLeft, Eye, MapPin, Calendar, Mail, Phone } from 'lucide-react';

export default function UserListings() {
  const {
    userProfile,
    userListings,
    userListingsLoading,
    setSelectedProductId,
    setView,
    formatPrice
  } = useContext(ShopContext);

  const handleBackToCatalog = () => {
    setView('storefront');
    window.history.pushState(null, '', '/');
  };

  if (userListingsLoading) {
    return (
      <div className="container" style={{ padding: '8rem 2rem', textAlign: 'center' }}>
        <div className="anim-spin" style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--clr-primary-light)',
          borderTopColor: 'var(--clr-primary)',
          borderRadius: '50%',
          margin: '0 auto 1.5rem'
        }}></div>
        <p style={{ color: 'var(--clr-text-secondary)' }}>Retrieving user listings...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>User profile not found</h2>
        <button className="btn btn-primary" onClick={handleBackToCatalog} style={{ marginTop: '1rem' }}>
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="container anim-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Back navigation */}
      <button
        className="btn btn-secondary"
        onClick={handleBackToCatalog}
        style={{ marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
      >
        <ArrowLeft size={16} />
        Back to Catalog
      </button>

      {/* User profile banner header */}
      <section style={{
        background: 'linear-gradient(135deg, var(--clr-bg-card), var(--clr-bg-app))',
        border: '1px solid var(--clr-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Avatar circle */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-secondary))',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 800,
          border: '2px solid var(--clr-border)',
          boxShadow: 'var(--shadow-md)'
        }}>
          {userProfile.name.charAt(0).toUpperCase()}
        </div>

        {/* User Info Details */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>Classifieds Profile</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--clr-text-primary)' }}>
            {userProfile.name}
          </h1>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} />
              <span>{userProfile.email}</span>
            </div>
            {userProfile.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={14} />
                <span>{userProfile.phone}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} style={{ color: 'var(--clr-primary)' }} />
              <span>Registered region: Vietnam</span>
            </div>
          </div>
        </div>
      </section>

      {/* User listings catalog */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--clr-text-primary)' }}>
        Active Post Listings ({userListings.length})
      </h2>

      {userListings.length > 0 ? (
        <div className="product-grid">
          {userListings.map((prod) => {
            const formattedDate = new Date(prod.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });

            return (
              <article key={prod.id} className="product-card anim-scale-in">
                <div className="product-image-wrapper">
                  <div className="product-badge-overlay">
                    <span className="badge badge-primary">{prod.category}</span>
                  </div>
                  <img src={prod.image} alt={prod.title} className="product-card-img" />
                </div>

                <div className="product-card-info" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 160px)' }}>
                  <div className="product-card-category" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{prod.category}</span>
                    {prod.published === false && <span className="badge badge-warning" style={{ scale: '0.8' }}>Draft</span>}
                  </div>
                  <h3
                    className="product-card-title"
                    onClick={() => setSelectedProductId(prod.id)}
                    style={{ cursor: 'pointer', flex: '1', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    title={prod.title}
                  >
                    {prod.title}
                  </h3>

                  {/* Location & Time Stamp */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: '0.5rem 0', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} style={{ color: 'var(--clr-primary)' }} />
                      <span>{prod.location || 'Unknown Location'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} />
                      <span>Posted: {formattedDate}</span>
                    </div>
                  </div>

                  <div className="product-card-footer" style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '0.5rem', marginTop: 'auto' }}>
                    <span className="product-card-price" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--clr-primary)' }}>
                      {formatPrice(prod.price)}
                    </span>
                    
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      onClick={() => setSelectedProductId(prod.id)}
                      title="View Details"
                    >
                      <Eye size={14} />
                      Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '5rem 2rem',
          background: 'var(--clr-bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--clr-border)'
        }}>
          <span style={{ fontSize: '3.5rem' }}>📝</span>
          <h3 style={{ marginTop: '1rem', fontSize: '1.25rem', color: 'var(--clr-text-primary)' }}>No active listings</h3>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            You haven't posted any used items for sale yet.
          </p>
          <button className="btn btn-primary" onClick={handleBackToCatalog}>
            Browse Marketplace
          </button>
        </div>
      )}
    </div>
  );
}
