import React, { useState, useContext, useEffect, useRef } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { ChatContext } from '../../context/ChatContext';
import { ArrowLeft, Phone, MessageCircle, MapPin, Calendar, User, Send, ShieldAlert, Check, Loader2, Tag, X, Edit, AlertCircle } from 'lucide-react';
import { fetchPostById, fetchOffersByPostId, createOffer, acceptOffer, fetchCategories, updatePost } from '../../services/productService';
import { fetchUserProfile, fetchUserAddress, saveUserAddress } from '../../services/userService';
import { generateSlug } from '../../utils/slug';

const DISTRICTS = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12',
  'Quận Bình Tân', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú'
];

export default function ProductDetail() {
  const {
    products,
    selectedProductId,
    setSelectedProductId,
    currentUser,
    setIsAuthModalOpen,
    formatPrice,
    editProduct,
    loadUserListings
  } = useContext(ShopContext);

  const {
    isChatOpen,
    setIsChatOpen,
    activeConversationId,
    messages: chatMessages,
    chatLoading,
    chatError,
    startChat,
    closeChat,
    sendMessage
  } = useContext(ChatContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Offers states
  const [offersList, setOffersList] = useState([]);
  const hasAcceptedOffer = offersList.some(o => o.offerStatus === 'ACCEPTED');
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState(null);

  // Offer creation states
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerSubmitError, setOfferSubmitError] = useState(null);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState(null);

  // Offer acceptance states
  const [acceptingOfferId, setAcceptingOfferId] = useState(null);
  const [acceptError, setAcceptError] = useState(null);

  // Address states
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: '',
    ward: 'phường',
    district: '',
    city: 'Hồ Chí Minh'
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressError, setAddressError] = useState(null);

  // Edit listing states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    categoryId: '',
    price: '',
    width: '',
    length: '',
    height: '',
    weight: ''
  });
  const [editCategories, setEditCategories] = useState([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  // Seller profile state
  const [sellerName, setSellerName] = useState('');
  const [sellerAddress, setSellerAddress] = useState(null);
  const [buyerNames, setBuyerNames] = useState({});

  // Fetch buyer names whenever offersList changes
  useEffect(() => {
    if (!offersList || offersList.length === 0) return;

    const getBuyerNames = async () => {
      const uniqueBuyerIds = [...new Set(offersList.map((o) => o.buyerId))];
      try {
        const fetchedResults = await Promise.all(
          uniqueBuyerIds.map(async (id) => {
            try {
              const profile = await fetchUserProfile(id);
              return { id, name: profile?.name || `User #${id}` };
            } catch (err) {
              console.error(`Failed to fetch user profile for buyer id ${id}:`, err);
              return { id, name: `User #${id}` };
            }
          })
        );

        const newNamesMap = {};
        fetchedResults.forEach((item) => {
          newNamesMap[item.id] = item.name;
        });

        setBuyerNames((prev) => ({
          ...prev,
          ...newNamesMap
        }));
      } catch (err) {
        console.error('Failed to fetch buyer profiles:', err);
      }
    };

    getBuyerNames();
  }, [offersList]);


  // Classifieds interactions states
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const messagesEndRef = useRef(null);

  // Helper to load offers for a post
  const loadOffersForPost = async (postId) => {
    if (!postId) return;
    setOffersList([]);
    setOffersError(null);
    try {
      setOffersLoading(true);
      const offersData = await fetchOffersByPostId(postId);
      setOffersList(offersData);
      // Save successfully fetched offers to localStorage cache
      localStorage.setItem(`offers_cache_${postId}`, JSON.stringify(offersData));
    } catch (offerErr) {
      console.error('Failed to load offers from API, attempting cache:', offerErr);

      // Fallback to localStorage cache
      const cached = localStorage.getItem(`offers_cache_${postId}`);
      if (cached) {
        try {
          const parsedOffers = JSON.parse(cached);
          setOffersList(parsedOffers);
        } catch (_) {
          setOffersError('Failed to fetch offers list');
        }
      } else {
        // If there's no cache and we failed to load from API, generate some mock data based on product price
        // so that there's always mock data for others to view instead of empty error!
        const currentProductPrice = product?.price || 7000000;
        const mockOffers = [
          {
            id: 1,
            buyerId: 3,
            postId: Number(postId),
            offerStatus: 'PENDING',
            price: String(Math.round(currentProductPrice * 0.85)),
            createAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            buyerId: 5,
            postId: Number(postId),
            offerStatus: 'PENDING',
            price: String(Math.round(currentProductPrice * 0.95)),
            createAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ];
        setOffersList(mockOffers);
        localStorage.setItem(`offers_cache_${postId}`, JSON.stringify(mockOffers));
      }
    } finally {
      setOffersLoading(false);
    }
  };

  // Fetch product detail on mount/change
  useEffect(() => {
    if (!selectedProductId) return;

    const getProductDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        setSellerName('');
        setSellerAddress(null);

        const data = await fetchPostById(selectedProductId);
        let authorId = null;

        if (data) {
          setProduct(data);
          authorId = data.authorId;
          setChatMessages([
            { sender: 'seller', text: `Hi! Thanks for showing interest in my listing "${data.title}". Is there anything specific you would like to know?`, time: 'Just now' }
          ]);
          // Sync URL with post slug name
          const slug = generateSlug(data.title);
          window.history.pushState({ postId: data.id, view: 'product-detail' }, '', `/post/${slug}`);
        } else {
          // Fallback to local
          const local = products.find((p) => p.id === selectedProductId);
          if (local) {
            setProduct(local);
            authorId = local.authorId;
            setChatMessages([
              { sender: 'seller', text: `Hi! Thanks for showing interest in my listing "${local.title}". Is there anything specific you would like to know?`, time: 'Just now' }
            ]);
            // Sync URL with local post slug name
            const slug = generateSlug(local.title);
            window.history.pushState({ postId: local.id, view: 'product-detail' }, '', `/post/${slug}`);
          } else {
            throw new Error('Listing not found');
          }
        }

        // Fetch seller profile details
        if (authorId) {
          try {
            const profile = await fetchUserProfile(authorId);
            if (profile && profile.name) {
              setSellerName(profile.name);
            } else {
              setSellerName(`User #${authorId}`);
            }
          } catch (profileErr) {
            console.error('Failed to load seller profile:', profileErr);
            setSellerName(`User #${authorId}`);
          }

          try {
            const address = await fetchUserAddress(authorId);
            setSellerAddress(address);
          } catch (addrErr) {
            console.error('Failed to load seller address:', addrErr);
            setSellerAddress(null);
          }
        }

        // Fetch offers for the post
        await loadOffersForPost(selectedProductId);
      } catch (err) {
        console.error('Failed to load post details:', err);
        // Resilient fallback
        const local = products.find((p) => p.id === selectedProductId);
        if (local) {
          setProduct(local);
          setChatMessages([
            { sender: 'seller', text: `Hi! Thanks for showing interest in my listing "${local.title}". Is there anything specific you would like to know?`, time: 'Just now' }
          ]);
          const slug = generateSlug(local.title);
          window.history.pushState({ postId: local.id, view: 'product-detail' }, '', `/post/${slug}`);
        } else {
          setError(err.message || 'Failed to load post details.');
        }
      } finally {
        setLoading(false);
      }
    };

    getProductDetail();
    setPhoneRevealed(false);
    setPhoneCopied(false);
    setIsChatOpen(false);
    window.scrollTo(0, 0);
  }, [selectedProductId, products, currentUser]);

  // Scroll to bottom when new chat messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Loading indicator overlay
  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setSelectedProductId(null)}
          style={{ marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <ArrowLeft size={16} />
          Back to Listings
        </button>
        <div style={{ marginTop: '2rem' }}>
          <Loader2 size={36} className="anim-spin" style={{ color: 'var(--clr-primary)', margin: '0 auto 1.5rem' }} />
          <p style={{ color: 'var(--clr-text-secondary)' }}>Loading listing details from server...</p>
        </div>
      </div>
    );
  }

  // Error indicator overlay
  if (error && !product) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={() => setSelectedProductId(null)}
          style={{ marginBottom: '2rem', padding: '0.5rem 1rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <ArrowLeft size={16} />
          Back to Listings
        </button>
        <div style={{ marginTop: '2rem' }}>
          <ShieldAlert size={48} style={{ color: 'var(--clr-danger)', margin: '0 auto 1.5rem' }} />
          <h3>Failed to load listing</h3>
          <p style={{ color: 'var(--clr-text-secondary)', marginTop: '0.5rem' }}>{error}</p>
        </div>
      </div>
    );
  }

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

  // Generate a mock phone number based on the author ID
  const mockPhone = `090${(product.authorId * 13) % 10}${(product.id * 17) % 1000000}`;
  // Masked version
  const maskedPhone = `${mockPhone.substring(0, 4)} ••• •••`;

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

  const handleOpenChat = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    try {
      await startChat(product.id, product.authorId);
    } catch (err) {
      alert(err.message || 'Could not start chat with seller');
    }
  };

  const handleOpenOfferModal = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (hasAcceptedOffer) {
      alert('An offer has already been accepted for this listing. Making new offers is locked.');
      return;
    }
    setOfferPrice('');
    setOfferSubmitting(false);
    setOfferSubmitError(null);
    setOfferSuccessMsg(null);

    try {
      const address = await fetchUserAddress(currentUser.id);
      if (!address) {
        setAddressForm({
          street: '',
          ward: 'phường',
          district: '',
          city: 'Hồ Chí Minh'
        });
        setAddressError(null);
        setAddressSubmitting(false);
        setIsAddressModalOpen(true);
      } else {
        setIsOfferModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to verify user address:', err);
      setIsOfferModalOpen(true);
    }
  };

  const handleAddressInputChange = (e) => {
    const { id, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setAddressSubmitting(true);
    setAddressError(null);

    let wardValue = addressForm.ward.trim();
    if (!wardValue.toLowerCase().startsWith('phường')) {
      wardValue = `phường ${wardValue}`.trim();
    }

    try {
      await saveUserAddress({
        userId: Number(currentUser.id),
        street: addressForm.street.trim(),
        ward: wardValue,
        district: addressForm.district.trim(),
        city: 'Hồ Chí Minh'
      });

      setAddressForm({
        street: '',
        ward: 'phường',
        district: '',
        city: 'Hồ Chí Minh'
      });
      setIsAddressModalOpen(false);
      setIsOfferModalOpen(true);
    } catch (err) {
      console.error('Save address error:', err);
      setAddressError(err.message || 'An error occurred while saving the address.');
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (hasAcceptedOffer) {
      setOfferSubmitError('An offer has already been accepted for this listing. Making new offers is locked.');
      return;
    }
    if (!offerPrice || isNaN(offerPrice) || Number(offerPrice) <= 0) {
      setOfferSubmitError('Please enter a valid offer price');
      return;
    }

    setOfferSubmitting(true);
    setOfferSubmitError(null);

    try {
      const newOfferRes = await createOffer(product.id, offerPrice);
      setOfferSuccessMsg('Your price offer has been successfully submitted!');

      // Formulate a local offer object to add to the client cache
      const newOfferObj = {
        id: newOfferRes?.data?.id || Date.now(),
        buyerId: currentUser ? Number(currentUser.id) : 99,
        postId: Number(product.id),
        offerStatus: 'PENDING',
        price: String(offerPrice),
        createAt: new Date().toISOString()
      };

      // Retrieve cached offers list
      let currentCache = [];
      const cached = localStorage.getItem(`offers_cache_${product.id}`);
      if (cached) {
        try {
          currentCache = JSON.parse(cached);
        } catch (_) { }
      }

      // Prepend the new offer
      currentCache = [newOfferObj, ...currentCache];
      localStorage.setItem(`offers_cache_${product.id}`, JSON.stringify(currentCache));
      setOffersList(currentCache);

      // Reload offers list
      await loadOffersForPost(product.id);

      // Auto close after 1.5 seconds
      setTimeout(() => {
        setIsOfferModalOpen(false);
        setOfferSuccessMsg(null);
        setOfferPrice('');
      }, 1500);
    } catch (err) {
      console.error('Submit offer error:', err);
      setOfferSubmitError(err.message || 'An error occurred while submitting your offer.');
    } finally {
      setOfferSubmitting(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    if (!offerId) return;
    setAcceptingOfferId(offerId);
    setAcceptError(null);
    try {
      await acceptOffer(offerId);

      // Synchronize acceptance state in localStorage cache
      let currentCache = [];
      const cached = localStorage.getItem(`offers_cache_${product.id}`);
      if (cached) {
        try {
          currentCache = JSON.parse(cached);
          currentCache = currentCache.map(offer =>
            offer.id === offerId ? { ...offer, offerStatus: 'ACCEPTED' } : offer
          );
          localStorage.setItem(`offers_cache_${product.id}`, JSON.stringify(currentCache));
          setOffersList(currentCache);
        } catch (_) { }
      }

      // Reload offers list
      await loadOffersForPost(product.id);
    } catch (err) {
      console.error('Accept offer error:', err);
      setAcceptError(err.message || 'An error occurred while accepting this offer.');
      alert(err.message || 'Failed to accept offer');
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const handleOpenEditModal = async () => {
    setEditForm({
      title: product.title || '',
      content: product.description || product.content || '',
      categoryId: String(product.categoryId || '1'),
      price: String(product.price || ''),
      width: String(product.width || '0'),
      length: String(product.length || '0'),
      height: String(product.height || '0'),
      weight: String(product.weight || '0')
    });
    setEditCategories([]);
    setEditError(null);
    setEditLoading(true);
    setIsEditModalOpen(true);

    try {
      const [categoriesData, latestProduct] = await Promise.all([
        fetchCategories(),
        fetchPostById(product.id)
      ]);

      if (categoriesData && categoriesData.length > 0) {
        setEditCategories(categoriesData);
      }

      if (latestProduct) {
        setProduct(latestProduct);
        setEditForm({
          title: latestProduct.title || '',
          content: latestProduct.description || latestProduct.content || '',
          categoryId: String(latestProduct.categoryId || '1'),
          price: String(latestProduct.price || ''),
          width: String(latestProduct.width || '0'),
          length: String(latestProduct.length || '0'),
          height: String(latestProduct.height || '0'),
          weight: String(latestProduct.weight || '0')
        });
      }
    } catch (err) {
      console.error('Failed to prefetch edit data:', err);
      setEditCategories([
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Fashion' },
        { id: 3, name: 'Accessories' }
      ]);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { id, value } = e.target;
    setEditForm(prev => ({ ...prev, [id]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      setEditError('Title is required');
      return;
    }
    if (!editForm.content.trim()) {
      setEditError('Description is required');
      return;
    }

    setEditSubmitting(true);
    setEditError(null);

    const payload = {
      title: editForm.title.trim(),
      content: editForm.content.trim(),
      categoryId: Number(editForm.categoryId),
      price: Number(editForm.price),
      width: Number(editForm.width),
      length: Number(editForm.length),
      height: Number(editForm.height),
      weight: Number(editForm.weight),
      weigth: Number(editForm.weight)
    };

    try {
      await updatePost(product.id, payload);

      const updatedProduct = await fetchPostById(product.id);
      if (updatedProduct) {
        setProduct(updatedProduct);
        if (editProduct) {
          editProduct(product.id, updatedProduct);
        }
      }

      if (currentUser && loadUserListings) {
        loadUserListings(currentUser.id).catch(err => console.error('Error reloading user listings:', err));
      }

      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update listing:', err);
      setEditError(err.message || 'Failed to update post listing.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const formattedDate = new Date(product.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const isOwnProduct = currentUser && String(currentUser.id) === String(product.authorId);

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
              <strong>
                {sellerAddress
                  ? `${sellerAddress.street}, ${sellerAddress.ward}, ${sellerAddress.district}, ${sellerAddress.city}`
                  : (product.location || 'Ho Chi Minh City, Vietnam')}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={16} />
              <span>Posted: {formattedDate}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <User size={16} />
              <span>Seller: {sellerName || `User #${product.authorId}`}</span>
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
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--clr-text-primary)' }}>
              {isOwnProduct ? 'Manage Your Listing' : 'Interested in this item? Contact Seller'}
            </h3>

            {hasAcceptedOffer && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--clr-danger, #ef4444)',
                background: 'var(--clr-danger-light, #fef2f2)',
                border: '1px solid hsla(var(--danger), 0.2)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                <ShieldAlert size={16} />
                <span>An offer has been accepted for this listing. Making new offers is locked.</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {isOwnProduct && (
                <button
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem'
                  }}
                  onClick={handleOpenEditModal}
                >
                  <Edit size={18} />
                  <span>Edit Listing Details</span>
                </button>
              )}
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

              {/* Make Offer trigger */}
              {!isOwnProduct && (
                <button
                  className="btn btn-secondary"
                  disabled={hasAcceptedOffer}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem',
                    border: '1px solid var(--clr-border)',
                    cursor: hasAcceptedOffer ? 'not-allowed' : 'pointer',
                    opacity: hasAcceptedOffer ? 0.6 : 1,
                    backgroundColor: hasAcceptedOffer ? 'var(--clr-bg-app)' : 'transparent'
                  }}
                  onClick={handleOpenOfferModal}
                >
                  <Tag size={18} style={{ color: hasAcceptedOffer ? 'var(--clr-text-muted)' : 'var(--clr-primary)' }} />
                  <span>{hasAcceptedOffer ? 'Offer Accepted (Locked)' : 'Make Offer'}</span>
                </button>
              )}
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
                <td style={{ fontWeight: 600 }}>Location</td>
                <td>
                  {sellerAddress
                    ? `${sellerAddress.street}, ${sellerAddress.ward}, ${sellerAddress.district}, ${sellerAddress.city}`
                    : (product.location || 'Ho Chi Minh City, Vietnam')}
                </td>
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
                  <td>{product.weight} g</td>
                </tr>
              )}

              <tr>
                <td style={{ fontWeight: 600 }}>Seller Account</td>
                <td>{sellerName || `User #${product.authorId}`} </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Listing Status</td>
                <td>{product.published ? 'Active & Published' : 'Draft / Private'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Offers from Other Buyers Section */}
      <div className="reviews-section" style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--clr-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', color: 'var(--clr-text-primary)' }}>
          Offers from Other Buyers
        </h3>

        {offersLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--clr-text-secondary)', padding: '1rem' }}>
            <Loader2 size={16} className="anim-spin" />
            <span>Retrieving customer offer levels...</span>
          </div>
        ) : offersError ? (
          <div style={{ padding: '1rem', background: 'var(--clr-bg-app)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', color: 'var(--clr-text-secondary)', fontSize: '0.9rem' }}>
            {offersError === 'Log in to see customer offers' ? (
              <span>
                💡 Please <button className="btn-link" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--clr-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }} onClick={() => setIsAuthModalOpen(true)}>Sign In</button> to view price offers from other customers.
              </span>
            ) : (
              <span>⚠️ {offersError}</span>
            )}
          </div>
        ) : offersList.length > 0 ? (
          <div className="anim-fade-in" style={{ color: 'var(--clr-text-secondary)', lineHeight: 1.8 }}>
            <table className="admin-table" style={{ background: 'var(--clr-bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)' }}>
              <thead>
                <tr style={{ background: 'var(--clr-bg-app)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.85rem' }}>Buyer Name</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.85rem' }}>Offered Price</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.85rem' }}>Offer Status</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.85rem' }}>Submitted At</th>
                  {isOwnProduct && <th style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.85rem' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const hasAcceptedOffer = offersList.some(o => o.offerStatus === 'ACCEPTED');
                  return offersList.map((offer) => {
                    const offerDate = new Date(offer.createAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <tr key={offer.id}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                          {buyerNames[offer.buyerId] || `Buyer #${offer.buyerId}`}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--clr-primary)' }}>
                          {formatPrice(offer.price)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {offer.offerStatus === 'PENDING' && (
                            <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>PENDING</span>
                          )}
                          {offer.offerStatus === 'ACCEPTED' && (
                            <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>ACCEPTED</span>
                          )}
                          {offer.offerStatus === 'REJECTED' && (
                            <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: 'hsl(0, 100%, 95%)', color: 'hsl(0, 100%, 40%)' }}>REJECTED</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{offerDate}</td>
                        {isOwnProduct && (
                          <td style={{ padding: '0.5rem 1rem' }}>
                            {offer.offerStatus === 'PENDING' && !hasAcceptedOffer ? (
                              <button
                                className="btn btn-primary"
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  borderRadius: 'var(--radius-sm)',
                                  color: '#ffffff'
                                }}
                                onClick={() => handleAcceptOffer(offer.id)}
                                disabled={acceptingOfferId === offer.id}
                              >
                                {acceptingOfferId === offer.id ? (
                                  <>
                                    <Loader2 size={12} className="anim-spin" />
                                    Accepting...
                                  </>
                                ) : (
                                  'Accept'
                                )}
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>
                                No Actions
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', background: 'var(--clr-bg-card)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', color: 'var(--clr-text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
            <span>No price offers have been submitted for this listing yet. Be the first to contact the seller!</span>
          </div>
        )}
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
                {sellerName ? sellerName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Seller: {sellerName || `User #${product.authorId}`}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Active on platform</div>
              </div>
            </div>
            <button
              onClick={closeChat}
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
            {chatLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '0.5rem', color: 'var(--clr-text-secondary)' }}>
                <Loader2 size={24} className="anim-spin" style={{ color: 'var(--clr-primary)' }} />
                <span style={{ fontSize: '0.85rem' }}>Loading conversation...</span>
              </div>
            ) : chatError ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '1rem', color: 'var(--clr-danger)', fontSize: '0.85rem', textAlign: 'center' }}>
                {chatError}
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '1rem', color: 'var(--clr-text-muted)', fontSize: '0.85rem', textAlign: 'center', fontStyle: 'italic' }}>
                No messages yet. Say hello to start the conversation!
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMine = msg.senderId === currentUser?.id;
                const timeStr = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Just now';
                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      background: isMine ? 'var(--clr-primary)' : 'var(--clr-bg-card)',
                      color: isMine ? 'white' : 'var(--clr-text-primary)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: isMine ? '12px 12px 0 12px' : '0 12px 12px 12px',
                      border: isMine ? 'none' : '1px solid var(--clr-border)',
                      fontSize: '0.85rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div>{msg.content}</div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        opacity: 0.6,
                        textAlign: 'right',
                        marginTop: '0.25rem'
                      }}
                    >
                      {timeStr}
                    </div>
                  </div>
                );
              })
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
              disabled={chatLoading}
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
              disabled={chatLoading}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Make Offer Modal */}
      {isOfferModalOpen && (
        <div className="admin-modal-overlay" onClick={() => !offerSubmitting && setIsOfferModalOpen(false)} style={{ zIndex: 300 }}>
          <div className="admin-modal anim-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="admin-modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--clr-text-primary)' }}>
                Suggest Alternative Price
              </h3>
              <button
                className="theme-switch"
                onClick={() => setIsOfferModalOpen(false)}
                disabled={offerSubmitting}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleOfferSubmit}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {offerSuccessMsg && (
                  <div
                    className="badge badge-success"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      width: '100%',
                      textTransform: 'none',
                      lineHeight: 1.4
                    }}
                  >
                    <Check size={16} style={{ flexShrink: 0 }} />
                    {offerSuccessMsg}
                  </div>
                )}

                {offerSubmitError && (
                  <div
                    className="badge badge-danger"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      width: '100%',
                      textTransform: 'none',
                      lineHeight: 1.4
                    }}
                  >
                    <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                    {offerSubmitError}
                  </div>
                )}

                <div style={{ background: 'var(--clr-bg-app)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', marginBottom: '0.25rem' }}>Item Listing:</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--clr-text-primary)', marginBottom: '0.5rem' }}>{product.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)' }}>
                    Original Price: <strong style={{ color: 'var(--clr-primary)' }}>{formatPrice(product.price)}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="offerPrice">Your Proposed Price (VND)</label>
                  <input
                    type="number"
                    id="offerPrice"
                    className="form-input"
                    placeholder="e.g. 5555000"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    required
                    disabled={offerSubmitting || !!offerSuccessMsg}
                    autoFocus
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsOfferModalOpen(false)}
                  disabled={offerSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  disabled={offerSubmitting || !!offerSuccessMsg}
                >
                  {offerSubmitting ? (
                    <>
                      <Loader2 size={14} className="anim-spin" />
                      Submitting Offer...
                    </>
                  ) : (
                    'Submit Offer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {isEditModalOpen && (
        <div className="admin-modal-overlay" onClick={() => !editSubmitting && setIsEditModalOpen(false)} style={{ zIndex: 300 }}>
          <div className="admin-modal anim-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="admin-modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--clr-text-primary)' }}>
                Edit Classified Listing
              </h3>
              <button
                className="theme-switch"
                onClick={() => setIsEditModalOpen(false)}
                disabled={editSubmitting}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {editLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.5rem', color: 'var(--clr-text-secondary)' }}>
                    <Loader2 size={24} className="anim-spin" />
                    <span>Fetching latest details...</span>
                  </div>
                ) : (
                  <>
                    {editError && (
                      <div
                        className="badge badge-danger"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          width: '100%',
                          textTransform: 'none',
                          lineHeight: 1.4
                        }}
                      >
                        <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                        {editError}
                      </div>
                    )}

                    {/* Title */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="title">Listing Title</label>
                      <input
                        type="text"
                        id="title"
                        className="form-input"
                        placeholder="e.g. iPhone 15 Pro"
                        value={editForm.title}
                        onChange={handleEditInputChange}
                        required
                        disabled={editSubmitting}
                      />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="content">Description</label>
                      <textarea
                        id="content"
                        className="form-input"
                        style={{ minHeight: '80px', padding: '0.5rem 0.75rem', fontFamily: 'inherit', resize: 'vertical' }}
                        placeholder="Description..."
                        value={editForm.content}
                        onChange={handleEditInputChange}
                        required
                        disabled={editSubmitting}
                      />
                    </div>

                    {/* Category & Price */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="categoryId">Category</label>
                        <select
                          id="categoryId"
                          className="form-input"
                          value={editForm.categoryId}
                          onChange={handleEditInputChange}
                          disabled={editSubmitting}
                        >
                          {editCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="price">Price (VND)</label>
                        <input
                          type="number"
                          id="price"
                          className="form-input"
                          placeholder="Price..."
                          value={editForm.price}
                          onChange={handleEditInputChange}
                          required
                          disabled={editSubmitting}
                        />
                      </div>
                    </div>

                    {/* Dimensions */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="width" style={{ fontSize: '0.75rem' }}>Width (cm)</label>
                        <input
                          type="number"
                          step="any"
                          id="width"
                          className="form-input"
                          placeholder="Width"
                          value={editForm.width}
                          onChange={handleEditInputChange}
                          required
                          disabled={editSubmitting}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="length" style={{ fontSize: '0.75rem' }}>Length (cm)</label>
                        <input
                          type="number"
                          step="any"
                          id="length"
                          className="form-input"
                          placeholder="Length"
                          value={editForm.length}
                          onChange={handleEditInputChange}
                          required
                          disabled={editSubmitting}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="height" style={{ fontSize: '0.75rem' }}>Height (cm)</label>
                        <input
                          type="number"
                          step="any"
                          id="height"
                          className="form-input"
                          placeholder="Height"
                          value={editForm.height}
                          onChange={handleEditInputChange}
                          required
                          disabled={editSubmitting}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="weight" style={{ fontSize: '0.75rem' }}>Weight (g)</label>
                        <input
                          type="number"
                          id="weight"
                          className="form-input"
                          placeholder="Weight"
                          value={editForm.weight}
                          onChange={handleEditInputChange}
                          required
                          disabled={editSubmitting}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  disabled={editSubmitting || editLoading}
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 size={14} className="anim-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW ADDRESS MODAL DIALOG */}
      {isAddressModalOpen && (
        <div className="admin-modal-overlay" onClick={() => !addressSubmitting && setIsAddressModalOpen(false)} style={{ zIndex: 300 }}>
          <div className="admin-modal anim-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="admin-modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--clr-text-primary)' }}>
                Add New Address
              </h3>
              <button
                className="theme-switch"
                onClick={() => setIsAddressModalOpen(false)}
                disabled={addressSubmitting}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddressSubmit}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {addressError && (
                  <div
                    className="badge badge-danger"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      width: '100%',
                      textTransform: 'none',
                      lineHeight: 1.4
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    {addressError}
                  </div>
                )}

                {/* Street */}
                <div className="form-group">
                  <label className="form-label" htmlFor="street">Street Address</label>
                  <input
                    type="text"
                    id="street"
                    className="form-input"
                    placeholder="e.g. Số 1 Đặng Văn Ngữ"
                    value={addressForm.street}
                    onChange={handleAddressInputChange}
                    required
                    disabled={addressSubmitting}
                    autoFocus
                  />
                </div>

                {/* Ward */}
                <div className="form-group">
                  <label className="form-label" htmlFor="ward">Ward</label>
                  <input
                    type="text"
                    id="ward"
                    className="form-input"
                    placeholder="e.g. phường 26"
                    value={addressForm.ward}
                    onChange={handleAddressInputChange}
                    required
                    disabled={addressSubmitting}
                  />
                </div>

                {/* District */}
                <div className="form-group">
                  <label className="form-label" htmlFor="district">District</label>
                  <select
                    id="district"
                    className="form-input"
                    value={addressForm.district}
                    onChange={handleAddressInputChange}
                    required
                    disabled={addressSubmitting}
                  >
                    <option value="">-- Chọn Quận/Huyện --</option>
                    {DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="form-group">
                  <label className="form-label" htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    className="form-input"
                    placeholder="Hồ Chí Minh"
                    value={addressForm.city}
                    onChange={handleAddressInputChange}
                    required
                    disabled={true}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddressModalOpen(false)}
                  disabled={addressSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  disabled={addressSubmitting}
                >
                  {addressSubmitting ? (
                    <>
                      <Loader2 size={14} className="anim-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Address'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
