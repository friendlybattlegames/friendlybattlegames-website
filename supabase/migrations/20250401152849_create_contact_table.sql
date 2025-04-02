-- Drop existing table if it exists
DROP TABLE IF EXISTS contact_messages;

-- Create contact_messages table
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public to insert contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated users to view contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated users to update contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert contact messages" ON contact_messages;

-- Create a single policy for public access to insert messages
CREATE POLICY "enable_public_insert" ON contact_messages FOR INSERT WITH CHECK (true);

-- Create policy for authenticated users to view messages
CREATE POLICY "enable_auth_select" ON contact_messages FOR SELECT TO authenticated USING (true);

-- Create policy for authenticated users to update messages
CREATE POLICY "enable_auth_update" ON contact_messages FOR UPDATE TO authenticated USING (true);
