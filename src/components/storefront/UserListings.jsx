import React, { useContext, useState, useEffect } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { ArrowLeft, Eye, MapPin, Calendar, Mail, Phone, Plus, X, Upload, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { fetchCategories } from '../../services/productService';
import { saveUserAddress, fetchUserProfile, fetchUserAddress, updateUserPhone } from '../../services/userService';

const DISTRICTS = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12',
  'Quận Bình Tân', 'Quận Bình Thạnh', 'Quận Gò Vấp', 'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú'
];

export default function UserListings() {
  const {
    userProfile,
    userListings,
    userListingsLoading,
    setSelectedProductId,
    setView,
    formatPrice,
    currentUser,
    setCurrentUser,
    loadUserListings
  } = useContext(ShopContext);

  // Form states for creating a new post listing
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState([
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Fashion' },
    { id: 3, name: 'Accessories' }
  ]);
  const [createForm, setCreateForm] = useState({
    title: '',
    content: '',
    price: '',
    categoryId: '1',
    width: '',
    length: '',
    height: '',
    weight: ''
  });

  // Fetch categories from API on mount
  useEffect(() => {
    const getCategoriesList = async () => {
      try {
        const cats = await fetchCategories();
        if (cats && cats.length > 0) {
          setCategoriesList(cats);
          setCreateForm(prev => ({ ...prev, categoryId: String(cats[0].id) }));
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    getCategoriesList();
  }, []);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Address & Phone verification states
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [afterAddressSubmitAction, setAfterAddressSubmitAction] = useState(null);
  const [addressForm, setAddressForm] = useState({
    phone: '',
    street: '',
    ward: 'phường',
    district: '',
    city: 'Hồ Chí Minh'
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressError, setAddressError] = useState(null);

  const handleBackToCatalog = () => {
    setView('storefront');
    window.history.pushState(null, '', '/');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('title', createForm.title.trim());
      formData.append('content', createForm.content.trim());
      formData.append('price', createForm.price);
      formData.append('categoryId', createForm.categoryId);
      formData.append('width', createForm.width);
      formData.append('length', createForm.length);
      formData.append('height', createForm.height);
      formData.append('weight', createForm.weight);
      
      if (selectedFile) {
        formData.append('files', selectedFile);
      }

      // Execute live POST request using apiFetch with user authorization token
      const response = await apiFetch('https://cho-tot-production.up.railway.app/post/create', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMsg = 'Failed to create post on server.';
        try {
          const errJSON = await response.json();
          if (errJSON && errJSON.message) errorMsg = errJSON.message;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      // Close modal and reset state
      setIsCreateModalOpen(false);
      setCreateForm({
        title: '',
        content: '',
        price: '',
        categoryId: '1',
        width: '',
        length: '',
        height: '',
        weight: ''
      });
      setSelectedFile(null);
      setFilePreviewUrl('');

      // Reload listings to include the newly created post
      if (currentUser) {
        await loadUserListings(currentUser.id);
      }
    } catch (err) {
      console.error('Create listing error:', err);
      setSubmitError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCreateModal = async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch user profile to check phone
      const profile = await fetchUserProfile(currentUser.id);
      const hasPhone = !!(profile && profile.phone && profile.phone.trim() !== '');

      // 2. Fetch user address
      const address = await fetchUserAddress(currentUser.id);

      if (!hasPhone || !address) {
        setAddressForm({
          phone: profile?.phone || '',
          street: address?.street || '',
          ward: address?.ward || 'phường',
          district: address?.district || '',
          city: 'Hồ Chí Minh'
        });
        setShowPhoneInput(!hasPhone);
        setAfterAddressSubmitAction('open-create');
        setAddressError(null);
        setAddressSubmitting(false);
        setIsAddressModalOpen(true);
      } else {
        setAfterAddressSubmitAction(null);
        setIsCreateModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to verify profile/address on create listing:', err);
      setShowPhoneInput(true);
      setAfterAddressSubmitAction('open-create');
      setAddressForm({
        phone: '',
        street: '',
        ward: 'phường',
        district: '',
        city: 'Hồ Chí Minh'
      });
      setIsAddressModalOpen(true);
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

    try {
      // 1. If phone input is shown, call updateUserPhone API first
      if (showPhoneInput) {
        const phoneVal = addressForm.phone.trim();
        if (!phoneVal) {
          throw new Error('Please enter a phone number');
        }
        await updateUserPhone(phoneVal);
        // Sync context user state
        if (setCurrentUser) {
          setCurrentUser((prev) => ({
            ...prev,
            phone: phoneVal
          }));
        }
      }

      // 2. Save user address details
      let wardValue = addressForm.ward.trim();
      if (!wardValue.toLowerCase().startsWith('phường')) {
        wardValue = `phường ${wardValue}`.trim();
      }

      await saveUserAddress({
        userId: Number(currentUser.id),
        street: addressForm.street.trim(),
        ward: wardValue,
        district: addressForm.district.trim(),
        city: 'Hồ Chí Minh'
      });

      setAddressForm({
        phone: '',
        street: '',
        ward: 'phường',
        district: '',
        city: 'Hồ Chí Minh'
      });
      setIsAddressModalOpen(false);

      // Reload listings page profile data to pull updated addresses list from server
      await loadUserListings(currentUser.id);

      if (afterAddressSubmitAction === 'open-create') {
        setIsCreateModalOpen(true);
      }
      setAfterAddressSubmitAction(null);
    } catch (err) {
      console.error('Save profile/address error:', err);
      setAddressError(err.message || 'An error occurred while saving.');
    } finally {
      setAddressSubmitting(false);
    }
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

  const isOwnProfile = currentUser && String(currentUser.id) === String(userProfile.id);

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

          {/* Addresses Section */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--clr-border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--clr-text-primary)' }}>
                User Addresses:
              </h4>
              {isOwnProfile && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    border: '1px solid var(--clr-border)',
                    background: 'var(--clr-bg-card)'
                  }}
                  onClick={() => {
                    setAddressForm({ street: '', ward: 'phường', district: '', city: 'Hồ Chí Minh' });
                    setAddressError(null);
                    setIsAddressModalOpen(true);
                  }}
                >
                  <Plus size={12} />
                  Add Address
                </button>
              )}
            </div>
            
            {userProfile.addresses && userProfile.addresses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                {userProfile.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.35rem',
                      fontSize: '0.85rem',
                      color: 'var(--clr-text-secondary)',
                      lineHeight: 1.4
                    }}
                  >
                    <MapPin size={14} style={{ color: 'var(--clr-primary)', marginTop: '0.15rem', flexShrink: 0 }} />
                    <span>{addr.street}, {addr.ward}, {addr.district}, {addr.city}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>
                No addresses saved yet.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* User listings catalog header with action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--clr-text-primary)' }}>
          Active Post Listings ({userListings.length})
        </h2>
        {isOwnProfile && (
          <button
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Plus size={16} />
            Create New Listing
          </button>
        )}
      </div>

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
          {isOwnProfile && (
            <button className="btn btn-primary" onClick={handleOpenCreateModal}>
              Create New Listing
            </button>
          )}
        </div>
      )}

      {/* CREATE NEW LISTING MODAL DIALOG */}
      {isCreateModalOpen && (
        <div className="admin-modal-overlay" onClick={() => !submitting && setIsCreateModalOpen(false)} style={{ zIndex: 300 }}>
          <div className="admin-modal anim-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="admin-modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--clr-text-primary)' }}>
                Create New Classified Listing
              </h3>
              <button
                className="theme-switch"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={submitting}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {submitError && (
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
                    {submitError}
                  </div>
                )}

                {/* Title */}
                <div className="form-group">
                  <label className="form-label" htmlFor="title">Listing Title</label>
                  <input
                    type="text"
                    id="title"
                    className="form-input"
                    placeholder="e.g. Honor GT Pro"
                    value={createForm.title}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Content / Description */}
                <div className="form-group">
                  <label className="form-label" htmlFor="content">Description</label>
                  <textarea
                    id="content"
                    className="form-input"
                    style={{ minHeight: '80px', padding: '0.5rem 0.75rem', fontFamily: 'inherit', resize: 'vertical' }}
                    placeholder="e.g. 12GB RAM - 512GB ROM, original charger included..."
                    value={createForm.content}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                  />
                </div>

                {/* Category & Price Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="categoryId">Category</label>
                    <select
                      id="categoryId"
                      className="form-input"
                      value={createForm.categoryId}
                      onChange={handleInputChange}
                      disabled={submitting}
                    >
                      {categoriesList.map((cat) => (
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
                      placeholder="e.g. 11000000"
                      value={createForm.price}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Dimensions: Width, Length, Height, Weight Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="width" style={{ fontSize: '0.75rem' }}>Width (cm)</label>
                    <input
                      type="number"
                      step="any"
                      id="width"
                      className="form-input"
                      placeholder="12"
                      value={createForm.width}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="length" style={{ fontSize: '0.75rem' }}>Length (cm)</label>
                    <input
                      type="number"
                      step="any"
                      id="length"
                      className="form-input"
                      placeholder="6"
                      value={createForm.length}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="height" style={{ fontSize: '0.75rem' }}>Height (cm)</label>
                    <input
                      type="number"
                      step="any"
                      id="height"
                      className="form-input"
                      placeholder="0.7"
                      value={createForm.height}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="weight" style={{ fontSize: '0.75rem' }}>Weight (g)</label>
                    <input
                      type="number"
                      id="weight"
                      className="form-input"
                      placeholder="212"
                      value={createForm.weight}
                      onChange={handleInputChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Image Upload File Box */}
                <div className="form-group">
                  <label className="form-label">Product Image File</label>
                  <div style={{
                    border: '2px dashed var(--clr-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    background: 'var(--clr-bg-app)',
                    transition: 'border-color var(--transition-fast)'
                  }} onClick={() => document.getElementById('files-upload').click()}>
                    <input
                      type="file"
                      id="files-upload"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                    
                    {filePreviewUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <img
                          src={filePreviewUrl}
                          alt="Upload preview"
                          style={{
                            maxWidth: '120px',
                            maxHeight: '120px',
                            borderRadius: 'var(--radius-xs)',
                            objectFit: 'cover',
                            border: '1px solid var(--clr-border)'
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-primary)', fontWeight: 600 }}>
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>
                          Click to select a different image
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--clr-text-secondary)' }}>
                        <Upload size={24} style={{ color: 'var(--clr-text-muted)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--clr-text-primary)' }}>
                          Click to upload classified photo
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                          Supports JPEG, PNG, WEBP (type image/webp)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="anim-spin" />
                      Creating Listing...
                    </>
                  ) : (
                    'Create Listing'
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

                {/* Phone number */}
                {showPhoneInput && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number</label>
                    <input
                      type="text"
                      id="phone"
                      className="form-input"
                      placeholder="e.g. 0900000123"
                      value={addressForm.phone}
                      onChange={handleAddressInputChange}
                      required
                      disabled={addressSubmitting}
                      autoFocus
                    />
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
                    autoFocus={!showPhoneInput}
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
