-- ImageFlow Database Schema
-- PostgreSQL implementation based on design document

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users Table
CREATE TABLE users (
    user_id VARCHAR(20) PRIMARY KEY DEFAULT 'usr_' || substr(uuid_generate_v4()::text, 1, 13),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Images Table
CREATE TABLE images (
    image_id VARCHAR(20) PRIMARY KEY DEFAULT 'img_' || substr(uuid_generate_v4()::text, 1, 13),
    user_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    thumbnail_paths JSONB NOT NULL,
    privacy_level VARCHAR(20) DEFAULT 'public' CHECK (privacy_level IN ('public', 'followers', 'private')),
    is_deleted BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_edited_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    color_palette JSONB,
    ai_analysis JSONB,
    view_count INTEGER DEFAULT 0
);

-- Create indexes for images
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_uploaded_at ON images(uploaded_at);
CREATE INDEX idx_images_privacy_level ON images(privacy_level);
CREATE INDEX idx_images_fulltext ON images USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Image Versions Table
CREATE TABLE image_versions (
    version_id VARCHAR(20) PRIMARY KEY DEFAULT 'ver_' || substr(uuid_generate_v4()::text, 1, 13),
    image_id VARCHAR(20) NOT NULL REFERENCES images(image_id) ON DELETE CASCADE,
    parent_version_id VARCHAR(20) REFERENCES image_versions(version_id),
    version_number INTEGER NOT NULL,
    branch_name VARCHAR(100),
    created_by VARCHAR(20) NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    canvas_state JSONB NOT NULL,
    thumbnail_path VARCHAR(500),
    file_size INTEGER NOT NULL,
    is_current BOOLEAN DEFAULT FALSE
);

-- Create indexes for image versions
CREATE INDEX idx_versions_image_id ON image_versions(image_id);
CREATE INDEX idx_versions_parent ON image_versions(parent_version_id);
CREATE INDEX idx_versions_created_at ON image_versions(created_at);
CREATE UNIQUE INDEX idx_versions_image_number ON image_versions(image_id, version_number);

-- Canvas Layers Table
CREATE TABLE canvas_layers (
    layer_id VARCHAR(20) PRIMARY KEY DEFAULT 'lyr_' || substr(uuid_generate_v4()::text, 1, 13),
    version_id VARCHAR(20) NOT NULL REFERENCES image_versions(version_id) ON DELETE CASCADE,
    layer_order INTEGER NOT NULL,
    layer_type VARCHAR(50) NOT NULL CHECK (layer_type IN ('image', 'adjustment', 'drawing', 'text', 'filter')),
    name VARCHAR(100) NOT NULL,
    visible BOOLEAN DEFAULT TRUE,
    opacity DECIMAL(3,2) DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
    blend_mode VARCHAR(50) DEFAULT 'normal',
    locked BOOLEAN DEFAULT FALSE,
    layer_data JSONB NOT NULL,
    transform_matrix JSONB,
    filters JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for canvas layers
CREATE INDEX idx_layers_version_id ON canvas_layers(version_id);
CREATE INDEX idx_layers_order ON canvas_layers(version_id, layer_order);

-- Follows Table (Many-to-Many)
CREATE TABLE follows (
    follower_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    following_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create indexes for follows
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_follows_followed_at ON follows(followed_at);

-- Activities Table
CREATE TABLE activities (
    activity_id VARCHAR(20) PRIMARY KEY DEFAULT 'act_' || substr(uuid_generate_v4()::text, 1, 13),
    actor_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('image_upload', 'image_edit', 'follow', 'like', 'comment', 'share')),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('image', 'user', 'comment')),
    target_id VARCHAR(20) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activities
CREATE INDEX idx_activities_actor_id ON activities(actor_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_activities_target ON activities(target_type, target_id);
CREATE INDEX idx_activities_type ON activities(activity_type);

-- Comments Table
CREATE TABLE comments (
    comment_id VARCHAR(20) PRIMARY KEY DEFAULT 'cmt_' || substr(uuid_generate_v4()::text, 1, 13),
    image_id VARCHAR(20) NOT NULL REFERENCES images(image_id) ON DELETE CASCADE,
    user_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    parent_comment_id VARCHAR(20) REFERENCES comments(comment_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    coordinates JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for comments
CREATE INDEX idx_comments_image_id ON comments(image_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Likes Table
CREATE TABLE likes (
    user_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('image', 'comment')),
    target_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, target_type, target_id)
);

-- Create indexes for likes
CREATE INDEX idx_likes_target ON likes(target_type, target_id);
CREATE INDEX idx_likes_created_at ON likes(created_at);

-- Edit Sessions Table
CREATE TABLE edit_sessions (
    session_id VARCHAR(20) PRIMARY KEY DEFAULT 'ses_' || substr(uuid_generate_v4()::text, 1, 13),
    image_id VARCHAR(20) NOT NULL REFERENCES images(image_id) ON DELETE CASCADE,
    owner_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    session_type VARCHAR(50) DEFAULT 'solo' CHECK (session_type IN ('solo', 'collaborative')),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for edit sessions
CREATE INDEX idx_sessions_image_id ON edit_sessions(image_id);
CREATE INDEX idx_sessions_owner_id ON edit_sessions(owner_id);
CREATE INDEX idx_sessions_expires_at ON edit_sessions(expires_at);

-- Session Participants Table
CREATE TABLE session_participants (
    session_id VARCHAR(20) NOT NULL REFERENCES edit_sessions(session_id) ON DELETE CASCADE,
    user_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    permissions JSONB DEFAULT '{"canEdit": true, "canComment": true}'::jsonb,
    cursor_color VARCHAR(7),
    
    PRIMARY KEY (session_id, user_id)
);

-- Create indexes for session participants
CREATE INDEX idx_participants_user_id ON session_participants(user_id);

-- Tags Table
CREATE TABLE tags (
    tag_id VARCHAR(20) PRIMARY KEY DEFAULT 'tag_' || substr(uuid_generate_v4()::text, 1, 13),
    tag_name VARCHAR(50) UNIQUE NOT NULL,
    tag_slug VARCHAR(50) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for tags
CREATE INDEX idx_tags_name ON tags(tag_name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);

-- Image Tags Table (Many-to-Many)
CREATE TABLE image_tags (
    image_id VARCHAR(20) NOT NULL REFERENCES images(image_id) ON DELETE CASCADE,
    tag_id VARCHAR(20) NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
    added_by VARCHAR(20) NOT NULL REFERENCES users(user_id),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(20) DEFAULT 'user' CHECK (source IN ('user', 'ai', 'auto')),
    confidence DECIMAL(3,2),
    
    PRIMARY KEY (image_id, tag_id)
);

-- Create indexes for image tags
CREATE INDEX idx_image_tags_tag_id ON image_tags(tag_id);
CREATE INDEX idx_image_tags_added_at ON image_tags(added_at);

-- Notifications Table
CREATE TABLE notifications (
    notification_id VARCHAR(20) PRIMARY KEY DEFAULT 'not_' || substr(uuid_generate_v4()::text, 1, 13),
    user_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'mention', 'collaboration', 'system')),
    actor_id VARCHAR(20) REFERENCES users(user_id),
    target_type VARCHAR(50),
    target_id VARCHAR(20),
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Search Index Table
CREATE TABLE search_index (
    index_id SERIAL PRIMARY KEY,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('image', 'user', 'tag')),
    document_id VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    tsv_content TSVECTOR,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for search
CREATE UNIQUE INDEX idx_search_document ON search_index(document_type, document_id);
CREATE INDEX idx_search_tsv ON search_index USING GIN(tsv_content);

-- User Sessions Table
CREATE TABLE user_sessions (
    session_id VARCHAR(20) PRIMARY KEY DEFAULT 'uss_' || substr(uuid_generate_v4()::text, 1, 13),
    user_id VARCHAR(20) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for user sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create materialized view for user stats
CREATE MATERIALIZED VIEW user_stats AS
SELECT 
    u.user_id,
    COUNT(DISTINCT i.image_id) as image_count,
    COUNT(DISTINCT f1.follower_id) as follower_count,
    COUNT(DISTINCT f2.following_id) as following_count,
    COALESCE(SUM(i.view_count), 0) as total_views,
    MAX(i.uploaded_at) as last_upload
FROM users u
LEFT JOIN images i ON u.user_id = i.user_id AND i.is_deleted = FALSE
LEFT JOIN follows f1 ON u.user_id = f1.following_id
LEFT JOIN follows f2 ON u.user_id = f2.follower_id
GROUP BY u.user_id;

CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Create view for activity feed
CREATE VIEW activity_feed AS
SELECT 
    a.*,
    u.username as actor_username,
    u.display_name as actor_display_name,
    u.avatar_url as actor_avatar
FROM activities a
JOIN users u ON a.actor_id = u.user_id;

-- Functions and Triggers

-- Function to update search index
CREATE OR REPLACE FUNCTION update_search_index()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO search_index (document_type, document_id, content, tsv_content)
    VALUES (
        'image',
        NEW.image_id,
        NEW.title || ' ' || COALESCE(NEW.description, ''),
        to_tsvector('english', NEW.title || ' ' || COALESCE(NEW.description, ''))
    )
    ON CONFLICT (document_type, document_id) DO UPDATE
    SET content = EXCLUDED.content,
        tsv_content = EXCLUDED.tsv_content,
        updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating search index when images are modified
CREATE TRIGGER trigger_update_search_index
AFTER INSERT OR UPDATE ON images
FOR EACH ROW EXECUTE FUNCTION update_search_index();

-- Function to update user stats
CREATE OR REPLACE FUNCTION refresh_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table updated_at
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create some composite indexes for common queries
CREATE INDEX idx_images_gallery ON images(user_id, uploaded_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_activities_feed ON activities(actor_id, created_at DESC);
CREATE INDEX idx_image_tags_search ON image_tags(tag_id, image_id);
CREATE INDEX idx_active_sessions ON edit_sessions(expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_unread_notifications ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;