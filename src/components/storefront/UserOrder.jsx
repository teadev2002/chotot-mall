import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { fetchUserOrders, fetchUserProfile, updateUserOrder, fetchOrderDetailsByPostId, fetchUserAddress, fetchOrderAndTracking } from '../../services/userService';
import { fetchPostById, fetchOffersByPostId } from '../../services/productService';
import { ArrowLeft, Loader2, Calendar, ShoppingBag, User, Tag } from 'lucide-react';
import { Steps } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

export default function UserOrder() {
  const { setView, currentUser, formatPrice, setSelectedProductId } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' = Offers I Made, 'received' = Offers I Received
  const [details, setDetails] = useState({}); // Cache for resolved post/user info by order id
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Order detail page states
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [orderDetailError, setOrderDetailError] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      setError(null);
      await updateUserOrder(orderId, newStatus);

      // Update local state directly
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: newStatus } : o));

      // Keep detail view in sync if open
      setSelectedOrderDetails(prev => (prev && prev.orderId === orderId) ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      console.error('Failed to update order status:', err);
      setError(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenOrderDetail = async (order, resolvedDetailsMap = null, overrideActiveTab = null) => {
    setOrderDetailError(null);
    setOrderDetailLoading(true);
    setSelectedOrderDetails(null);

    // Sync URL path with the current order detail view: use codeId if available, fallback to id
    const urlParam = order.codeId || order.id;
    window.history.pushState({ view: 'order-detail', orderId: order.id }, '', `/order/${urlParam}`);

    try {
      // Fetch order and tracking details from the API
      let trackings = [];
      let orderAndTrackingData = null;
      try {
        orderAndTrackingData = await fetchOrderAndTracking(order.id);
        if (orderAndTrackingData && Array.isArray(orderAndTrackingData.trackings)) {
          trackings = orderAndTrackingData.trackings;
        }
      } catch (err) {
        console.error('Failed to fetch order and tracking details:', err);
      }

      // 1. Fetch Seller address details
      let fromAddress = 'No address saved';
      try {
        const sellerId = orderAndTrackingData?.sellerId || order.sellerId;
        const sellerAddress = await fetchUserAddress(sellerId);
        if (sellerAddress) {
          fromAddress = `${sellerAddress.street}, ${sellerAddress.ward}, ${sellerAddress.district}, ${sellerAddress.city}`;
        }
      } catch (err) {
        console.error('Failed to fetch seller address for order detail:', err);
      }

      // 2. Fetch Buyer address details
      let toAddress = 'No address saved';
      try {
        const buyerId = orderAndTrackingData?.buyerId || order.buyerId;
        const buyerAddress = await fetchUserAddress(buyerId);
        if (buyerAddress) {
          toAddress = `${buyerAddress.street}, ${buyerAddress.ward}, ${buyerAddress.district}, ${buyerAddress.city}`;
        }
      } catch (err) {
        console.error('Failed to fetch buyer address for order detail:', err);
      }

      // 3. Fetch latest post information to get the actual image
      let postImage = 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop';
      let postTitle = `Listing #${order.postId}`;
      try {
        const postId = orderAndTrackingData?.postId || order.postId;
        const post = await fetchPostById(postId);
        if (post) {
          postTitle = post.title;

          let resolvedImg = post.image;
          if (!resolvedImg && Array.isArray(post.images) && post.images.length > 0) {
            const avatarImg = post.images.find(img => img.isAvatar) || post.images[0];
            if (avatarImg && avatarImg.url) {
              resolvedImg = avatarImg.url;
            }
          }
          if (resolvedImg) {
            postImage = resolvedImg;
          }
        }
      } catch (err) {
        console.error('Failed to fetch post details for order detail:', err);
      }

      // 4. Retrieve resolved details from cache (sellerName, buyerName, offerPrice, etc.)
      const cached = (resolvedDetailsMap || details)[order.id] || {};
      const currentTab = overrideActiveTab || activeTab;

      const listingPrice = orderAndTrackingData?.post?.price || cached.offerPrice || order.price || 0;
      const shipFee = orderAndTrackingData?.shipFee ? Number(orderAndTrackingData.shipFee) : (cached.shipFee || Number(order.shipFee) || 0);
      const totalAmount = orderAndTrackingData?.totalAmount ? Number(orderAndTrackingData.totalAmount) : (cached.totalAmount || (cached.offerPrice + cached.shipFee) || Number(order.totalAmount) || 0);

      setSelectedOrderDetails({
        orderId: order.id,
        orderCode: orderAndTrackingData?.codeId || order.codeId || `Order-xxx${order.id}`,
        sellerName: cached.sellerName || `User #${order.sellerId}`,
        fromAddress,
        buyerName: cached.buyerName || `User #${order.buyerId}`,
        toAddress,
        postTitle,
        listingPrice,
        shipFee,
        totalAmount,
        image: postImage,
        status: orderAndTrackingData?.orderStatus || order.orderStatus,
        activeTab: currentTab,
        trackings
      });
    } catch (err) {
      console.error('Failed to resolve order details:', err);
      setOrderDetailError(err.message || 'Failed to load order detail information.');
    } finally {
      setOrderDetailLoading(false);
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
              } catch (_) { }

              // 3. Fetch Buyer Name
              let buyerName = `User #${order.buyerId}`;
              try {
                const buyerProfile = await fetchUserProfile(order.buyerId);
                if (buyerProfile && buyerProfile.name) {
                  buyerName = buyerProfile.name;
                }
              } catch (_) { }

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
              } catch (_) { }

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

        // Restore order detail view on page refresh if pathname matches /order/:codeIdOrId
        const path = window.location.pathname;
        if (path.startsWith('/order/')) {
          const orderCodeOrId = path.substring(7);
          const targetOrder = ordersData.find(o =>
            (o.codeId && String(o.codeId) === orderCodeOrId) || String(o.id) === orderCodeOrId
          );
          if (targetOrder) {
            const tab = Number(targetOrder.buyerId) === Number(currentUser.id) ? 'sent' : 'received';
            setActiveTab(tab);
            handleOpenOrderDetail(targetOrder, resolvedDetails, tab);
          }
        }
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

  const getTrackingProgress = (trackings = []) => {
    const items = [
      {
        title: 'Ready to Pick',
        description: 'Package prepared and ready for courier.',
      },
      {
        title: 'Picked',
        description: 'Package picked up by courier.',
      },
      {
        title: 'Delivering',
        description: 'Package is in transit.',
      },
      {
        title: 'Delivered',
        description: 'Package has been delivered.',
      },
    ];

    let currentStepIndex = -1;

    const formatTrackingDate = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const readyMatch = trackings.find(t => t.statusOrderTracking === 'READY_TO_PICK');
    const pickedMatch = trackings.find(t => t.statusOrderTracking === 'PICKED' || t.statusOrderTracking === 'PICKING');
    const deliveringMatch = trackings.find(t => t.statusOrderTracking === 'DELIVERING');
    const deliveredMatch = trackings.find(t => t.statusOrderTracking === 'DELIVERED');

    if (readyMatch) {
      currentStepIndex = 0;
      items[0].subTitle = formatTrackingDate(readyMatch.createAt);
    }
    if (pickedMatch) {
      currentStepIndex = 1;
      items[1].subTitle = formatTrackingDate(pickedMatch.createAt);
    }
    if (deliveringMatch) {
      currentStepIndex = 2;
      items[2].subTitle = formatTrackingDate(deliveringMatch.createAt);
    }
    if (deliveredMatch) {
      currentStepIndex = 3;
      items[3].subTitle = formatTrackingDate(deliveredMatch.createAt);
    }

    if (trackings.length > 0 && currentStepIndex === -1) {
      currentStepIndex = 0;
    }

    return { currentStepIndex, items };
  };

  const handleBackToOrders = () => {
    setSelectedOrderDetails(null);
    setOrderDetailLoading(false);
    setOrderDetailError(null);
    window.history.pushState({ view: 'my-offers' }, '', '/my-offers');
  };

  if (selectedOrderDetails || orderDetailLoading || orderDetailError) {
    return (
      <div className="container anim-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1000px' }}>
        {/* Navigation Header */}
        <button
          className="btn btn-secondary"
          onClick={handleBackToOrders}
          style={{ marginBottom: '2rem', padding: '0.5rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-md)' }}
        >
          <ArrowLeft size={16} />
          Back to Accepted Price Offers
        </button>

        <div style={{ marginBottom: '2.5rem' }}>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem', background: 'var(--clr-primary)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
            Order Details
          </span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: 'var(--clr-text-primary)', letterSpacing: '-0.025em' }}>
            {selectedOrderDetails ? `Order ${selectedOrderDetails.orderCode}` : 'Order Detail'}
          </h1>
          <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Comprehensive overview of your transaction details, delivery addresses, and payment breakdown.
          </p>
        </div>

        {orderDetailLoading ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--clr-bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--clr-border)' }}>
            <Loader2 size={44} className="anim-spin" style={{ color: 'var(--clr-primary)', margin: '0 auto 1.5rem' }} />
            <p style={{ color: 'var(--clr-text-secondary)', fontWeight: 500 }}>Retrieving transaction details from secure server...</p>
          </div>
        ) : orderDetailError ? (
          <div style={{
            padding: '3rem 2rem',
            background: 'var(--clr-bg-card)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center',
            color: 'var(--clr-text-secondary)'
          }}>
            <span style={{ fontSize: '3rem' }}>⚠️</span>
            <h3 style={{ marginTop: '1rem', fontSize: '1.25rem', color: 'var(--clr-text-primary)' }}>Failed to load order details</h3>
            <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>{orderDetailError}</p>
            <button className="btn btn-primary" onClick={handleBackToOrders} style={{ marginTop: '1.5rem' }}>
              Return to Orders List
            </button>
          </div>
        ) : selectedOrderDetails ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-8 md:p-10 rounded-2xl border border-gray-200 shadow-xl transition-all duration-300 hover:shadow-2xl font-sans">
            {/* Left Column: Order Information */}
            <div className="flex flex-col justify-between h-full">
              <div>
                <span className="text-xs uppercase font-bold text-amber-700 tracking-widest block mb-6">Order Information</span>
                <div className="space-y-5 text-sm text-gray-800 font-sans">
                  <div className="flex items-start">
                    <span className="font-bold text-black min-w-[140px] shrink-0">Order Code:</span>
                    <span className="text-gray-700 font-medium">{selectedOrderDetails.orderCode}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-black min-w-[140px] shrink-0">Seller:</span>
                    <span className="text-gray-700 font-medium">{selectedOrderDetails.sellerName}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-black min-w-[140px] shrink-0">From Address:</span>
                    <span className="text-gray-700 leading-relaxed">{selectedOrderDetails.fromAddress}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-black min-w-[140px] shrink-0">Buyer:</span>
                    <span className="text-gray-700 font-medium">{selectedOrderDetails.buyerName}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-bold text-black min-w-[140px] shrink-0">To Address:</span>
                    <span className="text-gray-700 leading-relaxed">{selectedOrderDetails.toAddress}</span>
                  </div>
                </div>
              </div>
              {/* Horizontal Rule at the bottom */}
              <div className="mt-8 border-b border-black w-full" />
            </div>

            {/* Right Column: Product Detail and Status */}
            <div className="flex flex-col gap-6">
              {/* Header line */}
              <div>
                <div className="text-sm font-semibold text-black pb-1.5 uppercase tracking-wide">
                  Post: {selectedOrderDetails.postTitle}
                </div>
                <div className="border-b border-black w-full" />
              </div>

              {/* Product Card */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex flex-col gap-6 shadow-sm">

                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  {/* Image block */}
                  <div className="w-28 h-28 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center shadow-inner">
                    <img
                      src={selectedOrderDetails.image}
                      alt={selectedOrderDetails.postTitle}
                      className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                    />
                  </div>

                  {/* Pricing block */}
                  <div className="flex-1 space-y-2 text-sm w-full">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Listing Price:</span>
                      <span className="font-bold text-black">{formatPrice(selectedOrderDetails.listingPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Shipping Fee:</span>
                      <span className="text-black font-semibold">+ {formatPrice(selectedOrderDetails.shipFee)}</span>
                    </div>
                    <div className="border-b border-gray-200 my-2" />
                    <div className="flex justify-between text-base">
                      <span className="font-bold text-black">Total Amount:</span>
                      <span className="font-extrabold text-blue-600">{formatPrice(selectedOrderDetails.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 flex flex-col items-center justify-center gap-2">
                  <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">Current Status:</span>
                  {selectedOrderDetails.activeTab === 'sent' && selectedOrderDetails.status === 'PENDING' ? (
                    updatingOrderId === selectedOrderDetails.orderId ? (
                      <div className="flex items-center gap-1.5 text-base font-bold text-gray-500">
                        <Loader2 size={16} className="anim-spin text-amber-700" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedOrderDetails.status}
                        onChange={(e) => handleStatusChange(selectedOrderDetails.orderId, e.target.value)}
                        className={`font-bold border-0 bg-transparent focus:ring-0 outline-none text-center cursor-pointer text-base uppercase p-1 ${selectedOrderDetails.status === 'PENDING' ? 'text-orange-500' :
                          selectedOrderDetails.status === 'ACCEPTED' ? 'text-green-600' :
                            selectedOrderDetails.status === 'CANCELED' ? 'text-red-600' :
                              selectedOrderDetails.status === 'COMPLETED' ? 'text-blue-600' : 'text-gray-800'
                          }`}
                      >
                        <option value="PENDING" className="text-orange-500 font-bold bg-white">PENDING</option>
                        <option value="ACCEPTED" className="text-green-600 font-bold bg-white">ACCEPTED</option>
                        <option value="CANCELED" className="text-red-600 font-bold bg-white">CANCELED</option>
                      </select>
                    )
                  ) : (
                    <span className={`font-bold text-base uppercase ${selectedOrderDetails.status === 'PENDING' ? 'text-orange-500' :
                      selectedOrderDetails.status === 'ACCEPTED' ? 'text-green-600' :
                        selectedOrderDetails.status === 'CANCELED' ? 'text-red-600' :
                          selectedOrderDetails.status === 'COMPLETED' ? 'text-blue-600' : 'text-gray-800'
                      }`}>
                      {selectedOrderDetails.status}
                    </span>
                  )}
                </div>

              </div>

            </div>

            {/* Order Tracking Section (Full Width, under the columns) */}
            <div className="col-span-1 md:col-span-2 border-t border-gray-200 pt-8 mt-4">
              <span className="text-xs uppercase font-bold text-gray-500 tracking-wider block mb-6">Order Tracking</span>
              {selectedOrderDetails.trackings && selectedOrderDetails.trackings.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-inner">
                  <Steps
                    current={getTrackingProgress(selectedOrderDetails.trackings).currentStepIndex}
                    items={getTrackingProgress(selectedOrderDetails.trackings).items}
                    size="small"
                  />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 text-center text-gray-400 text-sm font-medium">
                  No tracking information available yet for this order.
                </div>
              )}
            </div>

          </div>
        ) : null}
      </div>
    );
  }

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
                          disabled={updatingOrderId !== null || order.orderStatus !== 'PENDING'}
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
                            cursor: order.orderStatus === 'PENDING' ? 'pointer' : 'default',
                            outline: 'none',
                            textTransform: 'uppercase',
                            opacity: 1
                          }}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="ACCEPTED">ACCEPTED</option>
                          <option value="CANCELED">CANCELED</option>
                          {order.orderStatus === 'COMPLETED' && <option value="COMPLETED">COMPLETED</option>}
                        </select>
                      )
                    ) : (
                      <span
                        className={`badge ${order.orderStatus === 'ACCEPTED' ? 'badge-success' :
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

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {activeTab === 'sent' && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: 'var(--radius-sm)', color: '#ffffff' }}
                          onClick={() => handleOpenOrderDetail(order)}
                        >
                          Order Detail
                        </button>
                      )}
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: 'var(--radius-sm)' }}
                        onClick={() => handleProductClick(order.postId)}
                      >
                        <EyeOutlined />
                      </button>
                    </div>
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

      {/* Empty block replacing the modal */}
    </div>
  );
}
