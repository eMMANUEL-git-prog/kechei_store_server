# Store Inventory Management System - Backend

Express.js REST API for Store Keeping & Inventory Management System.

## Features

- JWT-based authentication
- Role-based access control (Admin, Storekeeper, Department Head, Auditor)
- Complete CRUD operations for items, suppliers, departments
- Goods Received Notes (GRN) management
- Stock issuing with validation
- Stock adjustments
- Complete audit trail via stock movements
- Reporting and analytics endpoints

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the environment variables in `.env`:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `PORT`: Server port (default: 5000)
   - `CORS_ORIGIN`: Frontend URL

## Database Setup

See `database/README.md` for detailed database setup instructions.

Quick start:
```bash
# Create database and run migrations
psql -U postgres -d store_inventory -f database/001_init_schema.sql
psql -U postgres -d store_inventory -f database/002_seed_data.sql
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Items
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create item (admin/storekeeper)
- `PUT /api/items/:id` - Update item (admin/storekeeper)

### Stock
- `GET /api/stock/levels` - Get current stock levels
- `GET /api/stock/low-stock` - Get low stock items
- `GET /api/stock/movements/:itemId` - Get stock movements for item

### GRN (Goods Received Notes)
- `GET /api/grn` - Get all GRNs
- `GET /api/grn/:id` - Get single GRN with items
- `POST /api/grn` - Create GRN (admin/storekeeper)

### Stock Issues
- `GET /api/issues` - Get all stock issues
- `GET /api/issues/:id` - Get single issue with items
- `POST /api/issues` - Create stock issue (admin/storekeeper)

### Reference Data
- `GET /api/categories` - Get all categories
- `GET /api/units` - Get all units of measure
- `GET /api/departments` - Get all departments
- `GET /api/suppliers` - Get all suppliers

### Reports
- `GET /api/reports/dashboard-stats` - Get dashboard statistics
- `GET /api/reports/stock-by-category` - Get stock grouped by category
- `GET /api/reports/department-consumption` - Get department consumption report

## Authentication

All API endpoints (except `/api/auth/login` and `/api/health`) require authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Default Users

Username: `admin`, Password: `admin123` (Role: Admin)
Username: `storekeeper`, Password: `admin123` (Role: Storekeeper)

**⚠️ Change these passwords in production!**

## Error Responses

All errors return JSON with an `error` field:
```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- 400: Bad Request (validation errors)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error
# kechei_store
