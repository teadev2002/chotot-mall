import React, { useContext } from 'react';
import { ShopContext } from '../../context/ShopContext';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { orders, products, customers } = useContext(ShopContext);

  // 1. KPI Calculations
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.total, 0);
  const totalOrdersCount = orders.length;
  const totalCustomersCount = customers.length;
  const averageOrderValue = totalOrdersCount > 0 ? (totalRevenue / totalOrdersCount) : 0;

  // Find products with low inventory stock (stock < 5)
  const lowStockProducts = products.filter((prod) => prod.stock < 5);

  // 2. Custom SVG Chart A Data: Sales over the last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const salesByDate = last7Days.map((date) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    const dateOrders = orders.filter((ord) => ord.date.startsWith(date));
    const revenue = dateOrders.reduce((sum, ord) => sum + ord.total, 0);
    return { label: formattedDate, value: revenue };
  });

  // Chart Dimensions & Vector Plot math
  const chartWidth = 500;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  const maxSalesVal = Math.max(...salesByDate.map((d) => d.value), 100);
  const getX = (index) => paddingX + (index * (chartWidth - paddingX * 2)) / (salesByDate.length - 1);
  const getY = (val) => chartHeight - paddingY - (val * (chartHeight - paddingY * 2)) / maxSalesVal;

  // Build SVG Path strings for Sales Chart
  const linePoints = salesByDate.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const linePath = linePoints.length > 0 ? `M ${linePoints.join(' L ')}` : '';
  const areaPath = linePoints.length > 0 ? `${linePath} L ${getX(salesByDate.length - 1)},${chartHeight - paddingY} L ${getX(0)},${chartHeight - paddingY} Z` : '';

  // 3. Custom SVG Chart B Data: Products count by Category
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
        <h1 className="hero-title" style={{ fontSize: '2rem' }}>Analytics Dashboard</h1>
        <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', background: 'var(--clr-bg-card)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--clr-border)' }}>
          Database Sync Status: <span style={{ color: 'var(--clr-success)', fontWeight: 700 }}>Active</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section className="kpi-grid">
        {/* KPI 1 */}
        <div className="kpi-card anim-scale-in">
          <div className="kpi-info">
            <span className="kpi-label">Gross Revenue</span>
            <span className="kpi-value">${totalRevenue.toFixed(2)}</span>
            <span className="kpi-change positive">
              <TrendingUp size={12} />
              +12.4% vs last week
            </span>
          </div>
          <div className="kpi-icon-wrapper success">
            <DollarSign size={22} />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card anim-scale-in">
          <div className="kpi-info">
            <span className="kpi-label">Total Transactions</span>
            <span className="kpi-value">{totalOrdersCount}</span>
            <span className="kpi-change positive">
              <TrendingUp size={12} />
              +8.1% vs last week
            </span>
          </div>
          <div className="kpi-icon-wrapper primary">
            <ShoppingBag size={22} />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card anim-scale-in">
          <div className="kpi-info">
            <span className="kpi-label">Active Users</span>
            <span className="kpi-value">{totalCustomersCount}</span>
            <span className="kpi-change positive">
              <TrendingUp size={12} />
              +14.2% user growth
            </span>
          </div>
          <div className="kpi-icon-wrapper warning">
            <Users size={22} />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card anim-scale-in">
          <div className="kpi-info">
            <span className="kpi-label">Avg Ticket Size</span>
            <span className="kpi-value">${averageOrderValue.toFixed(2)}</span>
            <span className="kpi-change positive">
              <TrendingUp size={12} />
              +4.8% item growth
            </span>
          </div>
          <div className="kpi-icon-wrapper danger">
            <DollarSign size={22} strokeWidth={2.5} />
          </div>
        </div>
      </section>

      {/* Custom Vector Charts */}
      <section className="charts-grid">
        {/* Chart A: Sales Trend Line Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Revenue Flow (Past 7 Days)</h2>
            <span className="badge badge-primary">USD Billed</span>
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
              {salesByDate.map((d, i) => (
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
                    {d.value > 0 ? `$${d.value.toFixed(0)}` : ''}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Chart B: Category Inventory Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Products Count by Category</h2>
            <span className="badge badge-warning">Current Inventory</span>
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
                      {c.value} Items
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      {/* Critical Alerts Row */}
      <section className="admin-card-table">
        <div className="table-toolbar" style={{ background: 'var(--clr-danger-light)', color: 'var(--clr-danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
            <AlertTriangle size={18} />
            Critical Stock Notifications ({lowStockProducts.length})
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Action Required: Reorder needed</span>
        </div>

        <div className="table-responsive-container">
          {lowStockProducts.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <div className="product-row-info">
                        <img src={prod.image} alt={prod.title} className="product-row-img" />
                        <span className="product-row-name">{prod.title}</span>
                      </div>
                    </td>
                    <td>{prod.category}</td>
                    <td style={{ fontWeight: 700 }}>{prod.stock} items remaining</td>
                    <td>
                      {prod.stock === 0 ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : (
                        <span className="badge badge-warning">Critically Low</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
              ✓ All products have healthy inventory levels (stock &ge; 5). No reorder alerts.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
