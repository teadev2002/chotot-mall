import React, { useState, useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { Search } from 'lucide-react';

export default function OrderManagement() {
  const { orders, updateOrderStatus } = useContext(ShopContext);

  // Search input state
  const [search, setSearch] = useState('');

  // Filter orders
  const filteredOrders = orders.filter((ord) =>
    ord.id.toLowerCase().includes(search.toLowerCase()) ||
    ord.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    ord.customer.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const getStatusClass = (status) => {
    if (status === 'pending') return 'status-pending';
    if (status === 'processing') return 'status-processing';
    if (status === 'shipped') return 'status-shipped';
    if (status === 'delivered') return 'status-delivered';
    return '';
  };

  return (
    <div className="anim-fade-in">
      <div className="admin-page-header">
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>Customer Order Management</h1>
        <span className="badge badge-primary">Order Pipeline Tracking</span>
      </div>

      {/* Orders table container card */}
      <div className="admin-card-table">
        <div className="table-toolbar">
          <div className="table-search-wrapper">
            <Search size={16} className="search-icon" style={{ left: '12px' }} />
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: '2.25rem', height: '40px', fontSize: '0.9rem' }}
              placeholder="Search by Order ID, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
            Showing {filteredOrders.length} of {orders.length} Orders
          </span>
        </div>

        <div className="table-responsive-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date Placed</th>
                <th>Customer details</th>
                <th>Ordered Items</th>
                <th>Total Billed</th>
                <th>Payment</th>
                <th style={{ width: '160px' }}>Pipeline Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="anim-scale-in">
                    <td style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>{ord.id}</td>
                    <td>
                      {new Date(ord.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                        {new Date(ord.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--clr-text-primary)' }}>{ord.customer.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{ord.customer.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {ord.items.map((item) => (
                          <span key={item.cartItemId} style={{ fontSize: '0.85rem' }}>
                            • {item.title} <strong style={{ color: 'var(--clr-primary)' }}>x{item.qty}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--clr-text-primary)' }}>
                      ${ord.total.toFixed(2)}
                    </td>
                    <td>
                      <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td>
                      {/* Pipeline Status drop-down selector */}
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className={`order-status-select ${getStatusClass(ord.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--clr-text-muted)' }}>
                    No orders matching your search filters were found.
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
