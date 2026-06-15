import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { Star, ShoppingCart, ArrowLeft, Send } from 'lucide-react';

export default function ProductDetail() {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    addToCart,
    addProductReview
  } = useContext(ShopContext);

  const product = products.find((p) => p.id === selectedProductId);

  // Fallback if product not found
  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <button className="btn btn-primary" onClick={() => setSelectedProductId(null)} style={{ marginTop: '1rem' }}>
          Back to Catalog
        </button>
      </div>
    );
  }

  // Local component states
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description'); // 'description' or 'reviews'
  
  // Review form states
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Set default selected options when product changes
  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : '');
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
      setQty(1);
      setReviewSuccess(false);
      setReviewError('');
    }
    window.scrollTo(0, 0);
  }, [product]);

  const handleAddToCart = () => {
    if (product.stock <= 0) return;
    addToCart(product, selectedColor, selectedSize, qty);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess(false);

    if (!reviewerName.trim()) {
      setReviewError('Please enter your name.');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Please write a review comment.');
      return;
    }

    addProductReview(product.id, {
      author: reviewerName,
      rating: reviewRating,
      comment: reviewComment
    });

    setReviewerName('');
    setReviewRating(5);
    setReviewComment('');
    setReviewSuccess(true);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="container anim-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Back navigation */}
      <button
        className="btn btn-secondary"
        onClick={() => setSelectedProductId(null)}
        style={{ marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
      >
        <ArrowLeft size={16} />
        Back to Catalog
      </button>

      {/* Product Detail Layout */}
      <div className="product-detail-layout">
        {/* Gallery column */}
        <div className="product-gallery">
          <div className="main-image-container">
            <img src={product.image} alt={product.title} />
          </div>
          {/* Thumbnail preview - since mock, we repeat the main image or show visual variants */}
          <div className="gallery-thumbnails">
            <button className="thumb-btn active">
              <img src={product.image} alt="Thumbnail 1" />
            </button>
            <button className="thumb-btn">
              <img src={product.image} alt="Thumbnail 2" style={{ filter: 'hue-rotate(45deg)' }} />
            </button>
            <button className="thumb-btn">
              <img src={product.image} alt="Thumbnail 3" style={{ filter: 'hue-rotate(90deg)' }} />
            </button>
          </div>
        </div>

        {/* Detailed info column */}
        <div className="detail-info">
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>{product.category}</span>
            <h1 className="detail-title">{product.title}</h1>
          </div>

          {/* Ratings Summary */}
          <div className="product-rating" style={{ fontSize: '1rem' }}>
            <div style={{ display: 'flex', color: 'var(--clr-warning)' }}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  fill={i < Math.round(product.rating) ? 'currentColor' : 'none'}
                  stroke="currentColor"
                />
              ))}
            </div>
            <span style={{ fontWeight: 'bold', marginLeft: '0.25rem' }}>{product.rating}</span>
            <span className="product-rating-count" style={{ fontSize: '0.85rem' }}>
              ({product.reviewsCount} customer reviews)
            </span>
          </div>

          {/* Pricing */}
          <div className="detail-price-row">
            <span className="detail-price">${product.price.toFixed(2)}</span>
            {isOutOfStock ? (
              <span className="badge badge-danger" style={{ fontSize: '0.85rem' }}>Out of Stock</span>
            ) : product.stock < 5 ? (
              <span className="badge badge-warning" style={{ fontSize: '0.85rem' }}>Low Stock: Only {product.stock} items left</span>
            ) : (
              <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>In Stock ({product.stock} available)</span>
            )}
          </div>

          {/* Short description */}
          <p className="detail-description">{product.description}</p>

          {/* Product Options selectors */}
          {!isOutOfStock && (
            <div className="detail-options">
              {/* Colors Option */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <div className="form-label" style={{ fontWeight: 600 }}>Select Color</div>
                  <div className="color-option-list">
                    {product.colors.map((color) => (
                      <div key={color} className="color-dot-wrapper">
                        <input
                          type="radio"
                          name="product-color"
                          id={`color-${color}`}
                          className="color-dot-input"
                          checked={selectedColor === color}
                          onChange={() => setSelectedColor(color)}
                        />
                        <label
                          htmlFor={`color-${color}`}
                          className="color-dot-visual"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes Option */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="form-label" style={{ fontWeight: 600 }}>Select Size / Model</div>
                  <div className="size-option-list">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selector & Add to cart */}
              <div>
                <div className="form-label" style={{ fontWeight: 600 }}>Quantity</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="quantity-selector">
                    <button
                      className="qty-btn"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                    >
                      -
                    </button>
                    <input
                      type="text"
                      className="qty-input"
                      value={qty}
                      readOnly
                    />
                    <button
                      className="qty-btn"
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      disabled={qty >= product.stock}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.75rem 2rem' }}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart size={18} />
                    Add to Shopping Cart
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs description and reviews section */}
      <div className="reviews-section">
        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--clr-border)', marginBottom: '2rem' }}>
          <button
            style={{
              padding: '1rem 0',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: activeTab === 'description' ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
              borderBottom: activeTab === 'description' ? '2px solid var(--clr-primary)' : '2px solid transparent',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('description')}
          >
            Product Specifications
          </button>
          <button
            style={{
              padding: '1rem 0',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: activeTab === 'reviews' ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
              borderBottom: activeTab === 'reviews' ? '2px solid var(--clr-primary)' : '2px solid transparent',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('reviews')}
          >
            Customer Reviews ({product.reviewsCount})
          </button>
        </div>

        {activeTab === 'description' ? (
          <div className="anim-fade-in" style={{ color: 'var(--clr-text-secondary)', lineHeight: 1.8 }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--clr-text-primary)' }}>Technical Specifications</h3>
            <table className="admin-table" style={{ background: 'var(--clr-bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, width: '240px' }}>Category</td>
                  <td>{product.category}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Brand Manufacturer</td>
                  <td>Chotot Signature Studio</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Warranty Duration</td>
                  <td>12 Months Standard Replacement</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Available Stock</td>
                  <td>{product.stock} items remaining in warehouse</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="reviews-grid anim-fade-in">
            {/* Left Column: Review Form */}
            <div className="reviews-summary">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem' }}>Write a Customer Review</h3>
              
              {reviewSuccess && (
                <div className="badge badge-success" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  Thank you! Your review has been added.
                </div>
              )}
              {reviewError && (
                <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  {reviewError}
                </div>
              )}

              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="reviewer-name">Your Full Name</label>
                  <input
                    type="text"
                    id="reviewer-name"
                    className="form-input"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="review-rating">Rating (Stars)</label>
                  <select
                    id="review-rating"
                    className="form-select"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                  >
                    <option value="5">5 Stars - Excellent</option>
                    <option value="4">4 Stars - Good</option>
                    <option value="3">3 Stars - Average</option>
                    <option value="2">2 Stars - Poor</option>
                    <option value="1">1 Star - Horrible</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="review-comment">Review Description</label>
                  <textarea
                    id="review-comment"
                    className="form-textarea"
                    rows="4"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Describe your user experience with this product..."
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Send size={15} />
                  Submit Review
                </button>
              </form>
            </div>

            {/* Right Column: Review List */}
            <div className="reviews-list">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem' }}>User Feedbacks</h3>
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="review-card anim-scale-in">
                    <div className="review-header">
                      <div>
                        <span className="review-author">{rev.author}</span>
                        <div style={{ display: 'flex', color: 'var(--clr-warning)', marginTop: '0.25rem' }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < rev.rating ? 'currentColor' : 'none'}
                              stroke="currentColor"
                            />
                          ))}
                        </div>
                      </div>
                      <span className="review-date">{rev.date}</span>
                    </div>
                    <p className="review-content">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--clr-text-muted)' }}>
                  No reviews posted for this product yet. Be the first to share your opinion!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
