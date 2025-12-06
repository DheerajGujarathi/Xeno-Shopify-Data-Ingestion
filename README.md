# Xeno Shopify Data Ingestion & Insights Service

A multi-tenant Shopify data ingestion and analytics platform built for the Xeno FDE Internship Assignment 2025. This service enables retailers to connect their Shopify stores, automatically sync customer and order data, and gain actionable business insights through an interactive dashboard.

## 🎯 Project Overview

This project demonstrates a production-ready approach to:
- **Multi-tenant architecture** with complete data isolation
- **Real-time Shopify API integration** for customers, orders, and products
- **Automated data synchronization** using scheduled jobs
- **Interactive analytics dashboard** with charts and key metrics
- **RESTful API design** with proper authentication and error handling
- **Settings management** for Shopify credentials configuration

## ✨ Latest Updates

### Settings Page Added
- Users can now configure Shopify credentials directly from the UI
- View active configuration status with visual indicators
- Delete and update credentials with confirmation dialogs
- Masked token display for security
- No need to use Postman/API calls for configuration

### Enhanced Security
- Proper NULL handling for deleted credentials
- DELETE endpoint for removing Shopify configurations
- Prevents sync operations without valid credentials
- Token masking in the frontend for privacy

## 🏗️ Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Pages   │  │  Dashboard   │  │   Charts     │         │
│  │ (Login/Reg)  │  │  (Insights)  │  │  (Recharts)  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                            │ HTTP/REST API                       │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    API Layer                             │   │
│  │  ┌───────────┐  ┌───────────┐  ┌────────────┐          │   │
│  │  │   Auth    │  │  Shopify  │  │  Insights  │          │   │
│  │  │  Routes   │  │  Routes   │  │   Routes   │          │   │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬──────┘          │   │
│  └────────┼──────────────┼──────────────┼─────────────────┘   │
│           │              │              │                       │
│  ┌────────┼──────────────┼──────────────┼─────────────────┐   │
│  │        │     Business Logic / Services                   │   │
│  │  ┌─────▼──────┐  ┌──▼───────────┐  ┌─▼──────────────┐  │   │
│  │  │   JWT      │  │   Shopify    │  │   Scheduler    │  │   │
│  │  │   Auth     │  │   Service    │  │   Service      │  │   │
│  │  └────────────┘  └──────┬───────┘  └────────┬───────┘  │   │
│  └─────────────────────────┼─────────────────────┼─────────┘   │
│                            │                     │               │
│                            │                     │               │
│                ┌───────────▼─────────────────────▼─────────┐    │
│                │      Shopify API Integration              │    │
│                │  (External API Calls via Axios)           │    │
│                └───────────────────────────────────────────┘    │
│                                                                  │
│                ┌───────────────────────────────────────────┐    │
│                │      Cron Jobs (node-cron)                │    │
│                │  • Sync every 15 minutes                  │    │
│                │  • Sync hourly                            │    │
│                └───────────────────────────────────────────┘    │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               │ MySQL2
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE (MySQL)                          │
│                                                                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐      │
│  │ tenants  │  │ customers │  │  orders  │  │ products │      │
│  └────┬─────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │             │              │
│  ┌────▼──────────────▼──────────────▼─────────────▼────┐       │
│  │            Multi-Tenant Data Isolation              │       │
│  │         (tenant_id foreign keys on all tables)      │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐          │
│  │ order_items  │  │   events    │  │  sync_logs   │          │
│  └──────────────┘  └─────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Registration/Authentication Flow**:
   ```
   User → Register/Login → JWT Token Generated → Stored in LocalStorage
   ```

2. **Data Ingestion Flow**:
   ```
   Shopify API → Sync Service → Data Transformation → MySQL Database
   └─> Scheduled (every 15min/hourly) or Manual Trigger
   ```

3. **Insights Flow**:
   ```
   Dashboard → API Request → SQL Aggregations → Formatted Response → Charts
   ```

## 📁 Project Structure

