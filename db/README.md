# Database Setup Instructions

## Image Gallery Setup

### 1. Create Storage Bucket
In your Supabase dashboard:
1. Go to Storage
2. Click "Create Bucket"
3. Name: `images`
4. Set public access to: `false` (we'll use RLS policies)
5. Click "Create Bucket"

### 2. Run SQL Migrations
1. Open the SQL editor in your Supabase dashboard
2. Copy and paste the contents of `image_gallery.sql`
3. Run the SQL commands

### 3. Verify Setup
The following should be created:
- `image_gallery` table with all columns
- Row Level Security (RLS) policies
- Storage bucket policy function
- Indexes for performance
- Trigger for `updated_at`

### Schema Details

#### image_gallery Table
- `id`: UUID primary key
- `user_id`: References auth.users(id)
- `title`: Optional image title
- `description`: Optional image description
- `storage_path`: Path in Supabase storage
- `public_url`: Public URL for the image
- `mime_type`: Must be image/* type
- `size_bytes`: File size
- `width`: Image width in pixels
- `height`: Image height in pixels
- `created_at`: Upload timestamp
- `updated_at`: Last update timestamp
- `deleted_at`: Soft delete timestamp

#### Security Features
1. Row Level Security (RLS) policies:
   - Users can only view their own images
   - Users can only upload their own images
   - Users can only update their own images
   - Soft delete support

2. Storage bucket policy:
   - Links storage access to database records
   - Prevents unauthorized access
   - Handles soft deletes

#### Indexes
- `idx_image_gallery_user_id`: For faster user queries
- `idx_image_gallery_created_at`: For sorting by date

### Testing
1. Upload an image through the gallery
2. Verify record in `image_gallery` table
3. Check storage bucket for file
4. Test soft delete functionality
