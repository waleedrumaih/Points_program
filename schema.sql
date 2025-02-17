-- schema.sql
CREATE TABLE IF NOT EXISTS points (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    point_type VARCHAR(50) NOT NULL,
    point_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_points_name ON points(name);

-- Add constraint to ensure non-negative points
ALTER TABLE points ADD CONSTRAINT points_non_negative CHECK (point_count >= 0);