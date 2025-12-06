# API Testing Collection

Quick reference for testing the API using curl or Postman.

## Base URL
```
http://localhost:5000/api
```

## 1. Authentication

### Register New Tenant
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Store Owner",
    "email": "owner@teststore.com",
    "password": "password123",
    "shopifyShopDomain": "test-store.myshopify.com"
  }'
```

**Expected Response:**
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Test Store Owner",
    "email": "owner@teststore.com",
    "shopifyShopDomain": "test-store.myshopify.com"
  }
}
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@teststore.com",
    "password": "password123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 2. Shopify Integration

### Update Shopify Credentials
```bash
curl -X POST http://localhost:5000/api/shopify/config \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "shopifyShopDomain": "your-store.myshopify.com",
    "shopifyAccessToken": "shpat_xxxxxxxxxxxxx"
  }'
```

### Trigger Full Sync
```bash
curl -X POST http://localhost:5000/api/shopify/sync/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Sync Customers Only
```bash
curl -X POST http://localhost:5000/api/shopify/sync/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Sync Products Only
```bash
curl -X POST http://localhost:5000/api/shopify/sync/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Sync Orders Only
```bash
curl -X POST http://localhost:5000/api/shopify/sync/orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Sync Logs
```bash
curl -X GET http://localhost:5000/api/shopify/sync/logs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 3. Insights & Analytics

### Get Overview Metrics
```bash
curl -X GET http://localhost:5000/api/insights/overview \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "totalCustomers": 150,
  "totalOrders": 320,
  "totalRevenue": 45678.50,
  "averageOrderValue": 142.74
}
```

### Get Orders by Date
```bash
# Without filters
curl -X GET http://localhost:5000/api/insights/orders-by-date \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# With date range
curl -X GET "http://localhost:5000/api/insights/orders-by-date?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Top Customers
```bash
# Top 5 (default)
curl -X GET http://localhost:5000/api/insights/top-customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Top 10
curl -X GET "http://localhost:5000/api/insights/top-customers?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Revenue Trend
```bash
# Last 6 months (default)
curl -X GET http://localhost:5000/api/insights/revenue-trend \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Last 12 months
curl -X GET "http://localhost:5000/api/insights/revenue-trend?months=12" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Product Performance
```bash
# Top 10 (default)
curl -X GET http://localhost:5000/api/insights/product-performance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Top 20
curl -X GET "http://localhost:5000/api/insights/product-performance?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Recent Orders
```bash
# Last 10 (default)
curl -X GET http://localhost:5000/api/insights/recent-orders \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Last 20
curl -X GET "http://localhost:5000/api/insights/recent-orders?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Customer Growth
```bash
# Last 6 months (default)
curl -X GET http://localhost:5000/api/insights/customer-growth \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Last 12 months
curl -X GET "http://localhost:5000/api/insights/customer-growth?months=12" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 4. Health Check

### Check Server Status
```bash
curl -X GET http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T10:30:00.000Z"
}
```

## Testing Flow

### Complete End-to-End Test

1. **Register a new user:**
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.token')

echo "Token: $TOKEN"
```

2. **Update Shopify credentials:**
```bash
curl -X POST http://localhost:5000/api/shopify/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopifyShopDomain": "your-store.myshopify.com",
    "shopifyAccessToken": "shpat_xxxxxxxxxxxxx"
  }'
```

3. **Trigger sync:**
```bash
curl -X POST http://localhost:5000/api/shopify/sync/all \
  -H "Authorization: Bearer $TOKEN"
```

4. **Check dashboard data:**
```bash
curl -X GET http://localhost:5000/api/insights/overview \
  -H "Authorization: Bearer $TOKEN"
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 400 Bad Request
```json
{
  "error": "Shopify credentials not configured"
}
```

### 500 Internal Server Error
```json
{
  "error": "Sync failed",
  "details": "Connection timeout"
}
```

## Postman Collection

Import these endpoints into Postman:

1. Create a new collection "Xeno Shopify Insights"
2. Set collection variable `baseUrl` = `http://localhost:5000/api`
3. Set collection variable `token` = `YOUR_TOKEN_HERE`
4. Add header `Authorization: Bearer {{token}}` to collection

---

**Pro Tip**: Use environment variables in Postman to switch between development and production easily!
