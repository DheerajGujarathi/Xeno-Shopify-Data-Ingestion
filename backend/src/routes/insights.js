const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');

const router = express.Router();

// Get dashboard overview metrics
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.id;

    // Total customers
    const [customersCount] = await pool.query(
      'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?',
      [tenantId]
    );

    // Total orders
    const [ordersCount] = await pool.query(
      'SELECT COUNT(*) as total FROM orders WHERE tenant_id = ?',
      [tenantId]
    );

    // Total revenue
    const [revenueData] = await pool.query(
      'SELECT SUM(total_price) as total FROM orders WHERE tenant_id = ?',
      [tenantId]
    );

    // Average order value
    const [avgOrderValue] = await pool.query(
      'SELECT AVG(total_price) as average FROM orders WHERE tenant_id = ?',
      [tenantId]
    );

    res.json({
      totalCustomers: customersCount[0].total,
      totalOrders: ordersCount[0].total,
      totalRevenue: parseFloat(revenueData[0].total || 0),
      averageOrderValue: parseFloat(avgOrderValue[0].average || 0)
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// Get orders by date with filtering
router.get('/orders-by-date', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT DATE(order_date) as date, COUNT(*) as count, SUM(total_price) as revenue
      FROM orders
      WHERE tenant_id = ?
    `;
    const params = [tenantId];

    if (startDate) {
      query += ' AND order_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND order_date <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY DATE(order_date) ORDER BY date DESC';

    const [orders] = await pool.query(query, params);

    res.json({
      orders: orders.map(o => ({
        date: o.date,
        count: o.count,
        revenue: parseFloat(o.revenue || 0)
      }))
    });
  } catch (error) {
    console.error('Orders by date error:', error);
    res.status(500).json({ error: 'Failed to fetch orders by date' });
  }
});

// Get top 5 customers by spend
router.get('/top-customers', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const [customers] = await pool.query(
      `SELECT 
        c.id, c.email, c.first_name, c.last_name, c.total_spent, c.orders_count
       FROM customers c
       WHERE c.tenant_id = ?
       ORDER BY c.total_spent DESC
       LIMIT ?`,
      [tenantId, limit]
    );

    res.json({
      topCustomers: customers.map(c => ({
        id: c.id,
        email: c.email,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'N/A',
        totalSpent: parseFloat(c.total_spent || 0),
        ordersCount: c.orders_count
      }))
    });
  } catch (error) {
    console.error('Top customers error:', error);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
});

// Get revenue trend (monthly)
router.get('/revenue-trend', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.id;
    const months = parseInt(req.query.months) || 6;

    const [trend] = await pool.query(
      `SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(total_price) as revenue,
        COUNT(*) as orders
       FROM orders
       WHERE tenant_id = ? AND order_date >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(order_date, '%Y-%m')
       ORDER BY month ASC`,
      [tenantId, months]
    );

    res.json({
      trend: trend.map(t => ({
        month: t.month,
        revenue: parseFloat(t.revenue || 0),
        orders: t.orders
      }))
    });
  } catch (error) {
    console.error('Revenue trend error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue trend' });
  }
});

// Get product performance
router.get('/product-performance', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const [products] = await pool.query(
      `SELECT 
        p.id, p.title, p.price,
        COUNT(oi.id) as times_sold,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.quantity * oi.price) as total_revenue
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       WHERE p.tenant_id = ?
       GROUP BY p.id, p.title, p.price
       ORDER BY total_revenue DESC
       LIMIT ?`,
      [tenantId, limit]
    );

    res.json({
      products: products.map(p => ({
        id: p.id,
        title: p.title,
        price: parseFloat(p.price || 0),
        timesSold: p.times_sold,
        totalQuantity: p.total_quantity || 0,
        totalRevenue: parseFloat(p.total_revenue || 0)
      }))
    });
  } catch (error) {
    console.error('Product performance error:', error);
    res.status(500).json({ error: 'Failed to fetch product performance' });
  }
});

// Get recent orders
router.get('/recent-orders', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const [orders] = await pool.query(
      `SELECT 
        o.id, o.order_number, o.total_price, o.order_date, o.financial_status,
        c.email, c.first_name, c.last_name
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.tenant_id = ?
       ORDER BY o.order_date DESC
       LIMIT ?`,
      [tenantId, limit]
    );

    res.json({
      orders: orders.map(o => ({
        id: o.id,
        orderNumber: o.order_number,
        totalPrice: parseFloat(o.total_price || 0),
        orderDate: o.order_date,
        financialStatus: o.financial_status,
        customerEmail: o.email,
        customerName: `${o.first_name || ''} ${o.last_name || ''}`.trim() || 'N/A'
      }))
    });
  } catch (error) {
    console.error('Recent orders error:', error);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

// Get customer growth trend
router.get('/customer-growth', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.id;
    const months = parseInt(req.query.months) || 6;

    const [growth] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_customers
       FROM customers
       WHERE tenant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`,
      [tenantId, months]
    );

    res.json({
      growth: growth.map(g => ({
        month: g.month,
        newCustomers: g.new_customers
      }))
    });
  } catch (error) {
    console.error('Customer growth error:', error);
    res.status(500).json({ error: 'Failed to fetch customer growth' });
  }
});

module.exports = router;
