import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { insightsAPI, shopifyAPI } from '../api';
import { TrendingUp, Users, ShoppingCart, DollarSign, RefreshCw, Settings } from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [customerGrowth, setCustomerGrowth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, topCustomersRes, revenueTrendRes, productPerfRes, recentOrdersRes, customerGrowthRes] = await Promise.all([
        insightsAPI.getOverview(),
        insightsAPI.getTopCustomers({ limit: 5 }),
        insightsAPI.getRevenueTrend({ months: 6 }),
        insightsAPI.getProductPerformance({ limit: 5 }),
        insightsAPI.getRecentOrders({ limit: 10 }),
        insightsAPI.getCustomerGrowth({ months: 6 }),
      ]);

      setOverview(overviewRes.data);
      setTopCustomers(topCustomersRes.data.topCustomers);
      setRevenueTrend(revenueTrendRes.data.trend);
      setProductPerformance(productPerfRes.data.products);
      setRecentOrders(recentOrdersRes.data.orders);
      setCustomerGrowth(customerGrowthRes.data.growth);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('Syncing data from Shopify...');
    try {
      await shopifyAPI.syncAll();
      setSyncMessage('✅ Sync completed successfully!');
      setTimeout(() => {
        fetchData();
        setSyncMessage('');
      }, 2000);
    } catch (error) {
      setSyncMessage('❌ Sync failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">Xeno Shopify Insights</div>
          <div className="navbar-menu">
            <span style={{ color: '#666' }}>Welcome, {user?.name}</span>
            <button onClick={() => navigate('/settings')} className="btn btn-secondary">
              <Settings size={16} style={{ marginRight: '8px', display: 'inline' }} />
              Settings
            </button>
            <button onClick={handleSync} className="btn btn-primary" disabled={syncing}>
              <RefreshCw size={16} style={{ marginRight: '8px', display: 'inline' }} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </button>
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </div>
        </div>
      </nav>

      <div className="container">
        {syncMessage && (
          <div className="card" style={{ background: syncMessage.includes('✅') ? '#dcfce7' : '#fee2e2', marginBottom: '20px' }}>
            <p style={{ margin: 0, textAlign: 'center' }}>{syncMessage}</p>
          </div>
        )}

        <div className="grid">
          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <Users size={24} color="#4f46e5" />
              <span className="stat-label" style={{ marginLeft: '8px', marginBottom: 0 }}>Total Customers</span>
            </div>
            <div className="stat-value">{overview?.totalCustomers || 0}</div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <ShoppingCart size={24} color="#16a34a" />
              <span className="stat-label" style={{ marginLeft: '8px', marginBottom: 0 }}>Total Orders</span>
            </div>
            <div className="stat-value">{overview?.totalOrders || 0}</div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <DollarSign size={24} color="#dc2626" />
              <span className="stat-label" style={{ marginLeft: '8px', marginBottom: 0 }}>Total Revenue</span>
            </div>
            <div className="stat-value">${(overview?.totalRevenue || 0).toFixed(2)}</div>
          </div>

          <div className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <TrendingUp size={24} color="#f59e0b" />
              <span className="stat-label" style={{ marginLeft: '8px', marginBottom: 0 }}>Avg Order Value</span>
            </div>
            <div className="stat-value">${(overview?.averageOrderValue || 0).toFixed(2)}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Revenue Trend (6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Customer Growth (6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newCustomers" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Top 5 Customers by Spend</h3>
            {topCustomers.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Total Spent</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer, index) => (
                    <tr key={index}>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>${customer.totalSpent.toFixed(2)}</td>
                      <td>{customer.ordersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No customer data available</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Top 5 Products by Revenue</h3>
            {productPerformance.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Times Sold</th>
                    <th>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.map((product, index) => (
                    <tr key={index}>
                      <td>{product.title}</td>
                      <td>{product.timesSold}</td>
                      <td>${product.totalRevenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No product data available</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Recent Orders</h3>
          {recentOrders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, index) => (
                  <tr key={index}>
                    <td>#{order.orderNumber}</td>
                    <td>{order.customerName}<br/><small style={{ color: '#666' }}>{order.customerEmail}</small></td>
                    <td>${order.totalPrice.toFixed(2)}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        background: order.financialStatus === 'paid' ? '#dcfce7' : '#fef3c7',
                        color: order.financialStatus === 'paid' ? '#166534' : '#854d0e'
                      }}>
                        {order.financialStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No order data available. Click "Sync Data" to fetch from Shopify.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