```
xeno-shopify-insights/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MySQL connection pool
│   │   ├── database/
│   │   │   └── migrate.js            # Database schema & migrations
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js               # Registration & login endpoints
│   │   │   ├── shopify.js            # Shopify sync & webhook endpoints
│   │   │   └── insights.js           # Analytics & metrics endpoints
│   │   ├── services/
│   │   │   ├── shopify.service.js    # Shopify API integration
│   │   │   └── scheduler.service.js  # Automated sync scheduler
│   │   └── server.js                 # Express app entry point
│   ├── .env.example
│   ├── .env
│   ├── .gitignore
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js              # User login page
│   │   │   ├── Register.js           # User registration page
│   │   │   ├── Dashboard.js          # Analytics dashboard with charts
│   │   │   └── Settings.js           # NEW: Shopify config management
│   │   ├── api.js                    # Axios API client
│   │   ├── App.js                    # Main app with routing
│   │   ├── index.js
│   │   └── index.css                 # Global styles
│   ├── .env
│   ├── .gitignore
│   └── package.json
├── .gitignore
└── README.md
```

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌──────────────────┐
│     tenants      │
├──────────────────┤
│ id (PK)          │
│ name             │
│ email (UNIQUE)   │
│ password_hash    │
│ shopify_shop_domain │
│ shopify_access_token │
│ is_active        │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │ 1
         │
         │ N
    ┌────┴─────────────────────────┐
    │                              │
┌───▼──────────┐         ┌─────────▼────┐
│  customers   │         │   products   │
├──────────────┤         ├──────────────┤
│ id (PK)      │         │ id (PK)      │
│ tenant_id    │         │ tenant_id    │
│ shopify_customer_id │  │ shopify_product_id │
│ email        │         │ title        │
│ first_name   │         │ description  │
│ last_name    │         │ vendor       │
│ phone        │         │ product_type │
│ total_spent  │         │ price        │
│ orders_count │         │ created_at   │
│ created_at   │         │ updated_at   │
│ updated_at   │         └──────────────┘
└──────┬───────┘
       │ 1
       │
       │ N
┌──────▼────────────┐
│      orders       │
├───────────────────┤
│ id (PK)           │
│ tenant_id (FK)    │
│ customer_id (FK)  │
│ shopify_order_id  │
│ order_number      │
│ total_price       │
│ subtotal_price    │
│ total_tax         │
│ financial_status  │
│ fulfillment_status│
│ currency          │
│ order_date        │
│ created_at        │
│ updated_at        │
└───────┬───────────┘
        │ 1
        │
        │ N
┌───────▼────────────┐
│   order_items      │
├────────────────────┤
│ id (PK)            │
│ order_id (FK)      │
│ product_id (FK)    │
│ shopify_line_item_id │
│ title              │
│ quantity           │
│ price              │
│ total_discount     │
│ created_at         │
└────────────────────┘

┌────────────────┐       ┌───────────────┐
│    events      │       │  sync_logs    │
├────────────────┤       ├───────────────┤
│ id (PK)        │       │ id (PK)       │
│ tenant_id (FK) │       │ tenant_id (FK)│
│ customer_id    │       │ sync_type     │
│ event_type     │       │ status        │
│ event_data     │       │ records_synced│
│ event_timestamp│       │ error_message │
└────────────────┘       │ started_at    │
                         │ completed_at  │
                         └───────────────┘
```

### Key Design Decisions

1. **Multi-tenancy**: Every table has `tenant_id` to ensure complete data isolation
2. **Dual IDs**: Maintains both internal `id` and `shopify_*_id` for sync integrity
3. **Indexes**: Added on frequently queried columns (tenant_id, email, order_date, total_spent)
4. **Audit Trail**: `sync_logs` table tracks all synchronization attempts
5. **Flexible Events**: JSON column for custom event data (cart abandoned, etc.)

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new tenant | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

**Example Request:**
```json
POST /api/auth/register
{
  "name": "Store Owner",
  "email": "owner@example.com",
  "password": "password123",
  "shopifyShopDomain": "my-store.myshopify.com"
}
```

### Shopify Integration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/shopify/config` | Update Shopify credentials | Yes |
| DELETE | `/api/shopify/config` | Delete Shopify credentials | Yes |
| POST | `/api/shopify/sync/all` | Sync all data (customers, products, orders) | Yes |
| POST | `/api/shopify/sync/customers` | Sync customers only | Yes |
| POST | `/api/shopify/sync/products` | Sync products only | Yes |
| POST | `/api/shopify/sync/orders` | Sync orders only | Yes |
| GET | `/api/shopify/sync/logs` | Get sync history | Yes |
| POST | `/api/shopify/webhooks/customers` | Webhook for customer updates | No* |

