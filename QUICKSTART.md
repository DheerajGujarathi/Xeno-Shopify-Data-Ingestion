# Quick Start Guide

This guide will get you up and running in **under 10 minutes**.

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v16+ installed (`node --version`)
- ✅ MySQL v8+ running (`mysql --version`)
- ✅ npm or yarn installed (`npm --version`)

## Step 1: Database Setup (2 minutes)

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE xeno_shopify_insights;

# Verify
SHOW DATABASES;

# Exit
exit
```

## Step 2: Backend Setup (3 minutes)

```bash
# Navigate to backend directory
cd "d:\Xeno Assignment\backend"

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Edit .env with your MySQL password
# (Open .env in notepad and update DB_PASSWORD)

# Run database migrations
npm run db:migrate

# Start backend server
npm run dev
```

**Expected Output**:
```
✅ All tables created successfully
✅ MySQL Database connected successfully
🚀 Server running on port 5000
📍 Environment: development
✅ Scheduler started - syncing every 15 minutes and hourly
```

## Step 3: Frontend Setup (3 minutes)

Open a **new terminal window**:

```bash
# Navigate to frontend
cd "d:\Xeno Assignment\frontend"

# Install dependencies
npm install

# Start frontend
npm start
```

**Expected Output**:
```
Compiled successfully!
You can now view xeno-shopify-frontend in the browser.
  Local:            http://localhost:3000
```

## Step 4: Test the Application (2 minutes)

1. **Open browser** to `http://localhost:3000`

2. **Register a new account**:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Shopify Domain: (leave blank for now)

3. **You're in!** You should see the dashboard.

## Step 5: Connect to Shopify (Optional)

If you have a Shopify development store:

1. Get your Shopify credentials:
   - Shop domain: `your-store.myshopify.com`
   - Access token: From Shopify Admin → Apps → Develop apps

2. Update in database:
   ```sql
   mysql -u root -p xeno_shopify_insights

   UPDATE tenants 
   SET shopify_shop_domain = 'your-store.myshopify.com',
       shopify_access_token = 'your_access_token'
   WHERE email = 'test@example.com';
   ```

3. In the dashboard, click **"Sync Data"** button

4. Wait 10-30 seconds and refresh the page to see your data!

## Troubleshooting

### Backend won't start
- ❌ **Error**: `Database connection failed`
  - ✅ **Fix**: Check MySQL is running and .env has correct credentials

- ❌ **Error**: `Port 5000 already in use`
  - ✅ **Fix**: Change PORT in .env to 5001

### Frontend won't start
- ❌ **Error**: `Port 3000 already in use`
  - ✅ **Fix**: Kill the process or run `set PORT=3001 && npm start`

### Data not syncing
- ❌ **Error**: `Shopify credentials not configured`
  - ✅ **Fix**: Update tenants table with your Shopify credentials

## Next Steps

✅ **Working locally?** Great! Now:
1. Add dummy data to your Shopify store (products, customers, orders)
2. Trigger sync and explore the dashboard
3. Check out the [full README](./README.md) for API documentation
4. Review [DOCUMENTATION.md](./DOCUMENTATION.md) for technical details

## Quick Commands Reference

```bash
# Backend
npm run dev          # Start development server
npm run db:migrate   # Run database migrations
npm start            # Start production server

# Frontend
npm start            # Start development server
npm run build        # Build for production

# Database
npm run db:migrate   # Create tables
```

---

**Still stuck?** Check the detailed [README.md](./README.md) or open an issue.

Happy coding! 🚀
