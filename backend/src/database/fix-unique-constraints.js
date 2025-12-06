const pool = require('../config/database');

async function fixUniqueConstraints() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    console.log('Fixing unique constraints for multi-tenant support...\n');

    // Fix customers table
    console.log('1. Updating customers table...');
    await connection.query(`
      ALTER TABLE customers 
      DROP INDEX shopify_customer_id
    `);
    await connection.query(`
      ALTER TABLE customers 
      ADD UNIQUE KEY unique_tenant_customer (tenant_id, shopify_customer_id)
    `);
    console.log('✅ Customers table updated');

    // Fix products table
    console.log('2. Updating products table...');
    await connection.query(`
      ALTER TABLE products 
      DROP INDEX shopify_product_id
    `);
    await connection.query(`
      ALTER TABLE products 
      ADD UNIQUE KEY unique_tenant_product (tenant_id, shopify_product_id)
    `);
    console.log('✅ Products table updated');

    // Fix orders table
    console.log('3. Updating orders table...');
    await connection.query(`
      ALTER TABLE orders 
      DROP INDEX shopify_order_id
    `);
    await connection.query(`
      ALTER TABLE orders 
      ADD UNIQUE KEY unique_tenant_order (tenant_id, shopify_order_id)
    `);
    console.log('✅ Orders table updated');

    await connection.commit();
    console.log('\n✅ All unique constraints fixed successfully!');
    console.log('Multi-tenant data isolation is now properly enforced.');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error fixing constraints:', error.message);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

// Run the fix
fixUniqueConstraints().catch(error => {
  console.error('Failed to fix constraints:', error);
  process.exit(1);
});