*Webhook endpoints should verify Shopify HMAC signature in production

**Config Management Examples:**
```bash
# Save/Update credentials
POST /api/shopify/config
Authorization: Bearer YOUR_JWT_TOKEN
Body: {
  "shopifyShopDomain": "your-store.myshopify.com",
  "shopifyAccessToken": "shpat_xxxxxxxxxxxxx"
}

# Delete credentials (stops sync)
DELETE /api/shopify/config
Authorization: Bearer YOUR_JWT_TOKEN
```

### Insights & Analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/insights/overview` | Get key metrics (customers, orders, revenue) | Yes |
| GET | `/api/insights/orders-by-date` | Get orders grouped by date | Yes |
| GET | `/api/insights/top-customers` | Get top N customers by spend | Yes |
| GET | `/api/insights/revenue-trend` | Get monthly revenue trend | Yes |
| GET | `/api/insights/product-performance` | Get top products by revenue | Yes |
| GET | `/api/insights/recent-orders` | Get recent orders | Yes |
| GET | `/api/insights/customer-growth` | Get monthly customer acquisition | Yes |

**Query Parameters:**
- `startDate`, `endDate`: Filter by date range (ISO 8601 format)
- `limit`: Number of results (default varies by endpoint)
- `months`: Number of months for trend data (default: 6)

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v16+)
- MySQL (v8+)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xeno-shopify-insights
   ```

2. **Navigate to backend directory**
   ```bash
   cd backend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=xeno_shopify_insights
   DB_PORT=3306
   
   # JWT Secret
   JWT_SECRET=your_super_secret_key_change_in_production
   JWT_EXPIRES_IN=7d
   
   # Shopify (optional, can be configured per tenant)
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   
   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:3000
   ```

5. **Create MySQL database**
   ```bash
   mysql -u root -p
   CREATE DATABASE xeno_shopify_insights;
   exit
   ```

6. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

7. **Start the backend server**
   ```bash
   npm run dev
   ```
   
   Server will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # frontend/.env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```
   
   Frontend will start on `http://localhost:3000`

### Shopify Setup

1. **Create a Shopify Development Store**
   - Go to https://partners.shopify.com/
   - Create a development store
   - Add dummy products, customers, and orders

2. **Create a Custom App**
   - In your Shopify admin, go to Settings → Apps and sales channels → Develop apps
   - Create a new app
   - Configure Admin API scopes: `read_customers`, `read_orders`, `read_products`
   - Install the app and copy the access token

3. **Configure in Application**
   
   #### Option 1: Using the Settings Page (Recommended)
   - Register/Login to your application at `http://localhost:3000`
   - Click the **Settings** icon (⚙️) in the dashboard header
   - Enter your Shopify credentials:
     - **Shop Domain**: `your-store.myshopify.com`
     - **Access Token**: `shpat_xxxxxxxxxxxxx`
   - Click **Save Configuration**
   - Navigate back to Dashboard and click **"Sync Now"** to import data
   
   #### Option 2: Using Postman/API
   ```bash
   # First, login to get JWT token
   POST http://localhost:5000/api/auth/login
   Body: { "email": "your@email.com", "password": "yourpassword" }
   
   # Then configure Shopify credentials
   POST http://localhost:5000/api/shopify/config
   Headers: { "Authorization": "Bearer YOUR_JWT_TOKEN" }
   Body: {
     "shopifyShopDomain": "your-store.myshopify.com",
     "shopifyAccessToken": "shpat_xxxxxxxxxxxxx"
   }
   ```
   
   #### Option 3: Direct Database Update
   ```sql
   UPDATE tenants 
   SET shopify_shop_domain = 'your-store.myshopify.com',
       shopify_access_token = 'shpat_xxxxxxxxxxxxx'
   WHERE id = 1;
   ```

