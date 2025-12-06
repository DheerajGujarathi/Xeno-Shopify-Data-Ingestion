const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../config/database');
const { DataIngestionService } = require('../services/shopify.service');

const router = express.Router();

// Configure Shopify credentials for tenant
router.post('/config', authMiddleware, async (req, res) => {
  try {
    const { shopifyShopDomain, shopifyAccessToken } = req.body;

    if (!shopifyShopDomain || !shopifyAccessToken) {
      return res.status(400).json({ error: 'Shop domain and access token are required' });
    }

    await pool.query(
      'UPDATE tenants SET shopify_shop_domain = ?, shopify_access_token = ? WHERE id = ?',
      [shopifyShopDomain, shopifyAccessToken, req.user.id]
    );

    res.json({ message: 'Shopify configuration updated successfully' });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Delete Shopify credentials for tenant
router.delete('/config', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'UPDATE tenants SET shopify_shop_domain = NULL, shopify_access_token = NULL WHERE id = ?',
      [req.user.id]
    );

    res.json({ message: 'Shopify configuration deleted successfully' });
  } catch (error) {
    console.error('Config delete error:', error);
    res.status(500).json({ error: 'Failed to delete configuration' });
  }
});

// Trigger manual sync for all data
router.post('/sync/all', authMiddleware, async (req, res) => {
  try {
    const [tenants] = await pool.query(
      'SELECT shopify_shop_domain, shopify_access_token FROM tenants WHERE id = ?',
      [req.user.id]
    );

    if (tenants.length === 0 || !tenants[0].shopify_shop_domain || !tenants[0].shopify_access_token) {
      return res.status(400).json({ error: 'Shopify credentials not configured' });
    }

    const { shopify_shop_domain, shopify_access_token } = tenants[0];
    const ingestionService = new DataIngestionService(
      req.user.id,
      shopify_shop_domain,
      shopify_access_token
    );

    // Sync in sequence
    const results = {
      customers: await ingestionService.syncCustomers(),
      products: await ingestionService.syncProducts(),
      orders: await ingestionService.syncOrders()
    };

    res.json({
      message: 'Sync completed successfully',
      results
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

// Trigger sync for customers only
router.post('/sync/customers', authMiddleware, async (req, res) => {
  try {
    const [tenants] = await pool.query(
      'SELECT shopify_shop_domain, shopify_access_token FROM tenants WHERE id = ?',
      [req.user.id]
    );

    if (tenants.length === 0 || !tenants[0].shopify_shop_domain || !tenants[0].shopify_access_token) {
      return res.status(400).json({ error: 'Shopify credentials not configured' });
    }

    const { shopify_shop_domain, shopify_access_token } = tenants[0];
    const ingestionService = new DataIngestionService(
      req.user.id,
      shopify_shop_domain,
      shopify_access_token
    );

    const result = await ingestionService.syncCustomers();
    res.json({ message: 'Customers synced successfully', result });
  } catch (error) {
    console.error('Sync customers error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

// Trigger sync for products only
router.post('/sync/products', authMiddleware, async (req, res) => {
  try {
    const [tenants] = await pool.query(
      'SELECT shopify_shop_domain, shopify_access_token FROM tenants WHERE id = ?',
      [req.user.id]
    );

    if (tenants.length === 0 || !tenants[0].shopify_shop_domain || !tenants[0].shopify_access_token) {
      return res.status(400).json({ error: 'Shopify credentials not configured' });
    }

    const { shopify_shop_domain, shopify_access_token } = tenants[0];
    const ingestionService = new DataIngestionService(
      req.user.id,
      shopify_shop_domain,
      shopify_access_token
    );

    const result = await ingestionService.syncProducts();
    res.json({ message: 'Products synced successfully', result });
  } catch (error) {
    console.error('Sync products error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

// Trigger sync for orders only
router.post('/sync/orders', authMiddleware, async (req, res) => {
  try {
    const [tenants] = await pool.query(
      'SELECT shopify_shop_domain, shopify_access_token FROM tenants WHERE id = ?',
      [req.user.id]
    );

    if (tenants.length === 0 || !tenants[0].shopify_shop_domain || !tenants[0].shopify_access_token) {
      return res.status(400).json({ error: 'Shopify credentials not configured' });
    }

    const { shopify_shop_domain, shopify_access_token } = tenants[0];
    const ingestionService = new DataIngestionService(
      req.user.id,
      shopify_shop_domain,
      shopify_access_token
    );

    const result = await ingestionService.syncOrders();
    res.json({ message: 'Orders synced successfully', result });
  } catch (error) {
    console.error('Sync orders error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

// Webhook endpoint for Shopify (customers/create, customers/update)
router.post('/webhooks/customers', async (req, res) => {
  try {
    // Verify webhook (in production, verify HMAC signature)
    const customerData = req.body;
    
    // Find tenant by shop domain
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const [tenants] = await pool.query(
      'SELECT id FROM tenants WHERE shopify_shop_domain = ?',
      [shopDomain]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantId = tenants[0].id;
    // You'd need access token here, or handle differently
    // For now, just acknowledge receipt
    
    res.status(200).json({ message: 'Webhook received' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get sync logs
router.get('/sync/logs', authMiddleware, async (req, res) => {
  try {
    const [logs] = await pool.query(
      `SELECT sync_type, status, records_synced, error_message, started_at, completed_at
       FROM sync_logs
       WHERE tenant_id = ?
       ORDER BY started_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
