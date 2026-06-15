import React, { useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { Star, ShoppingCart, SlidersHorizontal, Eye } from 'lucide-react';

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
    addToCart
  } = useContext(ShopContext);

  // Filter & Sort Logic
  const filteredProducts = products
    .filter((prod) => {
      // Category Filter
      if (selectedCategory !== 'All' && prod.category !== selectedCategory) {
        return false;
      }
      // Price Filter
      if (prod.price > priceRange) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          prod.title.toLowerCase().includes(query) ||
          prod.description.toLowerCase().includes(query) ||
          prod.category.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low-high') return a.price - b.price;
      if (sortBy === 'price-high-low') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // Default Featured (natural database order)
    });

  const categoriesList = ['All', 'Electronics', 'Fashion', 'Accessories'];

  return (
    <div className="container anim-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Promos Banner Hero */}
      {!searchQuery && selectedCategory === 'All' && (
        <section className="hero-section">
          <div className="hero-content">
            <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>Summer Drop 2026</span>
            <h1 className="hero-title">Elevate Your Everyday Essentials</h1>
            <p className="hero-subtitle">
              Explore premium gear, lifestyle fashion, and cutting-edge tech gadgets curated just for you. Free shipping on orders over $150.
            </p>
            <button className="btn btn-primary" onClick={() => document.getElementById('catalog-anchor')?.scrollIntoView({ behavior: 'smooth' })}>
              Browse Collection
            </button>
          </div>
          <div style={{ position: 'relative', width: '40%', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Visual aesthetic element */}
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
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--clr-text-primary)' }}>Up to 40% Off</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>Limited Stock Available</span>
            </div>
          </div>
        </section>
      )}

      {/* Catalog Split Layout */}
      <div id="catalog-anchor" className="storefront-layout">
        {/* Sidebar Filters */}
        <aside className="catalog-sidebar">
          <div className="sidebar-title">Filters</div>

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
          <div className="filter-section">
            <div className="filter-heading">
              Max Price: <span style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>${priceRange}</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--clr-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>
              <span>$10</span>
              <span>$1000</span>
            </div>
          </div>

          {/* Reset Filters button */}
          {(selectedCategory !== 'All' || priceRange < 1000 || searchQuery) && (
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => {
                setSelectedCategory('All');
                setPriceRange(1000);
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
              Showing <span style={{ fontWeight: 700, color: 'var(--clr-text-primary)' }}>{filteredProducts.length}</span> products
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
                <option value="rating">Average Rating</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="product-grid">
              {filteredProducts.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const firstColor = prod.colors && prod.colors.length > 0 ? prod.colors[0] : '#000000';
                const firstSize = prod.sizes && prod.sizes.length > 0 ? prod.sizes[0] : 'Standard';

                return (
                  <article key={prod.id} className="product-card anim-scale-in">
                    <div className="product-image-wrapper">
                      {/* Product badges overlay */}
                      <div className="product-badge-overlay">
                        {isOutOfStock ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : prod.stock < 5 ? (
                          <span className="badge badge-warning">Only {prod.stock} left</span>
                        ) : (
                          <span className="badge badge-primary">{prod.category}</span>
                        )}
                      </div>
                      <img src={prod.image} alt={prod.title} className="product-card-img" />
                    </div>

                    <div className="product-card-info">
                      <div className="product-card-category">{prod.category}</div>
                      <h3
                        className="product-card-title"
                        onClick={() => setSelectedProductId(prod.id)}
                        style={{ cursor: 'pointer' }}
                        title={prod.title}
                      >
                        {prod.title}
                      </h3>

                      {/* Ratings stars */}
                      <div className="product-rating">
                        <Star size={14} fill="currentColor" />
                        <span>{prod.rating}</span>
                        <span className="product-rating-count">({prod.reviewsCount})</span>
                      </div>

                      <div className="product-card-footer">
                        <span className="product-card-price">${prod.price.toFixed(2)}</span>
                        
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            className="icon-action-btn"
                            title="Quick View"
                            onClick={() => setSelectedProductId(prod.id)}
                          >
                            <Eye size={16} />
                          </button>
                          
                          <button
                            className="btn-primary btn"
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: 0,
                              borderRadius: 'var(--radius-sm)'
                            }}
                            disabled={isOutOfStock}
                            onClick={() => addToCart(prod, firstColor, firstSize, 1)}
                            title={isOutOfStock ? 'Out of Stock' : 'Quick Add to Cart'}
                          >
                            <ShoppingCart size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'var(--clr-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
              <h3 style={{ marginTop: '1rem', fontSize: '1.25rem' }}>No products match your filters</h3>
              <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Try adjusting your search criteria, price range, or categories sidebar.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