### Managing Shopify Credentials

**To Update Credentials:**
- Go to Settings page
- Enter new credentials
- Click "Update Configuration"

**To Delete Credentials:**
- Go to Settings page  
- Click "Delete Configuration" button
- Confirm the action
- This will stop all data synchronization

## 🔄 Data Synchronization

### Automatic Sync

The application automatically syncs data on two schedules:
- **Every 15 minutes**: Frequent updates for demo purposes
- **Every hour**: Standard production cadence

To disable automatic sync, set in `.env`:
```env
ENABLE_SCHEDULER=false
```

### Manual Sync

Use the "Sync Data" button in the dashboard or call the API:
```bash
curl -X POST http://localhost:5000/api/shopify/sync/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Webhook Integration

Configure webhooks in Shopify to receive real-time updates:

1. In Shopify Admin → Settings → Notifications → Webhooks
2. Add webhook:
   - Event: `customers/create`, `customers/update`
   - URL: `https://your-domain.com/api/shopify/webhooks/customers`
   - Format: JSON

**Note**: In production, verify HMAC signature for security.

## 📊 Dashboard Features

### Overview Metrics
- Total Customers
- Total Orders  
- Total Revenue
- Average Order Value

### Pages & Features

#### Dashboard (Main Page)
- **Overview Metrics**: 4 key metric cards with icons
- **Revenue Trend**: 6-month line chart showing revenue over time
- **Customer Growth**: Monthly bar chart of new customer acquisition
- **Top 5 Customers**: Table sorted by total spend
- **Top 5 Products**: Best-selling products by revenue
- **Recent Orders**: Latest 10 orders with status
- **Sync Now Button**: Manual data synchronization
- **Settings Link**: Navigate to configuration page

#### Settings Page (NEW)
- **Configuration Management**: Add/update Shopify credentials
- **Active Status Badge**: Visual indicator when config is active
- **Delete Configuration**: Remove credentials with confirmation
- **Masked Token Display**: Shows `••••••••••••••••` for security
- **Setup Instructions**: Step-by-step guide to get Shopify credentials
- **Form Validation**: Ensures required fields are filled

### Interactive Features
- Date range filtering for order analysis
- One-click data synchronization
- Real-time sync status updates
- Responsive design for all screen sizes
- Settings icon in navigation bar

## 🔒 Security Considerations

### Implemented
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Environment variable protection

### Production Recommendations
- Implement rate limiting (express-rate-limit)
- Add HMAC verification for Shopify webhooks
- Use HTTPS/TLS encryption
- Implement refresh tokens
- Add input sanitization
- Set up database connection encryption
- Implement logging and monitoring (Winston, Sentry)
- Add API request validation middleware
- Implement CSRF protection

## 🧪 Testing

Currently, the project includes manual testing. For production:

```bash
# Unit tests (to be implemented)
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
```

**Recommended Testing Strategy**:
- Unit tests for services (Jest)
- Integration tests for API endpoints (Supertest)
- E2E tests for user flows (Cypress)

## 📦 Assumptions & Trade-offs

### Assumptions

1. **Shopify Access**: Assumes users have Admin API access to their Shopify store
2. **Data Volume**: Designed for small-to-medium stores (<10K customers, <50K orders)
3. **Single Currency**: Assumes all transactions in store's base currency
4. **API Limits**: Respects Shopify's API rate limits (2 requests/second)
5. **Data Freshness**: 15-minute sync is acceptable (not real-time)

### Trade-offs

1. **Polling vs Webhooks**: 
   - Chose polling (scheduled sync) for simplicity
   - Production should prioritize webhooks for real-time updates

2. **Sync Strategy**:
   - Full sync on each run (not incremental)
   - Better for small datasets, would need pagination for large stores

3. **Database Design**:
   - Denormalized `total_spent` in customers table
   - Trades consistency for query performance

