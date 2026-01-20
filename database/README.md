# Database Setup Instructions

## Prerequisites
- PostgreSQL 14 or higher installed
- Access to PostgreSQL with superuser privileges

## Step 1: Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE store_inventory;

# Connect to database
\c store_inventory
```

## Step 2: Run Schema Script

```bash
# Run the initial schema
psql -U postgres -d store_inventory -f 001_init_schema.sql
```

## Step 3: Run Seed Data

```bash
# Run the seed data
psql -U postgres -d store_inventory -f 002_seed_data.sql
```

## Step 4: Verify Installation

```sql
-- Check tables
\dt

-- Check if categories were inserted
SELECT * FROM categories;

-- Check if units were inserted
SELECT * FROM units_of_measure;

-- Check if users were inserted
SELECT username, full_name, role FROM users;
```

## Connection String Format

```
postgresql://username:password@localhost:5432/store_inventory
```

Example for local development:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/store_inventory
```

## Database Schema Overview

### Core Tables:
- **users**: System users with role-based access
- **categories**: Item categories
- **units_of_measure**: Units like kg, pcs, liters
- **items**: Inventory items
- **suppliers**: Supplier information
- **departments**: Organizational departments
- **stock**: Current stock levels

### Transaction Tables:
- **goods_received_notes**: Incoming stock records
- **grn_items**: Line items for GRNs
- **stock_issues**: Outgoing stock records
- **stock_issue_items**: Line items for issues
- **stock_adjustments**: Manual stock corrections

### Audit Tables:
- **stock_movements**: Complete audit trail of all movements

## User Roles

1. **admin**: Full system access
2. **storekeeper**: Manage stock, create GRNs and issues
3. **department_head**: Request items, view department history
4. **auditor**: Read-only access for auditing

## Default Login Credentials

**⚠️ IMPORTANT: Change these passwords in production!**

- **Admin**: username: `admin`, password: `admin123`
- **Storekeeper**: username: `storekeeper`, password: `admin123`
- **Auditor**: username: `auditor`, password: `admin123`

## Backup and Restore

### Backup
```bash
pg_dump -U postgres store_inventory > backup.sql
```

### Restore
```bash
psql -U postgres -d store_inventory < backup.sql
