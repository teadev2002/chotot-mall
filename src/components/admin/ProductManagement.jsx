import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

export default function ProductManagement() {
  // Post data states
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search input state
  const [search, setSearch] = useState('');

  // Modal Management states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form Fields state for Post
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    price: '',
    width: '',
    length: '',
    height: '',
    weight: '',
    categoryId: '1',
    published: true
  });

  const [errors, setErrors] = useState({});

  // 1. Fetch Posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('https://cho-tot-production.up.railway.app/post/all');
        if (!response.ok) {
          throw new Error(`Failed to fetch posts from server (Status: ${response.status})`);
        }
        const resData = await response.json();
        if (resData.success && Array.isArray(resData.data)) {
          setPosts(resData.data);
        } else {
          throw new Error(resData.message || 'Failed to retrieve post array.');
        }
      } catch (err) {
        console.error('Fetch posts error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Filter posts by search
  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.content && p.content.toLowerCase().includes(search.toLowerCase()))
  );

  // Helper to map categoryId to category text
  const getCategoryName = (catId) => {
    const id = Number(catId);
    if (id === 1) return 'Electronics';
    if (id === 2) return 'Fashion';
    return 'Accessories';
  };

  // Open modal for Creating new post
  const handleOpenAddModal = () => {
    setEditMode(false);
    setCurrentId(null);
    setFormData({
      title: '',
      content: '',
      price: '',
      width: '',
      length: '',
      height: '',
      weight: '',
      categoryId: '1',
      published: true
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Open modal for Editing existing post
  const handleOpenEditModal = (post) => {
    setEditMode(true);
    setCurrentId(post.id);
    setFormData({
      title: post.title || '',
      content: post.content || '',
      price: post.price !== null && post.price !== undefined ? post.price.toString() : '',
      width: post.width !== null && post.width !== undefined ? post.width.toString() : '',
      length: post.length !== null && post.length !== undefined ? post.length.toString() : '',
      height: post.height !== null && post.height !== undefined ? post.height.toString() : '',
      weight: post.weight !== null && post.weight !== undefined ? post.weight.toString() : '',
      categoryId: post.categoryId ? post.categoryId.toString() : '1',
      published: post.published !== undefined ? post.published : true
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Delete post handler
  const handleDeletePost = (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Form submit handler (Local state CRUD helper)
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};

    if (!formData.title.trim()) errs.title = 'Post Title is required';
    if (!formData.content.trim()) errs.content = 'Post Content is required';
    
    // Numeric checks (Optional fields, but must be valid if filled)
    if (formData.price.trim() && (isNaN(formData.price) || Number(formData.price) < 0)) {
      errs.price = 'Price must be a valid number &ge; 0';
    }
    if (formData.width.trim() && (isNaN(formData.width) || Number(formData.width) < 0)) {
      errs.width = 'Width must be a valid number';
    }
    if (formData.length.trim() && (isNaN(formData.length) || Number(formData.length) < 0)) {
      errs.length = 'Length must be a valid number';
    }
    if (formData.height.trim() && (isNaN(formData.height) || Number(formData.height) < 0)) {
      errs.height = 'Height must be a valid number';
    }
    if (formData.weight.trim() && (isNaN(formData.weight) || Number(formData.weight) < 0)) {
      errs.weight = 'Weight must be a valid number';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const postPayload = {
      title: formData.title,
      content: formData.content,
      price: formData.price.trim() ? parseFloat(formData.price) : null,
      width: formData.width.trim() ? parseFloat(formData.width) : null,
      length: formData.length.trim() ? parseFloat(formData.length) : null,
      height: formData.height.trim() ? parseFloat(formData.height) : null,
      weight: formData.weight.trim() ? parseFloat(formData.weight) : null,
      categoryId: parseInt(formData.categoryId),
      published: formData.published,
      updatedAt: new Date().toISOString()
    };

    if (editMode) {
      setPosts((prev) =>
        prev.map((p) => (p.id === currentId ? { ...p, ...postPayload } : p))
      );
    } else {
      const newPost = {
        ...postPayload,
        id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
        createdAt: new Date().toISOString(),
        authorId: 1
      };
      setPosts((prev) => [newPost, ...prev]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="anim-fade-in">
      <div className="admin-page-header">
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>Post Management Console</h1>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          Create Post
        </button>
      </div>

      {/* API Loading / Error States */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--clr-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
          <div className="anim-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--clr-primary-light)', borderTopColor: 'var(--clr-primary)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--clr-text-secondary)' }}>Retrieving active posts from server...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--clr-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border)' }}>
          <AlertCircle size={36} style={{ color: 'var(--clr-danger)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Failed to Load Posts</h3>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>Retry Connection</button>
        </div>
      ) : (
        /* Main Posts List Card */
        <div className="admin-card-table">
          <div className="table-toolbar">
            <div className="table-search-wrapper">
              <Search size={16} className="search-icon" style={{ left: '12px' }} />
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.9rem' }}
                placeholder="Search posts by title or details..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
              Showing {filteredPosts.length} of {posts.length} Posts
            </span>
          </div>

          <div className="table-responsive-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Post ID</th>
                  <th>Title & Content Preview</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Dimensions (L x W x H | Wt)</th>
                  <th>Publish Status</th>
                  <th>Date Created</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post) => (
                    <tr key={post.id} className="anim-scale-in">
                      <td style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>#{post.id}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--clr-text-primary)' }}>{post.title}</div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--clr-text-muted)',
                          maxWidth: '280px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={post.content}>
                          {post.content}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                          {getCategoryName(post.categoryId)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--clr-text-primary)' }}>
                        {post.price !== null && post.price !== undefined ? `$${Number(post.price).toFixed(2)}` : 'N/A'}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>
                        {post.length || post.width || post.height ? (
                          <span>
                            {post.length || 0} x {post.width || 0} x {post.height || 0} cm
                            <br />
                            <small style={{ color: 'var(--clr-text-muted)' }}>Wt: {post.weight || 0} kg</small>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--clr-text-muted)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {post.published ? (
                          <span className="badge badge-success">Published</span>
                        ) : (
                          <span className="badge badge-warning">Draft</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          <button
                            className="icon-action-btn edit-btn"
                            title="Edit Post"
                            onClick={() => handleOpenEditModal(post)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="icon-action-btn delete-btn"
                            title="Delete Post"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--clr-text-muted)' }}>
                      No posts found matching search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Post Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '540px' }}>
            <div className="admin-modal-header">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editMode ? 'Edit Post Details' : 'Create New Post Entry'}
              </h2>
              <button className="theme-switch" onClick={() => setIsModalOpen(false)} style={{ width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {/* Title */}
                <div className="form-group">
                  <label className="form-label" htmlFor="post-title">Post Title</label>
                  <input
                    type="text"
                    id="post-title"
                    name="title"
                    className="form-input"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. MacBook Air M2"
                  />
                  {errors.title && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{errors.title}</span>}
                </div>

                {/* Category & Price */}
                <div className="grid-2col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="post-cat">Category</label>
                    <select
                      id="post-cat"
                      name="categoryId"
                      className="form-select"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                    >
                      <option value="1">Electronics (ID: 1)</option>
                      <option value="2">Fashion (ID: 2)</option>
                      <option value="3">Accessories (ID: 3)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="post-price">Price ($) <small style={{ color: 'var(--clr-text-muted)' }}>(Optional)</small></label>
                    <input
                      type="text"
                      id="post-price"
                      name="price"
                      className="form-input"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="Leave blank or enter value"
                    />
                    {errors.price && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{errors.price}</span>}
                  </div>
                </div>

                {/* Dimensions: Length & Width */}
                <div className="grid-2col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="post-length">Length (cm) <small style={{ color: 'var(--clr-text-muted)' }}>(Optional)</small></label>
                    <input
                      type="text"
                      id="post-length"
                      name="length"
                      className="form-input"
                      value={formData.length}
                      onChange={handleInputChange}
                      placeholder="e.g. 30"
                    />
                    {errors.length && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{errors.length}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="post-width">Width (cm) <small style={{ color: 'var(--clr-text-muted)' }}>(Optional)</small></label>
                    <input
                      type="text"
                      id="post-width"
                      name="width"
                      className="form-input"
                      value={formData.width}
                      onChange={handleInputChange}
                      placeholder="e.g. 21"
                    />
                    {errors.width && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{errors.width}</span>}
                  </div>
                </div>

                {/* Dimensions: Height & Weight */}
                <div className="grid-2col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="post-height">Height (cm) <small style={{ color: 'var(--clr-text-muted)' }}>(Optional)</small></label>
                    <input
                      type="text"
                      id="post-height"
                      name="height"
                      className="form-input"
                      value={formData.height}
                      onChange={handleInputChange}
                      placeholder="e.g. 1"
                    />
                    {errors.height && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{errors.height}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="post-weight">Weight (kg) <small style={{ color: 'var(--clr-text-muted)' }}>(Optional)</small></label>
                    <input
                      type="text"
                      id="post-weight"
                      name="weight"
                      className="form-input"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="e.g. 1.2"
                    />
                    {errors.weight && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{errors.weight}</span>}
                  </div>
                </div>

                {/* Content */}
                <div className="form-group">
                  <label className="form-label" htmlFor="post-content">Post Content / Details</label>
                  <textarea
                    id="post-content"
                    name="content"
                    className="form-textarea"
                    rows="3"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter details, description, condition..."
                  />
                  {errors.content && <span style={{ fontSize: '0.75rem', color: 'var(--clr-danger)' }}>{errors.content}</span>}
                </div>

                {/* Publish State */}
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="post-published"
                    name="published"
                    checked={formData.published}
                    onChange={handleInputChange}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--clr-primary)' }}
                  />
                  <label htmlFor="post-published" style={{ fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
                    Publish post immediately (Make visible to public)
                  </label>
                </div>
              </div>

              {/* Modal Footer actions */}
              <div className="admin-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Save Changes' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
