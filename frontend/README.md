# Xeno Shopify Insights - Frontend

React-based dashboard for visualizing Shopify store analytics and insights.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── Login.js          # Login page
│   │   ├── Register.js       # Registration page
│   │   └── Dashboard.js      # Main dashboard
│   ├── api.js                # Axios API client
│   ├── App.js                # React Router
│   ├── index.js              # Entry point
│   └── index.css             # Global styles
└── package.json
```

## Features

### Authentication
- ✅ Login page with email/password
- ✅ Registration with tenant setup
- ✅ JWT token management
- ✅ Protected routes

### Dashboard
- ✅ 4 key metric cards
  - Total Customers
  - Total Orders
  - Total Revenue
  - Average Order Value
- ✅ Revenue trend chart (6 months)
- ✅ Customer growth chart (6 months)
- ✅ Top 5 customers table
- ✅ Top 5 products table
- ✅ Recent orders table
- ✅ One-click data sync button

## Tech Stack

- React 18
- React Router v6
- Recharts (data visualization)
- Axios (HTTP client)
- Lucide React (icons)
- Vanilla CSS

## Available Scripts

```bash
npm start      # Start dev server (http://localhost:3000)
npm run build  # Build for production
npm test       # Run tests
```

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api` by default.

All API requests include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Routing

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard (protected)
- `/` - Redirects to dashboard

## Styling

Uses vanilla CSS with modern design:
- Responsive grid layout
- Card-based UI components
- Professional color scheme
- Hover effects and transitions

## Building for Production

```bash
npm run build
```

Creates optimized production build in `build/` directory.

## License

MIT
