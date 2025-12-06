# Xeno Shopify Insights - Backend

Node.js + Express + MySQL backend for the multi-tenant Shopify data ingestion service.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

Create a `.env` file with:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=xeno_shopify_insights
DB_PORT=3306

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000
ENABLE_SCHEDULER=true
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── database/
│   │   └── migrate.js            # Database migrations
│   ├── middleware/
│   │   └── auth.js               # JWT authentication
│   ├── routes/
│   │   ├── auth.js               # Auth endpoints
│   │   ├── shopify.js            # Shopify sync endpoints
│   │   └── insights.js           # Analytics endpoints
│   ├── services/
│   │   ├── shopify.service.js    # Shopify API integration
│   │   └── scheduler.service.js  # Automated sync
│   └── server.js                 # Express app entry
├── .env
├── .env.example
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new tenant
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get profile

### Shopify
- `POST /api/shopify/config` - Update credentials
- `POST /api/shopify/sync/all` - Sync all data
- `GET /api/shopify/sync/logs` - Get sync history

### Insights
- `GET /api/insights/overview` - Dashboard metrics
- `GET /api/insights/top-customers` - Top customers
- `GET /api/insights/revenue-trend` - Revenue trend

## Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE xeno_shopify_insights;
exit

# Run migrations
npm run db:migrate
```

## Features

- ✅ Multi-tenant architecture
- ✅ JWT authentication
- ✅ Shopify API integration
- ✅ Automated data sync (every 15 min)
- ✅ RESTful API (17 endpoints)
- ✅ MySQL with proper indexing
- ✅ Error handling & logging

## Tech Stack

- Node.js & Express.js
- MySQL with mysql2
- JWT (jsonwebtoken, bcryptjs)
- Axios for Shopify API
- node-cron for scheduling
- Helmet & CORS for security

## Scripts

```bash
npm run dev        # Start with nodemon
npm start          # Start production
npm run db:migrate # Run database migrations
```

## License

MIT
