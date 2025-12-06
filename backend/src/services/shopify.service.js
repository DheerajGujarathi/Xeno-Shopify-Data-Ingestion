const axios = require('axios');
const pool = require('../config/database');

class ShopifyService {
  constructor(shopDomain, accessToken) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.baseUrl = `https://${shopDomain}/admin/api/2024-01`;
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Shopify API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCustomers(limit = 250) {
    return this.makeRequest(`/customers.json?limit=${limit}`);
  }

  async getOrders(limit = 250, status = 'any') {
    return this.makeRequest(`/orders.json?limit=${limit}&status=${status}`);
  }

  async getProducts(limit = 250) {
    return this.makeRequest(`/products.json?limit=${limit}`);
  }

  async getOrder(orderId) {
    return this.makeRequest(`/orders/${orderId}.json`);
  }
}

class DataIngestionService {
  constructor(tenantId, shopDomain, accessToken) {
    this.tenantId = tenantId;
    this.shopify = new ShopifyService(shopDomain, accessToken);
  }

  async syncCustomers() {
    const startTime = Date.now();
    let syncedCount = 0;

    try {
      await this.logSyncStart('customers');

      const data = await this.shopify.getCustomers();
      const customers = data.customers || [];

      for (const customer of customers) {
        await this.upsertCustomer(customer);
        syncedCount++;
      }

      await this.logSyncComplete('customers', syncedCount);
      console.log(`✅ Synced ${syncedCount} customers in ${Date.now() - startTime}ms`);
      
      return { success: true, count: syncedCount };
    } catch (error) {
      await this.logSyncError('customers', error.message);
      throw error;
    }
  }

  async syncProducts() {
    const startTime = Date.now();
    let syncedCount = 0;

    try {
      await this.logSyncStart('products');

      const data = await this.shopify.getProducts();
      const products = data.products || [];

      for (const product of products) {
        await this.upsertProduct(product);
        syncedCount++;
      }

      await this.logSyncComplete('products', syncedCount);
      console.log(`✅ Synced ${syncedCount} products in ${Date.now() - startTime}ms`);
      
      return { success: true, count: syncedCount };
    } catch (error) {
      await this.logSyncError('products', error.message);
      throw error;
    }
  }

  async syncOrders() {
    const startTime = Date.now();
    let syncedCount = 0;

    try {
      await this.logSyncStart('orders');

      const data = await this.shopify.getOrders();
      const orders = data.orders || [];

      for (const order of orders) {
        await this.upsertOrder(order);
        syncedCount++;
      }

      await this.logSyncComplete('orders', syncedCount);
      console.log(`✅ Synced ${syncedCount} orders in ${Date.now() - startTime}ms`);
      
      return { success: true, count: syncedCount };
    } catch (error) {
      await this.logSyncError('orders', error.message);
      throw error;
    }
  }

