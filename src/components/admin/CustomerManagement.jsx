import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserMinus, Shield, ShieldAlert, Loader2 } from 'lucide-react';
import { fetchAllUsers } from '../../services/userService';

export default function CustomerManagement() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search input state
  const [search, setSearch] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch users from API on mount
  useEffect(() => {
    const getUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllUsers();
        setUsersList(data);
      } catch (err) {
        console.error('Failed to load user database:', err);
        setError(err.message || 'Failed to load user list from server.');
      } finally {
        setLoading(false);
      }
    };
    getUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = usersList.filter((user) => {
    const searchLower = search.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.phone || '').toLowerCase().includes(searchLower) ||
      (user.role || '').toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination variables
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  // Guard current page range (if search query shrinks the list)
  const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));

  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalUsers);

  // Paginated user segment
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset pagination back to page 1 on filter change
  };

  return (
    <div className="anim-fade-in">
      <div className="admin-page-header">
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>Manage Users</h1>
        <span className="badge badge-primary">Live Registered User Base</span>
      </div>

      {/* Users table card */}
      <div className="admin-card-table">
        <div className="table-toolbar">
          <div className="table-search-wrapper">
            <Search size={16} className="search-icon" style={{ left: '12px' }} />
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.9rem' }}
              placeholder="Search by name, email, phone, or role..."
              value={search}
              onChange={handleSearchChange}
              disabled={loading || error !== null}
            />
          </div>
          {!loading && !error && (
            <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
              Showing {totalUsers > 0 ? startIndex + 1 : 0}-{endIndex} of {totalUsers} Accounts
            </span>
          )}
        </div>

        <div className="table-responsive-container" style={{ minHeight: '200px', position: 'relative' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5rem 0',
              color: 'var(--clr-primary)'
            }}>
              <Loader2 size={32} className="anim-spin" style={{ marginBottom: '1rem' }} />
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--clr-text-primary)' }}>
                Connecting to Railway database...
              </span>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4rem 0',
              color: 'var(--clr-danger)',
              textAlign: 'center'
            }}>
              <ShieldAlert size={48} style={{ strokeWidth: 1.5, marginBottom: '1rem' }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--clr-text-primary)', marginBottom: '0.5rem' }}>
                Database Query Failed
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                {error}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetchAllUsers()
                    .then(setUsersList)
                    .catch((err) => setError(err.message))
                    .finally(() => setLoading(false));
                }}
              >
                Retry Request
              </button>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Security Role</th>
                  <th>Registration Date</th>
                  <th style={{ width: '150px' }}>Access Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="anim-scale-in">
                      <td>
                        <div className="product-row-info">
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: user.role === 'ADMIN'
                              ? 'linear-gradient(135deg, hsl(0, 80%, 90%), hsl(15, 80%, 90%))'
                              : 'linear-gradient(135deg, var(--clr-primary-light), var(--clr-secondary-light))',
                            color: user.role === 'ADMIN' ? 'hsl(0, 80%, 50%)' : 'var(--clr-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: user.role === 'ADMIN' ? '1px solid hsl(0, 80%, 80%)' : 'none'
                          }}>
                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="product-row-name" style={{ fontWeight: 600 }}>
                            {user.name || 'Anonymous User'}
                          </span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td style={{ color: user.phone ? 'var(--clr-text-primary)' : 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
                        {user.phone || 'Not Configured'}
                      </td>
                      <td>
                        {user.role === 'ADMIN' ? (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}>
                            <Shield size={10} />
                            ADMIN
                          </span>
                        ) : (
                          <span className="badge badge-primary" style={{ padding: '0.25rem 0.5rem' }}>
                            CUSTOMER
                          </span>
                        )}
                      </td>
                      <td>
                        {user.createdAt ? (
                          new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td>
                        {user.isActive !== false ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <UserCheck size={10} />
                            Active Account
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'hsl(0, 100%, 95%)', color: 'hsl(0, 100%, 40%)' }}>
                            <UserMinus size={10} />
                            Suspended
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--clr-text-muted)' }}>
                      No registered user accounts matched your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && !error && totalUsers > 0 && (
          <div className="table-pagination">
            <span>
              Showing <strong style={{ color: 'var(--clr-text-primary)' }}>{startIndex + 1}-{endIndex}</strong> of{' '}
              <strong style={{ color: 'var(--clr-text-primary)' }}>{totalUsers}</strong> Accounts
            </span>

            <div className="pagination-controls">
              <button
                className="pagination-btn theme-switch"
                disabled={activePage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className="pagination-btn theme-switch"
                  style={
                    activePage === page
                      ? {
                        background: 'var(--clr-primary)',
                        color: 'white',
                        borderColor: 'var(--clr-primary)'
                      }
                      : {}
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="pagination-btn theme-switch"
                disabled={activePage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
