-- Drop existing tables and views
DROP TABLE IF EXISTS shop_items CASCADE;
DROP TABLE IF EXISTS item_categories CASCADE;

-- Create categories table
CREATE TABLE item_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create shop items table
CREATE TABLE shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT NOT NULL,
    paypal_button_id TEXT NOT NULL,
    category_id UUID REFERENCES item_categories(id),
    size TEXT[] NOT NULL,
    color TEXT[] NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Create policies for item_categories
CREATE POLICY "Allow public to view categories"
    ON item_categories
    FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Allow authenticated users to manage categories"
    ON item_categories
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policies for shop_items
CREATE POLICY "Allow public to view active items"
    ON shop_items
    FOR SELECT
    TO PUBLIC
    USING (is_active = true);

CREATE POLICY "Allow authenticated users to manage items"
    ON shop_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert sample categories
INSERT INTO item_categories (name, description) VALUES
('T-Shirts', 'Comfortable and stylish t-shirts with gaming designs'),
('Hoodies', 'Warm and cozy hoodies perfect for gaming sessions'),
('Accessories', 'Gaming-themed accessories to complete your look');

-- Insert sample shop items
INSERT INTO shop_items (
    name, 
    description, 
    price, 
    image_url, 
    paypal_button_id,
    category_id,
    size,
    color,
    stock
) VALUES
(
    'Classic Gaming T-Shirt',
    'A comfortable cotton t-shirt featuring our classic arcade design',
    29.99,
    'https://placehold.co/400x500',
    'PAYPAL_BUTTON_ID_1',
    (SELECT id FROM item_categories WHERE name = 'T-Shirts'),
    ARRAY['S', 'M', 'L', 'XL'],
    ARRAY['Black', 'White', 'Navy'],
    100
),
(
    'Pixel Art Hoodie',
    'Cozy hoodie with our signature pixel art design',
    49.99,
    'https://placehold.co/400x500',
    'PAYPAL_BUTTON_ID_2',
    (SELECT id FROM item_categories WHERE name = 'Hoodies'),
    ARRAY['M', 'L', 'XL', 'XXL'],
    ARRAY['Gray', 'Black', 'Navy'],
    75
),
(
    'Retro Gaming Cap',
    'Adjustable cap with embroidered retro gaming logo',
    24.99,
    'https://placehold.co/400x500',
    'PAYPAL_BUTTON_ID_3',
    (SELECT id FROM item_categories WHERE name = 'Accessories'),
    ARRAY['One Size'],
    ARRAY['Black', 'White', 'Red'],
    50
),
(
    'Gaming Controller T-Shirt',
    'Cotton t-shirt with vintage controller design',
    32.99,
    'https://placehold.co/400x500',
    'PAYPAL_BUTTON_ID_4',
    (SELECT id FROM item_categories WHERE name = 'T-Shirts'),
    ARRAY['S', 'M', 'L', 'XL', 'XXL'],
    ARRAY['White', 'Gray', 'Navy'],
    85
),
(
    'Gamer Squad Hoodie',
    'Premium hoodie with embroidered gaming squad logo',
    54.99,
    'https://placehold.co/400x500',
    'PAYPAL_BUTTON_ID_5',
    (SELECT id FROM item_categories WHERE name = 'Hoodies'),
    ARRAY['S', 'M', 'L', 'XL'],
    ARRAY['Black', 'Gray', 'Navy'],
    60
);
