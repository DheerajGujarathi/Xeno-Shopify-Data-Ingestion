const cron = require('node-cron');
const pool = require('../config/database');
const { DataIngestionService } = require('./shopify.service');

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  // Start all scheduled jobs
  start() {
    // Sync all tenants every hour
    const hourlySync = cron.schedule('0 * * * *', async () => {
      console.log('🕐 Running hourly sync for all tenants...');
      await this.syncAllTenants();
    });

    // Sync all tenants every 15 minutes (more frequent for demo purposes)
    const frequentSync = cron.schedule('*/15 * * * *', async () => {
      console.log('🕐 Running 15-minute sync for all tenants...');
      await this.syncAllTenants();
    });

    this.jobs.push(hourlySync, frequentSync);
    console.log('✅ Scheduler started - syncing every 15 minutes and hourly');
  }

  // Stop all scheduled jobs
  stop() {
    this.jobs.forEach(job => job.stop());
    console.log('⏹ Scheduler stopped');
  }

  // Sync data for all active tenants
  async syncAllTenants() {
    try {
      const [tenants] = await pool.query(
        `SELECT id, shopify_shop_domain, shopify_access_token 
         FROM tenants 
         WHERE is_active = true 
         AND shopify_shop_domain IS NOT NULL 
         AND shopify_access_token IS NOT NULL`
      );

      if (tenants.length === 0) {
        console.log('No active tenants with Shopify configuration found');
        return;
      }

      console.log(`Syncing ${tenants.length} tenant(s)...`);

      for (const tenant of tenants) {
        try {
          await this.syncTenant(tenant);
        } catch (error) {
          console.error(`Error syncing tenant ${tenant.id}:`, error.message);
        }
      }

      console.log('✅ All tenants synced');
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  }

  // Sync data for a single tenant
  async syncTenant(tenant) {
    const ingestionService = new DataIngestionService(
      tenant.id,
      tenant.shopify_shop_domain,
      tenant.shopify_access_token
    );

    try {
      console.log(`Syncing tenant ${tenant.id} (${tenant.shopify_shop_domain})...`);
      
      // Sync customers, products, and orders in sequence
      await ingestionService.syncCustomers();
      await ingestionService.syncProducts();
      await ingestionService.syncOrders();

      console.log(`✅ Tenant ${tenant.id} synced successfully`);
    } catch (error) {
      console.error(`❌ Failed to sync tenant ${tenant.id}:`, error.message);
      throw error;
    }
  }
}

module.exports = new SchedulerService();
