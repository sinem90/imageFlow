-- ImageFlow Database Seed Data
-- Sample data for development and testing

-- Insert sample users
INSERT INTO users (user_id, username, email, password_hash, display_name, bio, email_verified) VALUES
('usr_sarah_chen', 'sarahchen', 'sarah.chen@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDy4rR2M8oB4qZK', 'Sarah Chen', 'Creative photographer and digital artist. Love capturing sunsets and nature.', true),
('usr_marcus_rodriguez', 'marcusrodriguez', 'marcus.rodriguez@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDy4rR2M8oB4qZK', 'Marcus Rodriguez', 'Professional photographer and content creator. Specializing in landscape and portrait photography.', true),
('usr_emma_thompson', 'emmathompson', 'emma.thompson@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDy4rR2M8oB4qZK', 'Dr. Emma Thompson', 'Photography educator and researcher. Teaching digital imaging at the university level.', true),
('usr_demo_user', 'demouser', 'demo@imageflow.app', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDy4rR2M8oB4qZK', 'Demo User', 'Demonstration account for ImageFlow features.', true);

-- Insert sample follows
INSERT INTO follows (follower_id, following_id) VALUES
('usr_sarah_chen', 'usr_marcus_rodriguez'),
('usr_sarah_chen', 'usr_emma_thompson'),
('usr_marcus_rodriguez', 'usr_sarah_chen'),
('usr_marcus_rodriguez', 'usr_emma_thompson'),
('usr_emma_thompson', 'usr_sarah_chen'),
('usr_demo_user', 'usr_sarah_chen'),
('usr_demo_user', 'usr_marcus_rodriguez'),
('usr_demo_user', 'usr_emma_thompson');

-- Insert sample tags
INSERT INTO tags (tag_id, tag_name, tag_slug, usage_count) VALUES
('tag_sunset', 'sunset', 'sunset', 15),
('tag_beach', 'beach', 'beach', 12),
('tag_landscape', 'landscape', 'landscape', 25),
('tag_portrait', 'portrait', 'portrait', 18),
('tag_nature', 'nature', 'nature', 30),
('tag_vacation', 'vacation', 'vacation', 8),
('tag_hawaii', 'hawaii', 'hawaii', 5),
('tag_mountains', 'mountains', 'mountains', 10),
('tag_forest', 'forest', 'forest', 7),
('tag_cityscape', 'cityscape', 'cityscape', 6);

-- Insert sample images
INSERT INTO images (image_id, user_id, title, description, filename, mime_type, file_size, width, height, storage_path, thumbnail_paths, privacy_level, color_palette, view_count) VALUES
('img_sunset_beach', 'usr_sarah_chen', 'Sunset at Beach', 'Beautiful sunset captured in Hawaii during my vacation', 'sunset_beach_001.jpg', 'image/jpeg', 2048576, 3000, 2000, '/uploads/2025/07/sunset_beach_001.jpg', '{"thumbnail": "/uploads/thumbnails/sunset_beach_001_thumb.jpg", "display": "/uploads/display/sunset_beach_001_display.jpg"}', 'public', '["#FF6B35", "#FFA500", "#87CEEB", "#FFD700"]', 156),
('img_mountain_landscape', 'usr_marcus_rodriguez', 'Mountain Landscape', 'Breathtaking view from the summit of Mount Rainier', 'mountain_landscape_001.jpg', 'image/jpeg', 3145728, 4000, 2667, '/uploads/2025/07/mountain_landscape_001.jpg', '{"thumbnail": "/uploads/thumbnails/mountain_landscape_001_thumb.jpg", "display": "/uploads/display/mountain_landscape_001_display.jpg"}', 'public', '["#4A5D23", "#8B7355", "#E6F3FF", "#2F4F4F"]', 89),
('img_forest_portrait', 'usr_emma_thompson', 'Forest Portrait Session', 'Student portrait session in the university botanical gardens', 'forest_portrait_001.jpg', 'image/jpeg', 1572864, 2400, 3600, '/uploads/2025/07/forest_portrait_001.jpg', '{"thumbnail": "/uploads/thumbnails/forest_portrait_001_thumb.jpg", "display": "/uploads/display/forest_portrait_001_display.jpg"}', 'followers', '["#228B22", "#DEB887", "#F5DEB3", "#8B4513"]', 43);

-- Insert sample image tags
INSERT INTO image_tags (image_id, tag_id, added_by, source) VALUES
('img_sunset_beach', 'tag_sunset', 'usr_sarah_chen', 'user'),
('img_sunset_beach', 'tag_beach', 'usr_sarah_chen', 'user'),
('img_sunset_beach', 'tag_vacation', 'usr_sarah_chen', 'user'),
('img_sunset_beach', 'tag_hawaii', 'usr_sarah_chen', 'user'),
('img_mountain_landscape', 'tag_landscape', 'usr_marcus_rodriguez', 'user'),
('img_mountain_landscape', 'tag_mountains', 'usr_marcus_rodriguez', 'user'),
('img_mountain_landscape', 'tag_nature', 'usr_marcus_rodriguez', 'user'),
('img_forest_portrait', 'tag_portrait', 'usr_emma_thompson', 'user'),
('img_forest_portrait', 'tag_forest', 'usr_emma_thompson', 'user'),
('img_forest_portrait', 'tag_nature', 'usr_emma_thompson', 'user');

-- Insert sample image versions
INSERT INTO image_versions (version_id, image_id, version_number, created_by, description, canvas_state, file_size, is_current) VALUES
('ver_sunset_v1', 'img_sunset_beach', 1, 'usr_sarah_chen', 'Original upload', '{"layers": [{"id": "layer_base", "type": "image", "name": "Original", "visible": true, "opacity": 1.0}]}', 2048576, false),
('ver_sunset_v2', 'img_sunset_beach', 2, 'usr_sarah_chen', 'Enhanced colors and contrast', '{"layers": [{"id": "layer_base", "type": "image", "name": "Original", "visible": true, "opacity": 1.0}, {"id": "layer_adj_1", "type": "adjustment", "name": "Color Enhancement", "visible": true, "opacity": 0.8}]}', 2048576, true),
('ver_mountain_v1', 'img_mountain_landscape', 1, 'usr_marcus_rodriguez', 'Original upload', '{"layers": [{"id": "layer_base", "type": "image", "name": "Original", "visible": true, "opacity": 1.0}]}', 3145728, true),
('ver_portrait_v1', 'img_forest_portrait', 1, 'usr_emma_thompson', 'Original upload', '{"layers": [{"id": "layer_base", "type": "image", "name": "Original", "visible": true, "opacity": 1.0}]}', 1572864, true);

-- Insert sample activities
INSERT INTO activities (activity_id, actor_id, activity_type, target_type, target_id, metadata) VALUES
('act_sarah_upload_1', 'usr_sarah_chen', 'image_upload', 'image', 'img_sunset_beach', '{"title": "Sunset at Beach"}'),
('act_marcus_upload_1', 'usr_marcus_rodriguez', 'image_upload', 'image', 'img_mountain_landscape', '{"title": "Mountain Landscape"}'),
('act_emma_upload_1', 'usr_emma_thompson', 'image_upload', 'image', 'img_forest_portrait', '{"title": "Forest Portrait Session"}'),
('act_sarah_follow_marcus', 'usr_sarah_chen', 'follow', 'user', 'usr_marcus_rodriguez', '{}'),
('act_marcus_follow_sarah', 'usr_marcus_rodriguez', 'follow', 'user', 'usr_sarah_chen', '{}'),
('act_sarah_edit_1', 'usr_sarah_chen', 'image_edit', 'image', 'img_sunset_beach', '{"description": "Enhanced colors and contrast"}');

-- Insert sample comments
INSERT INTO comments (comment_id, image_id, user_id, content) VALUES
('cmt_marcus_on_sunset', 'img_sunset_beach', 'usr_marcus_rodriguez', 'Amazing capture! The colors are absolutely stunning. What camera did you use?'),
('cmt_emma_on_sunset', 'img_sunset_beach', 'usr_emma_thompson', 'Beautiful composition. The rule of thirds is perfectly applied here.'),
('cmt_sarah_on_mountain', 'img_mountain_landscape', 'usr_sarah_chen', 'Wow! This makes me want to go hiking. The depth in this shot is incredible.');

-- Insert sample likes
INSERT INTO likes (user_id, target_type, target_id) VALUES
('usr_marcus_rodriguez', 'image', 'img_sunset_beach'),
('usr_emma_thompson', 'image', 'img_sunset_beach'),
('usr_demo_user', 'image', 'img_sunset_beach'),
('usr_sarah_chen', 'image', 'img_mountain_landscape'),
('usr_emma_thompson', 'image', 'img_mountain_landscape'),
('usr_sarah_chen', 'image', 'img_forest_portrait'),
('usr_marcus_rodriguez', 'image', 'img_forest_portrait'),
('usr_sarah_chen', 'comment', 'cmt_marcus_on_sunset'),
('usr_emma_thompson', 'comment', 'cmt_marcus_on_sunset');

-- Insert sample notifications
INSERT INTO notifications (user_id, type, actor_id, target_type, target_id, message) VALUES
('usr_sarah_chen', 'follow', 'usr_marcus_rodriguez', 'user', 'usr_sarah_chen', 'Marcus Rodriguez started following you'),
('usr_marcus_rodriguez', 'follow', 'usr_sarah_chen', 'user', 'usr_marcus_rodriguez', 'Sarah Chen started following you'),
('usr_sarah_chen', 'like', 'usr_marcus_rodriguez', 'image', 'img_sunset_beach', 'Marcus Rodriguez liked your image "Sunset at Beach"'),
('usr_sarah_chen', 'comment', 'usr_marcus_rodriguez', 'image', 'img_sunset_beach', 'Marcus Rodriguez commented on your image "Sunset at Beach"'),
('usr_marcus_rodriguez', 'like', 'usr_sarah_chen', 'image', 'img_mountain_landscape', 'Sarah Chen liked your image "Mountain Landscape"');

-- Refresh materialized views
REFRESH MATERIALIZED VIEW user_stats;