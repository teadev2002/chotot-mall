import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { fetchUserOrders, fetchUserProfile, updateUserOrder, fetchOrderDetailsByPostId } from '../../services/userService';
import { fetchPostById, fetchOffersByPostId } from '../../services/productService';
import { ArrowLeft, Loader2, Calendar, ShoppingBag, User, Tag } from 'lucide-react';

export default function UserOrder() {
  const { setView, currentUser, formatPrice, setSelectedProductId } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' = Offers I Made, 'received' = Offers I Received
  const [details, setDetails] = useState({}); // Cache for resolved post/user info by order id
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);
      await updateUserOrder(orderId, newStatus);
      
      // Update local state directly
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const loadOrdersData = async () => {
      try {
        setLoading(true);
        setError(null);
        const ordersData = await fetchUserOrders();
        setOrders(ordersData);

        // Resolve detailed info for each order in parallel
        const resolvedDetails = {};
        await Promise.all(
          ordersData.map(async (order) => {
            try {
              // 1. Fetch Order details by post ID
              let shipFee = 0;
              let totalAmount = 0;
              let post = null;

              try {
                const ordersForPost = await fetchOrderDetailsByPostId(order.postId);
                const matchedOrder = ordersForPost.find(o => Number(o.id) === Number(order.id));
                if (matchedOrder) {
                  shipFee = matchedOrder.shipFee ? Number(matchedOrder.shipFee) : 0;
                  totalAmount = matchedOrder.totalAmount ? Number(matchedOrder.totalAmount) : 0;
                  post = matchedOrder.post;
                }
              } catch (err) {
                console.error(`Failed to fetch order details by post ID for order ${order.id}:`, err);
              }

              // Fallback to fetch post if not nested in order
              if (!post) {
                post = await fetchPostById(order.postId);
              }
              
              // 2. Fetch Seller Name
              let sellerName = `User #${order.sellerId}`;
              try {
                const sellerProfile = await fetchUserProfile(order.sellerId);
                if (sellerProfile && sellerProfile.name) {
                  sellerName = sellerProfile.name;
                }
              } catch (_) {}

              // 3. Fetch Buyer Name
              let buyerName = `User #${order.buyerId}`;
              try {
                const buyerProfile = await fetchUserProfile(order.buyerId);
                if (buyerProfile && buyerProfile.name) {
                  buyerName = buyerProfile.name;
                }
              } catch (_) {}

              // 4. Fetch the accepted offer price for this post
              let offerPrice = post?.price || 0;
              try {
                const offers = await fetchOffersByPostId(order.postId);
                const acceptedOffer = offers.find(
                  (o) => Number(o.buyerId) === Number(order.buyerId) && o.offerStatus === 'ACCEPTED'
                );
                if (acceptedOffer && acceptedOffer.price) {
                  offerPrice = Number(acceptedOffer.price);
                }
              } catch (_) {}

              // Resolve category images dynamically if resolved post has categoryId
              let image = post?.image;
              if (!image && post) {
                image = post.categoryId === 1
                  ? 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop'
                  : post.categoryId === 2
                    ? 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop'
                    : 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop';
              }

              resolvedDetails[order.id] = {
                title: post?.title || `Listing #${order.postId}`,
                image: image || 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop',
                sellerName,
                buyerName,
                offerPrice,
                shipFee,
                totalAmount
              };
            } catch (err) {
              console.error(`Failed to resolve details for order ${order.id}:`, err);
              resolvedDetails[order.id] = {
                title: `Listing #${order.postId}`,
                image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop',
                sellerName: `User #${order.sellerId}`,
                buyerName: `User #${order.buyerId}`,
                offerPrice: 0,
                shipFee: 0,
                totalAmount: 0
              };
            }
          })
        );
        setDetails(resolvedDetails);
      } catch (err) {
        console.error('Failed to load orders:', err);
        setError(err.message || 'An error occurred while loading your offers.');
      } finally {
        setLoading(false);
      }
    };

    loadOrdersData();
  }, [currentUser]);

  const handleBackToCatalog = () => {
    setView('storefront');
    window.history.pushState(null, '', '/');
  };

  const handleProductClick = (postId) => {
    setSelectedProductId(postId);
  };

  if (!currentUser) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>Please sign in to view your offers.</h2>
        <button className="btn btn-primary" onClick={handleBackToCatalog} style={{ marginTop: '1rem' }}>
          Back to Catalog
        </button>
      </div>
    );
  }

  // Filter orders based on active tab
  const sentOffers = orders.filter((o) => Number(o.buyerId) === Number(currentUser.id));
  const receivedOffers = orders.filter((o) => Number(o.sellerId) === Number(currentUser.id));
  const displayedOffers = activeTab === 'sent' ? sentOffers : receivedOffers;

  return (
    <div className="container anim-fade-in" style={{ padding: '2rem 1.5rem' }}>
      {/* Navigation Header */}
      <button
        className="btn btn-secondary"
        onClick={handleBackToCatalog}
        style={{ marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
      >
        <ArrowLeft size={16} />
        Back to Catalog
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>My Offers & Orders</span>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--clr-text-primary)' }}>
          Accepted Price Offers
        </h1>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
          View all offers that have been successfully accepted and converted into active orders.
        </p>
      </div>

      {/* Tabs Control */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--clr-border)',
        marginBottom: '2rem',
        gap: '1.5rem'
      }}>
        <button
          onClick={() => setActiveTab('sent')}
          style={{
            padding: '0.75rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'sent' ? '2px solid var(--clr-primary)' : '2px solid transparent',
            color: activeTab === 'sent' ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
            fontWeight: activeTab === 'sent' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s'
          }}
        >
          Offers I Sent ({sentOffers.length})
        </button>
        <button
          onClick={() => setActiveTab('received')}
          style={{
            padding: '0.75rem 0.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'received' ? '2px solid var(--clr-primary)' : '2px solid transparent',
            color: activeTab === 'received' ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
            fontWeight: activeTab === 'received' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s'
          }}
        >
          Offers I Received ({receivedOffers.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Loader2 size={36} className="anim-spin" style={{ color: 'var(--clr-primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--clr-text-secondary)' }}>Loading your offers database...</p>
        </div>
      ) : error ? (
        <div style={{
          padding: '1.5rem',
          background: 'var(--clr-bg-card)',
          border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          color: 'var(--clr-text-secondary)'
        }}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <h3 style={{ marginTop: '0.5rem', color: 'var(--clr-text-primary)' }}>Failed to load offers</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{error}</p>
        </div>
      ) : displayedOffers.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {displayedOffers.map((order) => {
            const orderDetail = details[order.id] || {
              title: `Listing #${order.postId}`,
              image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop',
              sellerName: 'Loading...',
              buyerName: 'Loading...',
              offerPrice: 0
            };

            const createdDate = new Date(order.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <article
                key={order.id}
                style={{
                  background: 'var(--clr-bg-card)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                className="product-card"
              >
                {/* Product Image section */}
                <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                  <img
                    src={orderDetail.image}
                    alt={orderDetail.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    {activeTab === 'sent' ? (
                      updatingOrderId === order.id ? (
                        <div style={{
                          background: 'var(--clr-bg-card)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.75rem',
                          border: '1px solid var(--clr-border)',
                          color: 'var(--clr-text-primary)'
                        }}>
                          <Loader2 size={12} className="anim-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updatingOrderId !== null}
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--clr-border)',
                            background: order.orderStatus === 'ACCEPTED' ? '#e6f7ed' : 
                                        order.orderStatus === 'CANCELED' ? '#fdebee' :
                                        order.orderStatus === 'PENDING' ? '#fff8eb' : 
                                        order.orderStatus === 'COMPLETED' ? '#ebf3fc' : 'var(--clr-bg-card)',
                            color: order.orderStatus === 'ACCEPTED' ? '#2e7d32' : 
                                   order.orderStatus === 'CANCELED' ? '#d32f2f' :
                                   order.orderStatus === 'PENDING' ? '#ed6c02' :
                                   order.orderStatus === 'COMPLETED' ? '#0288d1' : 'var(--clr-text-primary)',
                            cursor: 'pointer',
                            outline: 'none',
                            textTransform: 'uppercase'
                          }}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="ACCEPTED">ACCEPTED</option>
                          <option value="CANCELED">CANCELED</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      )
                    ) : (
                      <span 
                        className={`badge ${
                          order.orderStatus === 'ACCEPTED' ? 'badge-success' : 
                          order.orderStatus === 'COMPLETED' ? 'badge-primary' :
                          order.orderStatus === 'PENDING' ? 'badge-warning' : 'badge-danger'
                        }`} 
                        style={{ textTransform: 'uppercase' }}
                      >
                        {order.orderStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info details */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      margin: '0 0 0.5rem 0',
                      color: 'var(--clr-text-primary)',
                      cursor: 'pointer',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                    onClick={() => handleProductClick(order.postId)}
                    title="Click to view listing details"
                  >
                    {orderDetail.title}
                  </h3>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    color: 'var(--clr-text-secondary)',
                    margin: '0.5rem 0 0.75rem 0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} style={{ color: 'var(--clr-primary)' }} />
                      {activeTab === 'sent' ? (
                        <span>Seller: <strong>{orderDetail.sellerName}</strong></span>
                      ) : (
                        <span>Buyer: <strong>{orderDetail.buyerName}</strong></span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} />
                      <span>Accepted on: {createdDate}</span>
                    </div>
                  </div>

                  {/* Pricing Breakdown (listing price, shipping fee, and total amount) */}
                  <div style={{
                    margin: '0.5rem 0 1rem 0',
                    background: 'var(--clr-bg-app)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--clr-text-muted)' }}>Listing Price:</span>
                      <span style={{ fontWeight: 600, color: 'var(--clr-text-primary)' }}>
                        {formatPrice(orderDetail.offerPrice)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--clr-text-muted)' }}>Shipping Fee:</span>
                      <span style={{ fontWeight: 600, color: 'var(--clr-text-secondary)' }}>
                        {orderDetail.shipFee > 0 ? `+ ${formatPrice(orderDetail.shipFee)}` : 'Free'}
                      </span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--clr-border)', margin: '0.5rem 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span style={{ color: 'var(--clr-text-primary)' }}>Total Amount:</span>
                      <span style={{ color: 'var(--clr-primary)', fontSize: '0.95rem' }}>
                        {formatPrice(orderDetail.totalAmount || (orderDetail.offerPrice + orderDetail.shipFee))}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--clr-border)',
                    paddingTop: '0.75rem',
                    marginTop: 'auto',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>Total Amount</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--clr-primary)' }}>
                        {formatPrice(orderDetail.totalAmount || (orderDetail.offerPrice + orderDetail.shipFee))}
                      </span>
                    </div>
                    
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: 'var(--radius-sm)' }}
                      onClick={() => handleProductClick(order.postId)}
                    >
                      View Listing
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
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--clr-border)'
        }}>
          <span style={{ fontSize: '3rem' }}>🏷️</span>
          <h3 style={{ marginTop: '1rem', fontSize: '1.25rem', color: 'var(--clr-text-primary)' }}>
            No accepted offers yet
          </h3>
          <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            {activeTab === 'sent'
              ? "Any price offers you send that are accepted by sellers will appear here."
              : "Any price offers you accept on your listings will appear here."}
          </p>
        </div>
      )}
    </div>
  );
}
