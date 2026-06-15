import React, { useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { products, customers } = useContext(ShopContext);

  // 1. Classifieds KPI Calculations
  const totalListings = products.length;
  const totalUsers = customers.length;
  const draftListingsCount = products.filter((p) => p.published === false).length;
  const categoriesCount = new Set(products.map((p) => p.category)).size || 3;

  // Draft Listings table data
  const draftListings = products.filter((p) => p.published === false);

  // 2. Custom SVG Chart A Data: Listings volume over the last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const postsByDate = last7Days.map((date) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    // Filter posts created on this date
    const count = products.filter((p) => p.createdAt && p.createdAt.startsWith(date)).length;
    return { label: formattedDate, value: count };
  });

  // Chart Dimensions & Vector Plot math
  const chartWidth = 500;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  const maxPostsVal = Math.max(...postsByDate.map((d) => d.value), 4);
  const getX = (index) => paddingX + (index * (chartWidth - paddingX * 2)) / (postsByDate.length - 1);
  const getY = (val) => chartHeight - paddingY - (val * (chartHeight - paddingY * 2)) / maxPostsVal;

  // Build SVG Path strings for Listings Volume Chart
  const linePoints = postsByDate.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const linePath = linePoints.length > 0 ? `M ${linePoints.join(' L ')}` : '';
  const areaPath = linePoints.length > 0 ? `${linePath} L ${getX(postsByDate.length - 1)},${chartHeight - paddingY} L ${getX(0)},${chartHeight - paddingY} Z` : '';

  // 3. Custom SVG Chart B Data: Listings count by Category
  const categories = ['Electronics', 'Fashion', 'Accessories'];
  const categoryCount = categories.map((cat) => {
    const count = products.filter((p) => p.category === cat).length;
    return { label: cat, value: count };
  });

  const maxCatCount = Math.max(...categoryCount.map((c) => c.value), 5);
  const barChartWidth = 360;
  const barChartHeight = 180;
  const barPaddingX = 50;
  const barPaddingY = 20;
  const barWidth = 40;

  const getBarX = (index) => barPaddingX + (index * (barChartWidth - barPaddingX * 2)) / (categoryCount.length - 1) - barWidth / 2;
  const getBarY = (val) => barChartHeight - barPaddingY - (val * (barChartHeight - barPaddingY * 2)) / maxCatCount;

  return (
    <div className="anim-fade-in">
      <div className="admin-page-header">
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>Classifieds Administration Dashboard</h1>
        <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', background: 'var(--clr-bg-card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--clr-border)' }}>
          Sync Status: <span style={{ color: 'var(--clr-success)', fontWeight: 700 }}>Online</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="kpi-grid">
        {/* KPI 1 */}
        <div className="kpi-card anim-scale-in">
          <div className="kpi-info">
            <span className="kpi-label">Active Listings</span>
            <span className="kpi-value">{totalListings}</span>
            <span className="kpi-change positive">
              <TrendingUp size={12} />
              Posts in database
            </span>
          </div>
          <div className="kpi-icon-wrapper success">
            <ShoppingBag size={22} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card anim-scale-in">
          <div className="kpi-info">
            <span className="kpi-label">Registered Users</span>
            <span className="kpi-value">{totalUsers}</span>
            <span className="kpi-change positive">
              <TrendingUp size={12} />
              Customer profiles
            </span>
          </div>
          <div className="kpi-icon-wrapper primary">
            <Users size={22} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card anim-scale-in">
          <div className="kpi-info">
            <span className="kpi-label">Draft / Private Posts</span>
            <span className="kpi-value">{draftListingsCount}</span>
            <span className="kpi-change warning">
              Awaiting review
            </span>
          </div>
          <div className="kpi-icon-wrapper warning">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card anim-scale-in">
          <div className="kpi-info">
            <span className="kpi-label">Listing Categories</span>
            <span className="kpi-value">{categoriesCount}</span>
            <span className="kpi-change positive">
              Active sectors
            </span>
          </div>
          <div className="kpi-icon-wrapper danger">
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>
        </div>
      </section>

      {/* Custom Vector Charts */}
      <section className="charts-grid">
        {/* Chart A: Daily Listing Volume */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">New Listings Posted (Past 7 Days)</h2>
            <span className="badge badge-primary">Volume</span>
          </div>
          <div className="chart-svg-container">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 1, 2, 3].map((g) => {
                const yVal = paddingY + (g * (chartHeight - paddingY * 2)) / 3;
                return (
                  <line
                    key={g}
                    x1={paddingX}
                    y1={yVal}
                    x2={chartWidth - paddingX}
                    y2={yVal}
                    className="chart-axis-line"
                  />
                );
              })}

              {/* Shaded Area */}
              {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

              {/* Line */}
              {linePath && <path d={linePath} className="chart-line" />}

              {/* Data circles & Tooltips */}
              {postsByDate.map((d, i) => (
                <g key={i}>
                  <circle
                    cx={getX(i)}
                    cy={getY(d.value)}
                    r="5"
                    className="chart-data-point"
                  />
                  <text
                    x={getX(i)}
                    y={chartHeight - 4}
                    textAnchor="middle"
                    className="chart-text"
                  >
                    {d.label}
                  </text>
                  {/* Metric Value labels */}
                  <text
                    x={getX(i)}
                    y={getY(d.value) - 10}
                    textAnchor="middle"
                    fill="var(--clr-text-primary)"
                    fontSize="9px"
                    fontWeight="bold"
                  >
                    {d.value}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Chart B: Category Listing Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Listings by Category</h2>
            <span className="badge badge-warning">Current Counts</span>
          </div>
          <div className="chart-svg-container">
            <svg viewBox={`0 0 ${barChartWidth} ${barChartHeight}`} width="100%" height="100%">
              {/* Grid Lines */}
              {[0, 1, 2, 3].map((g) => {
                const yVal = barPaddingY + (g * (barChartHeight - barPaddingY * 2)) / 3;
                return (
                  <line
                    key={g}
                    x1={barPaddingX}
                    y1={yVal}
                    x2={barChartWidth - barPaddingX}
                    y2={yVal}
                    className="chart-axis-line"
                  />
                );
              })}

              {/* Columns */}
              {categoryCount.map((c, i) => {
                const barX = getBarX(i);
                const barY = getBarY(c.value);
                const barH = barChartHeight - barPaddingY - barY;

                return (
                  <g key={i}>
                    <rect
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={barH > 0 ? barH : 2}
                      className="chart-bar"
                    />
                    <text
                      x={barX + barWidth / 2}
                      y={barChartHeight - 4}
                      textAnchor="middle"
                      className="chart-text"
                    >
                      {c.label}
                    </text>
                    <text
                      x={barX + barWidth / 2}
                      y={barY - 8}
                      textAnchor="middle"
                      fill="var(--clr-text-primary)"
                      fontSize="10px"
                      fontWeight="bold"
                    >
                      {c.value} Posts
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      {/* Draft Listings Awaiting Review */}
      <section className="admin-card-table">
        <div className="table-toolbar" style={{ background: 'var(--clr-warning-light)', color: 'var(--clr-warning-dark)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <AlertTriangle size={18} />
            Draft & Unpublished Listings ({draftListings.length})
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Action: Manage in "Manage Posts" tab</span>
        </div>

        <div className="table-responsive-container">
          {draftListings.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Post Title</th>
                  <th>Category</th>
                  <th>Seller Account</th>
                  <th>Publish Status</th>
                </tr>
              </thead>
              <tbody>
                {draftListings.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div className="product-row-info">
                        <img src={prod.image} alt={prod.title} className="product-row-img" />
                        <span className="product-row-name">{prod.title}</span>
                      </div>
                    </td>
                    <td>{prod.category}</td>
                    <td style={{ fontWeight: 600 }}>User #{prod.authorId}</td>
                    <td>
                      <span className="badge badge-warning">Draft</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
              ✓ All platform posts are currently active and published. No pending drafts.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
