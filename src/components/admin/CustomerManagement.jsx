import React, { useState, useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { Search, UserCheck } from 'lucide-react';

export default function CustomerManagement() {
  const { customers } = useContext(ShopContext);

  // Search input state
  const [search, setSearch] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter((cust) =>
    cust.name.toLowerCase().includes(search.toLowerCase()) ||
    cust.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="anim-fade-in">
      <div className="admin-page-header">
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>Customer Profile Management</h1>
        <span className="badge badge-primary">Registered User Base</span>
      </div>

      {/* Customers table card */}
      <div className="admin-card-table">
        <div className="table-toolbar">
          <div className="table-search-wrapper">
            <Search size={16} className="search-icon" style={{ left: '12px' }} />
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.9rem' }}
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
            Showing {filteredCustomers.length} of {customers.length} Profiles
          </span>
        </div>

        <div className="table-responsive-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email address</th>
                <th>Joined Date</th>
                <th>Orders count</th>
                <th>Lifetime spend</th>
                <th style={{ width: '120px' }}>Activity Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="anim-scale-in">
                    <td>
                      <div className="product-row-info">
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--clr-primary-light), var(--clr-secondary-light))',
                          color: 'var(--clr-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          {cust.name.charAt(0)}
                        </div>
                        <span className="product-row-name">{cust.name}</span>
                      </div>
                    </td>
                    <td>{cust.email}</td>
                    <td>
                      {new Date(cust.joinedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{cust.ordersCount} Orders</td>
                    <td style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>
                      ${cust.totalSpent.toFixed(2)}
                    </td>
                    <td>
                      {cust.ordersCount > 0 ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <UserCheck size={10} />
                          Active Buyer
                        </span>
                      ) : (
                        <span className="badge badge-primary">Idle Account</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--clr-text-muted)' }}>
                    No customer profiles matched your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
