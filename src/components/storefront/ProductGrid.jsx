import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { SlidersHorizontal, Eye, MapPin, Calendar } from 'lucide-react';
import { fetchUserAddress } from '../../services/userService';

export default function ProductGrid() {
  const {
    products,
    setSelectedProductId,
    searchQuery,
    selectedCategory,
    setSelectedCategory,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    formatPrice
  } = useContext(ShopContext);

  const [productLocations, setProductLocations] = useState({});

  useEffect(() => {
    if (!products || products.length === 0) return;

    const fetchLocations = async () => {
      const authorIds = [...new Set(products.map((p) => p.authorId).filter(Boolean))];
      const idsToFetch = authorIds.filter((id) => !productLocations[id]);
      if (idsToFetch.length === 0) return;

      try {
        const fetchedLocations = await Promise.all(
          idsToFetch.map(async (authorId) => {
            try {
              const address = await fetchUserAddress(authorId);
              if (address) {
                const formatted = `${address.street}, ${address.ward}, ${address.district}, ${address.city}`;
                return { authorId, location: formatted };
              }
              return { authorId, location: null };
            } catch (err) {
              console.error(`Failed to fetch address for author ${authorId}:`, err);
              return { authorId, location: null };
            }
          })
        );

        const newLocationsMap = {};
        fetchedLocations.forEach((item) => {
          if (item.location) {
            newLocationsMap[item.authorId] = item.location;
          }
        });

        setProductLocations((prev) => ({
          ...prev,
          ...newLocationsMap
        }));
      } catch (err) {
        console.error('Failed to resolve product locations:', err);
      }
    };

    fetchLocations();
  }, [products]);

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((prod) => {
      // Category Filter
      if (selectedCategory !== 'All' && prod.category !== selectedCategory) {
        return false;
      }
      // Price Filter (only apply price filter if product has a price)
      if (prod.price !== null && prod.price !== undefined && prod.price > priceRange) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          prod.title.toLowerCase().includes(query) ||
          prod.description.toLowerCase().includes(query) ||
          prod.category.toLowerCase().includes(query) ||
          (prod.location && prod.location.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      const aPrice = a.price !== null ? a.price : 0;
      const bPrice = b.price !== null ? b.price : 0;
      if (sortBy === 'price-low-high') return aPrice - bPrice;
      if (sortBy === 'price-high-low') return bPrice - aPrice;
      return 0; // Default Featured (natural database order)
    });

  const categoriesList = ['All', 'Electronics', 'Fashion', 'Accessories'];

  return (
    <div className="container anim-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Promos Banner Hero */}
      {!searchQuery && selectedCategory === 'All' && (
        <section className="hero-section">
          <div className="hero-content">
            <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>Used Goods Marketplace</span>
            <h1 className="hero-title">Buy & Sell Local Used Goods</h1>
            <p className="hero-subtitle">
              Browse listings in your community, contact sellers directly, and settle transactions safely in person. Post your items for free today!
            </p>
            <button className="btn btn-primary" onClick={() => document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' })}>
              Browse Listings
            </button>
          </div>
          <div style={{ position: 'relative', width: '40%', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(45deg, var(--clr-primary), var(--clr-secondary))',
              transform: 'rotate(15deg)',
              boxShadow: 'var(--shadow-xl)',
              position: 'absolute',
              opacity: 0.8
            }}></div>
            <div style={{
              width: '180px',
              height: '180px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--clr-bg-card)',
              border: '1px solid var(--clr-border)',
              transform: 'rotate(-10deg)',
              boxShadow: 'var(--shadow-lg)',
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤝</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--clr-text-primary)' }}>C2C Exchange</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>Safe Offline Deals</span>
            </div>
          </div>
        </section>
      )}

      {/* Catalog Split Layout */}
      <div id="catalog-anchor" className="storefront-layout">
        {/* Sidebar Filters */}
        <aside className="catalog-sidebar">
          <div className="sidebar-title">Filter Listings</div>

          {/* Categories Filter */}
          <div className="filter-section">
            <div className="filter-heading">Categories</div>
            <div className="filter-list">
              {categoriesList.map((cat) => (
                <label key={cat} className="filter-item">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat}
                    onChange={() => setSelectedCategory(cat)}
                    style={{ marginRight: '0.5rem', accentColor: 'var(--clr-primary)' }}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          {(() => {
            const maxPriceVal = products.length > 0 ? Math.max(...products.map((p) => p.price || 0), 1000) : 1000;
            return (
              <div className="filter-section">
                <div className="filter-heading">
                  Max Price: <span style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>{formatPrice(priceRange)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxPriceVal}
                  step={maxPriceVal > 1000000 ? 500000 : maxPriceVal > 10000 ? 1000 : 10}
                  value={priceRange > maxPriceVal ? maxPriceVal : priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--clr-primary)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>
                  <span>Min</span>
                  <span>{formatPrice(maxPriceVal)}</span>
                </div>
              </div>
            );
          })()}

          {/* Reset Filters button */}
          {(selectedCategory !== 'All' || priceRange < 50000000 || searchQuery) && (
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => {
                setSelectedCategory('All');
                setPriceRange(50000000);
                setSearchQuery('');
              }}
            >
              Reset Filters
            </button>
          )}
        </aside>

        {/* Products Display Area */}
        <main className="catalog-content">
          <div className="catalog-header">
            <div style={{ color: 'var(--clr-text-secondary)', fontSize: '0.95rem' }}>
              Showing <span style={{ fontWeight: 700, color: 'var(--clr-text-primary)' }}>{filteredProducts.length}</span> classified listings
            </div>

            {/* Sorting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={14} style={{ color: 'var(--clr-text-muted)' }} />
              <select
                className="form-select"
                style={{ padding: '0.35rem 1.5rem 0.35rem 0.75rem', width: 'auto', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((prod) => {
                const formattedDate = new Date(prod.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <article key={prod.id} className="product-card anim-scale-in">
                    <div className="product-image-wrapper">
                      {/* Product badges overlay */}
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

                      {/* Location & Time Stamp for Classifieds */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: '0.5rem 0', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={12} style={{ color: 'var(--clr-primary)' }} />
                          <span>{productLocations[prod.authorId] || prod.location || 'Unknown Location'}</span>
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
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--clr-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <h3 style={{ marginTop: '1rem', fontSize: '1.25rem' }}>No listings match your filters</h3>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Try adjusting your search criteria, category choice, or price range.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
