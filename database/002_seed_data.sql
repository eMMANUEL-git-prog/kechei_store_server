-- Seed Data for Store Keeping & Inventory Management System

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('Food & Beverages', 'Food items, groceries, and beverages'),
('Tools & Equipment', 'Hand tools, power tools, and equipment'),
('Uniforms & Clothing', 'Uniforms, protective gear, and clothing'),
('Stationery & Office Supplies', 'Paper, pens, and office supplies'),
('Medical Supplies', 'First aid, medicines, and medical equipment'),
('Cleaning Supplies', 'Detergents, sanitizers, and cleaning tools'),
('Electronics', 'Electronic devices and accessories'),
('Safety Equipment', 'Safety gear and protective equipment');

-- Insert units of measure
INSERT INTO units_of_measure (name, abbreviation) VALUES
('Pieces', 'pcs'),
('Kilogram', 'kg'),
('Gram', 'g'),
('Liter', 'L'),
('Milliliter', 'mL'),
('Box', 'box'),
('Carton', 'ctn'),
('Pack', 'pack'),
('Set', 'set'),
('Meter', 'm');

-- Insert default admin user (password: admin123 - should be changed)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@camp.org', '$2a$10$rZ8qZ8qZ8qZ8qZ8qZ8qZ8eX', 'System Administrator', 'admin'),
('storekeeper', 'store@camp.org', '$2a$10$rZ8qZ8qZ8qZ8qZ8qZ8qZ8eX', 'Store Keeper', 'storekeeper'),
('auditor', 'auditor@camp.org', '$2a$10$rZ8qZ8qZ8qZ8qZ8qZ8qZ8eX', 'Store Auditor', 'auditor');

-- Insert sample departments
INSERT INTO departments (department_code, name, head_name, contact_email) VALUES
('ADMIN', 'Administration', 'John Doe', 'admin@camp.org'),
('OPS', 'Operations', 'Jane Smith', 'ops@camp.org'),
('MAINT', 'Maintenance', 'Bob Johnson', 'maintenance@camp.org'),
('MED', 'Medical', 'Dr. Sarah Williams', 'medical@camp.org'),
('SEC', 'Security', 'Mike Brown', 'security@camp.org');

-- Insert sample suppliers
INSERT INTO suppliers (supplier_code, name, contact_person, email, phone) VALUES
('SUP001', 'ABC Trading Company', 'Peter Lee', 'peter@abctrading.com', '+1234567890'),
('SUP002', 'Quality Foods Ltd', 'Mary Johnson', 'mary@qualityfoods.com', '+1234567891'),
('SUP003', 'Tech Supplies Inc', 'David Chen', 'david@techsupplies.com', '+1234567892');
