# Xeno Shopify Insights - Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Models](#data-models)
3. [API Documentation](#api-documentation)
4. [Assumptions & Design Decisions](#assumptions-design-decisions)

---

## 1. System Architecture

### Multi-Tenant Architecture

The application is built with a **shared database, shared schema** multi-tenancy model:

- **Tenant Isolation**: Every data table includes a `tenant_id` foreign key
- **Authentication**: JWT tokens include tenant ID in payload
- **Authorization**: Middleware validates tenant access on every request
- **Data Scoping**: All queries automatically filter by `tenant_id`

### Component Architecture

```
┌─────────────────────────────────────────────────┐
│              Presentation Layer                  │
│  - React Components (Login, Register, Dashboard)│
│  - Recharts for data visualization              │
│  - Axios for API communication                   │
└────────────────┬────────────────────────────────┘
                 │ REST API (HTTP/JSON)
┌────────────────▼────────────────────────────────┐
│              Application Layer                   │
│  - Express.js routing                           │
│  - JWT authentication middleware                │
│  - Request validation (express-validator)       │
│  - Error handling middleware                    │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│              Business Logic Layer                │
│  - ShopifyService: API integration              │
│  - DataIngestionService: Data transformation    │
│  - SchedulerService: Automated sync             │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│              Data Access Layer                   │
│  - MySQL connection pool (mysql2)               │
│  - Parameterized queries for security           │
│  - Transaction management                       │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│              Database (MySQL)                    │
│  - Multi-tenant tables with tenant_id           │
│  - Indexes on frequently queried columns        │
│  - Foreign key constraints for integrity        │
└─────────────────────────────────────────────────┘
```

### Sync Architecture

**Scheduled Sync (Polling)**:
```
┌──────────────┐     Every 15min     ┌─────────────────┐
│ node-cron    │────────────────────→│ SchedulerService│
│   Scheduler  │                      └────────┬────────┘
└──────────────┘                               │
                                               │ For each active tenant
                                               ↓
                           ┌────────────────────────────────┐
                           │   DataIngestionService         │
                           │  1. Fetch customers from API   │
                           │  2. Fetch products from API    │
                           │  3. Fetch orders from API      │
                           │  4. Transform & upsert to DB   │
                           └────────────────────────────────┘
```

**Webhook Sync (Real-time)**:
```
┌──────────────┐     HTTP POST       ┌─────────────────┐
│  Shopify     │────────────────────→│ Webhook Handler │
│   Webhook    │  (customer/create)   └────────┬────────┘
└──────────────┘                               │
                                               │ Verify HMAC
                                               ↓
                           ┌────────────────────────────────┐
                           │   Process Event                │
                           │  1. Identify tenant by shop    │
                           │  2. Validate & transform data  │
                           │  3. Upsert to database         │
                           └────────────────────────────────┘
```

---

## 2. Data Models

### Tenants Table
Stores multi-tenant account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique tenant identifier |
| name | VARCHAR(255) | NOT NULL | Tenant/business name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| shopify_shop_domain | VARCHAR(255) | UNIQUE | Shopify store domain |
| shopify_access_token | TEXT | | Shopify Admin API token |
| is_active | BOOLEAN | DEFAULT true | Account status flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Last update time |

**Indexes**:
- `idx_email` on `email`
- `idx_shop_domain` on `shopify_shop_domain`

### Customers Table
Stores customer information synced from Shopify.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Internal customer ID |
| tenant_id | INT | FOREIGN KEY → tenants(id) | Tenant ownership |
| shopify_customer_id | BIGINT | UNIQUE, NOT NULL | Shopify customer ID |
| email | VARCHAR(255) | | Customer email |
| first_name | VARCHAR(255) | | First name |
| last_name | VARCHAR(255) | | Last name |
| phone | VARCHAR(50) | | Phone number |
| total_spent | DECIMAL(10,2) | DEFAULT 0.00 | Lifetime spend (denormalized) |
| orders_count | INT | DEFAULT 0 | Total orders (denormalized) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Record update |

**Indexes**:
- `idx_tenant_customer` on `(tenant_id, shopify_customer_id)`
- `idx_email` on `email`
- `idx_total_spent` on `total_spent DESC`

### Orders Table
Stores order transactions from Shopify.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Internal order ID |
| tenant_id | INT | FOREIGN KEY → tenants(id) | Tenant ownership |
| shopify_order_id | BIGINT | UNIQUE, NOT NULL | Shopify order ID |
| customer_id | INT | FOREIGN KEY → customers(id) | Associated customer |
| order_number | VARCHAR(100) | | Display order number |
| total_price | DECIMAL(10,2) | | Total order value |
| subtotal_price | DECIMAL(10,2) | | Subtotal before tax |
| total_tax | DECIMAL(10,2) | | Tax amount |
| financial_status | VARCHAR(50) | | paid, pending, refunded, etc. |
| fulfillment_status | VARCHAR(50) | | fulfilled, partial, null |
| currency | VARCHAR(10) | | Currency code (USD, EUR) |
| order_date | TIMESTAMP | | Original order date from Shopify |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Record update |

**Indexes**:
- `idx_tenant_order` on `(tenant_id, shopify_order_id)`
- `idx_order_date` on `order_date`
- `idx_customer` on `customer_id`

### Products Table
Stores product catalog from Shopify.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Internal product ID |
| tenant_id | INT | FOREIGN KEY → tenants(id) | Tenant ownership |
| shopify_product_id | BIGINT | UNIQUE, NOT NULL | Shopify product ID |
| title | VARCHAR(500) | | Product name |
| description | TEXT | | Product description (HTML) |
| vendor | VARCHAR(255) | | Product vendor/brand |
| product_type | VARCHAR(255) | | Product category |
| price | DECIMAL(10,2) | | Base price (first variant) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | Record update |

**Indexes**:
- `idx_tenant_product` on `(tenant_id, shopify_product_id)`

### Order Items Table
Stores line items for each order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Line item ID |
| order_id | INT | FOREIGN KEY → orders(id) | Parent order |
| product_id | INT | FOREIGN KEY → products(id) | Associated product |
| shopify_line_item_id | BIGINT | | Shopify line item ID |
| title | VARCHAR(500) | | Item name |
| quantity | INT | | Quantity ordered |
| price | DECIMAL(10,2) | | Unit price |
| total_discount | DECIMAL(10,2) | | Discount applied |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |

**Indexes**:
- `idx_order` on `order_id`

### Events Table
Stores custom events (cart abandoned, checkout started, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Event ID |
| tenant_id | INT | FOREIGN KEY → tenants(id) | Tenant ownership |
| customer_id | INT | FOREIGN KEY → customers(id) | Associated customer |
| event_type | VARCHAR(100) | NOT NULL | Event type identifier |
| event_data | JSON | | Custom event payload |
| event_timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Event occurrence time |

**Indexes**:
- `idx_tenant_event` on `(tenant_id, event_type)`
- `idx_event_timestamp` on `event_timestamp`

### Sync Logs Table
Audit trail for data synchronization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Log entry ID |
| tenant_id | INT | FOREIGN KEY → tenants(id) | Tenant ownership |
| sync_type | VARCHAR(50) | NOT NULL | customers, orders, products |
| status | VARCHAR(20) | NOT NULL | running, completed, failed |
| records_synced | INT | DEFAULT 0 | Count of records synced |
| error_message | TEXT | | Error details if failed |
| started_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Sync start time |
| completed_at | TIMESTAMP | | Sync completion time |

**Indexes**:
- `idx_tenant_sync` on `(tenant_id, sync_type, started_at)`

---

## 3. API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new tenant account.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "shopifyShopDomain": "my-store.myshopify.com"  // Optional
}
```

**Response** (201 Created):
```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "shopifyShopDomain": "my-store.myshopify.com"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors or duplicate email
- `500 Internal Server Error`: Server error

---

#### POST /api/auth/login
Authenticate and receive JWT token.

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "shopifyShopDomain": "my-store.myshopify.com"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account inactive
- `500 Internal Server Error`: Server error

---

### Shopify Integration Endpoints

#### POST /api/shopify/config
Update Shopify API credentials for tenant.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "shopifyShopDomain": "my-store.myshopify.com",
  "shopifyAccessToken": "shpat_xxxxxxxxxxxxx"
}
```

**Response** (200 OK):
```json
{
  "message": "Shopify configuration updated successfully"
}
```

---

#### POST /api/shopify/sync/all
Trigger full data synchronization.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "message": "Sync completed successfully",
  "results": {
    "customers": { "success": true, "count": 150 },
    "products": { "success": true, "count": 45 },
    "orders": { "success": true, "count": 320 }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Shopify credentials not configured
- `500 Internal Server Error`: Sync failed

---

### Insights Endpoints

#### GET /api/insights/overview
Get key business metrics.

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "totalCustomers": 150,
  "totalOrders": 320,
  "totalRevenue": 45678.50,
  "averageOrderValue": 142.74
}
```

---

#### GET /api/insights/top-customers
Get top customers by total spend.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `limit` (optional): Number of results (default: 5)

**Response** (200 OK):
```json
{
  "topCustomers": [
    {
      "id": 45,
      "email": "bigspender@example.com",
      "name": "Jane Smith",
      "totalSpent": 5432.10,
      "ordersCount": 23
    },
    ...
  ]
}
```

---

#### GET /api/insights/revenue-trend
Get monthly revenue trend.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `months` (optional): Number of months (default: 6)

**Response** (200 OK):
```json
{
  "trend": [
    {
      "month": "2024-06",
      "revenue": 12345.67,
      "orders": 89
    },
    {
      "month": "2024-07",
      "revenue": 15678.90,
      "orders": 102
    },
    ...
  ]
}
```

---

## 4. Assumptions & Design Decisions

### Assumptions

1. **Shopify API Access**
   - Users have Admin API access to their Shopify store
   - Access tokens have required scopes: `read_customers`, `read_orders`, `read_products`
   - API rate limits (2 req/sec) are respected

2. **Data Volume**
   - Target stores: Small to medium-sized (< 10,000 customers, < 50,000 orders)
   - Full sync is acceptable for this scale
   - Pagination not required initially

3. **Currency & Localization**
   - Single currency per store (stored in orders.currency)
   - No currency conversion
   - Dates stored in UTC

4. **Data Freshness**
   - 15-minute sync latency is acceptable
   - Not real-time critical for analytics use case

5. **Security**
   - HTTPS in production (not enforced in development)
   - Basic JWT authentication sufficient for demo
   - Database credentials secured via environment variables

### Design Decisions

#### 1. Multi-Tenancy Strategy
**Decision**: Shared database, discriminated by `tenant_id`

**Rationale**:
- Simpler infrastructure management
- Cost-effective for small-to-medium scale
- Easy cross-tenant analytics (if needed)

**Trade-off**: Less isolation than separate databases, but acceptable for this use case.

---

#### 2. Sync Strategy: Polling vs Webhooks
**Decision**: Implemented both, defaulting to polling

**Rationale**:
- Polling (cron jobs) is simpler to set up and debug
- Webhooks require public URL and HMAC verification
- Polling is sufficient for demo and small stores

**Trade-off**: Higher API usage and latency, but more reliable for development.

---

#### 3. Full Sync vs Incremental Sync
**Decision**: Full sync on each run

**Rationale**:
- Simpler implementation
- No need to track last sync timestamp
- Acceptable for small datasets

**Trade-off**: Inefficient for large stores. Production should use incremental sync with `updated_at` filters.

---

#### 4. Denormalization: `total_spent` in Customers
**Decision**: Store computed field in customers table

**Rationale**:
- Avoids expensive JOIN and SUM on every dashboard load
- Dashboard query becomes simple: `SELECT total_spent FROM customers`

**Trade-off**: Data consistency risk (mitigated by recomputing on sync).

---

#### 5. JWT without Refresh Tokens
**Decision**: Single JWT with 7-day expiration

**Rationale**:
- Simpler for demo and assignment
- Acceptable for internal tools

**Trade-off**: User must re-login every 7 days. Production needs refresh tokens.

---

#### 6. Error Handling Strategy
**Decision**: Basic try-catch with console logging

**Rationale**:
- Sufficient for development and debugging
- Easy to trace issues during demo

**Trade-off**: Not production-ready. Should use structured logging (Winston) and monitoring (Sentry).

---

#### 7. Frontend State Management
**Decision**: React useState/useEffect without Redux

**Rationale**:
- Simple dashboard with limited state
- No complex state interactions
- Reduces bundle size and complexity

**Trade-off**: Not suitable for larger apps with complex state.

---

#### 8. SQL vs ORM
**Decision**: Raw SQL queries with mysql2

**Rationale**:
- Assignment specifically requested SQL knowledge demonstration
- Better control over query optimization
- Easier to show complex aggregations

**Trade-off**: More verbose code. Production could use Sequelize or Prisma for type safety.

---

### Known Limitations

1. **Scalability**
   - No pagination on Shopify API calls (250 item limit)
   - Full table scans on some dashboard queries
   - Single database connection pool

2. **Security**
   - No rate limiting per user/IP
   - Webhook HMAC verification not implemented
   - No input sanitization beyond express-validator

3. **Reliability**
   - No retry logic on failed API calls
   - No transaction rollback on partial sync failures
   - No deadlock detection

4. **Performance**
   - No caching layer (Redis)
   - No query result caching
   - Dashboard loads all data on every visit

5. **Features**
   - No data export functionality
   - No email notifications
   - No custom date range filtering
   - Cart abandonment tracking not implemented

---

### Production Roadmap

**Phase 1 - Core Stability** (1-2 weeks):
- [ ] Add comprehensive error handling
- [ ] Implement retry logic with exponential backoff
- [ ] Add rate limiting (express-rate-limit)
- [ ] Set up structured logging (Winston)
- [ ] Implement health check endpoints

**Phase 2 - Security** (1 week):
- [ ] Add refresh token rotation
- [ ] Implement HMAC verification for webhooks
- [ ] Add input sanitization
- [ ] Set up CORS whitelist
- [ ] Implement CSRF protection

**Phase 3 - Scalability** (2 weeks):
- [ ] Add pagination to all list endpoints
- [ ] Implement incremental sync
- [ ] Add Redis caching layer
- [ ] Optimize database indexes
- [ ] Implement connection pooling tuning

**Phase 4 - Features** (2-3 weeks):
- [ ] Cart abandonment tracking
- [ ] Email notifications
- [ ] Data export (CSV/Excel)
- [ ] Advanced filtering and search
- [ ] Admin dashboard for multi-tenant management

---

**End of Technical Documentation**

For additional questions or clarifications, refer to the main README.md or open an issue on GitHub.
