const pool = require('../config/database');

async function createTables() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Tenants table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        shopify_shop_domain VARCHAR(255) UNIQUE,
        shopify_access_token TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_shop_domain (shopify_shop_domain)
      )
    `);

    // Customers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT NOT NULL,
        shopify_customer_id BIGINT UNIQUE NOT NULL,
        email VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        phone VARCHAR(50),
        total_spent DECIMAL(10, 2) DEFAULT 0.00,
        orders_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        INDEX idx_tenant_customer (tenant_id, shopify_customer_id),
        INDEX idx_email (email),
        INDEX idx_total_spent (total_spent DESC)
      )
    `);

    // Products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT NOT NULL,
        shopify_product_id BIGINT UNIQUE NOT NULL,
        title VARCHAR(500),
        description TEXT,
        vendor VARCHAR(255),
        product_type VARCHAR(255),
        price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        INDEX idx_tenant_product (tenant_id, shopify_product_id)
      )
    `);

    // Orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT NOT NULL,
        shopify_order_id BIGINT UNIQUE NOT NULL,
        customer_id INT,
        order_number VARCHAR(100),
        total_price DECIMAL(10, 2),
        subtotal_price DECIMAL(10, 2),
        total_tax DECIMAL(10, 2),
        financial_status VARCHAR(50),
        fulfillment_status VARCHAR(50),
        currency VARCHAR(10),
        order_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        INDEX idx_tenant_order (tenant_id, shopify_order_id),
        INDEX idx_order_date (order_date),
        INDEX idx_customer (customer_id)
      )
    `);

    // Order items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_id INT NOT NULL,
        product_id INT,
        shopify_line_item_id BIGINT,
        title VARCHAR(500),
        quantity INT,
        price DECIMAL(10, 2),
        total_discount DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        INDEX idx_order (order_id)
      )
    `);

    // Events table (for cart abandoned, checkout started, etc.)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT NOT NULL,
        customer_id INT,
        event_type VARCHAR(100) NOT NULL,
        event_data JSON,
        event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        INDEX idx_tenant_event (tenant_id, event_type),
        INDEX idx_event_timestamp (event_timestamp)
      )
    `);

    // Sync logs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tenant_id INT NOT NULL,
        sync_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        records_synced INT DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        INDEX idx_tenant_sync (tenant_id, sync_type, started_at)
      )
    `);

    await connection.commit();
    console.log('✅ All tables created successfully');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migrations
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('✅ Database migration completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { createTables };