4. **Authentication**:
   - Single JWT without refresh tokens
   - Sufficient for demo, production needs token rotation

5. **Error Handling**:
   - Basic error logging
   - Production needs structured logging (Winston) and monitoring (Sentry)

## 🚀 Next Steps for Production

### High Priority

1. **Scalability**
   - Implement pagination for large datasets
   - Add incremental sync with timestamps
   - Implement Redis caching for frequently accessed data
   - Use RabbitMQ/Bull for async job processing

2. **Security**
   - Add rate limiting per tenant
   - Implement refresh token rotation
   - Add HMAC verification for webhooks
   - Set up WAF (Web Application Firewall)

3. **Reliability**
   - Add comprehensive error handling
   - Implement retry logic with exponential backoff
   - Set up health checks and monitoring
   - Add database replication for high availability

### Medium Priority

4. **Features**
   - Add cart abandonment tracking
   - Implement email notifications
   - Add data export (CSV/Excel)
   - Build admin dashboard for multi-tenant management
   - Add custom event tracking

5. **Developer Experience**
   - Add comprehensive unit tests (80%+ coverage)
   - Set up CI/CD pipeline (GitHub Actions)
   - Add API documentation (Swagger/OpenAPI)
   - Implement database seeding for development

### Nice to Have

6. **Advanced Analytics**
   - Customer lifetime value (CLV) calculation
   - Predictive analytics for churn
   - Product recommendation engine
   - Cohort analysis

7. **Performance**
   - Implement database query optimization
   - Add CDN for frontend assets
   - Implement GraphQL for flexible data fetching
   - Add server-side caching with Redis

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js v16+
- **Framework**: Express.js v4
- **Database**: MySQL v8 with mysql2 driver
- **Authentication**: JWT (jsonwebtoken, bcryptjs)
- **Scheduling**: node-cron
- **HTTP Client**: Axios
- **Security**: Helmet, CORS
- **Logging**: Morgan

### Frontend
- **Framework**: React v18
- **Routing**: React Router v6
- **Charts**: Recharts v2
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Styling**: Vanilla CSS

### DevOps (Recommended)
- **Deployment**: Heroku, Render, Railway, or AWS
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, DataDog
- **Logging**: Winston, Papertrail

## 📝 SQL Query Examples

### Top Customers Query
```sql
SELECT 
  c.email, 
  c.first_name, 
  c.last_name, 
  c.total_spent, 
  c.orders_count
FROM customers c
WHERE c.tenant_id = ?
ORDER BY c.total_spent DESC
LIMIT 5;
```

### Revenue Trend Query
```sql
SELECT 
  DATE_FORMAT(order_date, '%Y-%m') as month,
  SUM(total_price) as revenue,
  COUNT(*) as orders
FROM orders
WHERE tenant_id = ? 
  AND order_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month ASC;
```

### Product Performance Query
```sql
SELECT 
  p.title,
  COUNT(oi.id) as times_sold,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.quantity * oi.price) as total_revenue
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE p.tenant_id = ?
GROUP BY p.id, p.title
ORDER BY total_revenue DESC
LIMIT 10;
```

## 📄 License

MIT License - Feel free to use this project for learning and development.

## 👤 Author

**Xeno FDE Internship Candidate 2025**

---

## 🎥 Demo Video Script

*To be recorded (max 7 minutes):*

1. **Introduction** (30s)
   - Project overview
   - Tech stack highlight

2. **Architecture Walkthrough** (1min)
   - Show architecture diagram
   - Explain multi-tenancy

3. **Code Walkthrough** (2min)
   - Backend structure
   - Key services (Shopify, Scheduler)
   - Database schema

4. **Live Demo** (3min)
   - Register new tenant
   - Configure Shopify credentials
   - Trigger manual sync
   - Explore dashboard metrics
   - Show charts and tables

5. **Trade-offs & Next Steps** (30s)
   - Discuss assumptions
   - Production improvements

---

**Questions or issues?** Open an issue on GitHub or contact the maintainer.

Built with ❤️ for Xeno