  async upsertCustomer(customerData) {
    const connection = await pool.getConnection();
    try {
      const [existing] = await connection.query(
        'SELECT id FROM customers WHERE tenant_id = ? AND shopify_customer_id = ?',
        [this.tenantId, customerData.id]
      );

      if (existing.length > 0) {
        await connection.query(
          `UPDATE customers SET 
            email = ?, first_name = ?, last_name = ?, phone = ?,
            total_spent = ?, orders_count = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            customerData.email,
            customerData.first_name,
            customerData.last_name,
            customerData.phone,
            customerData.total_spent || 0,
            customerData.orders_count || 0,
            existing[0].id
          ]
        );
        return existing[0].id;
      } else {
        const [result] = await connection.query(
          `INSERT INTO customers 
            (tenant_id, shopify_customer_id, email, first_name, last_name, phone, total_spent, orders_count)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            this.tenantId,
            customerData.id,
            customerData.email,
            customerData.first_name,
            customerData.last_name,
            customerData.phone,
            customerData.total_spent || 0,
            customerData.orders_count || 0
          ]
        );
        return result.insertId;
      }
    } finally {
      connection.release();
    }
  }

  async upsertProduct(productData) {
    const connection = await pool.getConnection();
    try {
      const variant = productData.variants?.[0];
      const price = variant?.price || 0;

      const [existing] = await connection.query(
        'SELECT id FROM products WHERE tenant_id = ? AND shopify_product_id = ?',
        [this.tenantId, productData.id]
      );

      if (existing.length > 0) {
        await connection.query(
          `UPDATE products SET 
            title = ?, description = ?, vendor = ?, product_type = ?, price = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            productData.title,
            productData.body_html,
            productData.vendor,
            productData.product_type,
            price,
            existing[0].id
          ]
        );
        return existing[0].id;
      } else {
        const [result] = await connection.query(
          `INSERT INTO products 
            (tenant_id, shopify_product_id, title, description, vendor, product_type, price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            this.tenantId,
            productData.id,
            productData.title,
            productData.body_html,
            productData.vendor,
            productData.product_type,
            price
          ]
        );
        return result.insertId;
      }
    } finally {
      connection.release();
    }
  }

  async upsertOrder(orderData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get or create customer
      let customerId = null;
      if (orderData.customer) {
        customerId = await this.upsertCustomer(orderData.customer);
      }

      // Upsert order
      const [existingOrder] = await connection.query(
        'SELECT id FROM orders WHERE tenant_id = ? AND shopify_order_id = ?',
        [this.tenantId, orderData.id]
      );

      let orderId;
      if (existingOrder.length > 0) {
        await connection.query(
          `UPDATE orders SET 
            customer_id = ?, order_number = ?, total_price = ?, subtotal_price = ?,
            total_tax = ?, financial_status = ?, fulfillment_status = ?, currency = ?,
            order_date = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            customerId,
            orderData.order_number,
            orderData.total_price,
            orderData.subtotal_price,
            orderData.total_tax,
            orderData.financial_status,
            orderData.fulfillment_status,
            orderData.currency,
            orderData.created_at,
            existingOrder[0].id
          ]
        );
        orderId = existingOrder[0].id;
      } else {
        const [result] = await connection.query(
          `INSERT INTO orders 
            (tenant_id, shopify_order_id, customer_id, order_number, total_price, subtotal_price,
             total_tax, financial_status, fulfillment_status, currency, order_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            this.tenantId,
            orderData.id,
            customerId,
            orderData.order_number,
            orderData.total_price,
            orderData.subtotal_price,
            orderData.total_tax,
            orderData.financial_status,
            orderData.fulfillment_status,
            orderData.currency,
            orderData.created_at
          ]
        );
        orderId = result.insertId;
      }

      // Delete existing order items
      await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);

      // Insert order items
      if (orderData.line_items && orderData.line_items.length > 0) {
        for (const item of orderData.line_items) {
          // Try to find matching product
          let productId = null;
          if (item.product_id) {
            const [products] = await connection.query(
              'SELECT id FROM products WHERE tenant_id = ? AND shopify_product_id = ?',
              [this.tenantId, item.product_id]
            );
            if (products.length > 0) {
              productId = products[0].id;
            }
          }

          await connection.query(
            `INSERT INTO order_items 
              (order_id, product_id, shopify_line_item_id, title, quantity, price, total_discount)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              productId,
              item.id,
              item.title,
              item.quantity,
              item.price,
              item.total_discount
            ]
          );
        }
      }

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async logSyncStart(syncType) {
    await pool.query(
      'INSERT INTO sync_logs (tenant_id, sync_type, status) VALUES (?, ?, ?)',
      [this.tenantId, syncType, 'running']
    );
  }

  async logSyncComplete(syncType, recordsSynced) {
    await pool.query(
      `UPDATE sync_logs SET status = ?, records_synced = ?, completed_at = CURRENT_TIMESTAMP 
       WHERE tenant_id = ? AND sync_type = ? AND status = 'running'
       ORDER BY started_at DESC LIMIT 1`,
      ['completed', recordsSynced, this.tenantId, syncType]
    );
  }

  async logSyncError(syncType, errorMessage) {
    await pool.query(
      `UPDATE sync_logs SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP 
       WHERE tenant_id = ? AND sync_type = ? AND status = 'running'
       ORDER BY started_at DESC LIMIT 1`,
      ['failed', errorMessage, this.tenantId, syncType]
    );
  }
}

module.exports = { ShopifyService, DataIngestionService };
