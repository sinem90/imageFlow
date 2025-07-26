const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateProfileUpdate, validatePagination } = require('../middleware/validation');
const { query, executeQuery, executeQuerySingle } = require('../config/database');

const router = express.Router();

// GET /api/v1/users/:username - Get user profile
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await executeQuerySingle(`
      SELECT u.*, us.image_count, us.follower_count, us.following_count, us.total_views
      FROM users u
      LEFT JOIN user_stats us ON u.user_id = us.user_id
      WHERE u.username = $1 AND u.is_active = true
    `, [username]);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if current user follows this user
    let isFollowing = false;
    let isFollower = false;
    if (req.user) {
      const relationship = await executeQuerySingle(`
        SELECT 
          CASE WHEN follower_id = $1 AND following_id = $2 THEN true ELSE false END as is_following,
          CASE WHEN follower_id = $2 AND following_id = $1 THEN true ELSE false END as is_follower
        FROM follows
        WHERE (follower_id = $1 AND following_id = $2) OR (follower_id = $2 AND following_id = $1)
      `, [req.user.user_id, user.user_id]);
      
      if (relationship) {
        isFollowing = relationship.is_following;
        isFollower = relationship.is_follower;
      }
    }

    const profile = {
      userId: user.user_id,
      username: user.username,
      displayName: user.display_name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      stats: {
        imageCount: user.image_count || 0,
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
        totalViews: user.total_views || 0
      },
      relationship: req.user ? {
        isFollowing,
        isFollower,
        isSelf: req.user.user_id === user.user_id
      } : null
    };

    res.json({ user: profile });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to retrieve user profile',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// PUT /api/v1/users/profile - Update current user's profile
router.put('/profile', authenticate, validateProfileUpdate, async (req, res) => {
  try {
    const updates = {};
    const { displayName, bio, settings } = req.body;

    if (displayName !== undefined) updates.display_name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (settings !== undefined) updates.settings = JSON.stringify(settings);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_UPDATES',
          message: 'No valid fields provided for update',
          timestamp: new Date().toISOString()
        }
      });
    }

    updates.updated_at = new Date();

    const user = await query('users')
      .where('user_id', req.user.user_id)
      .update(updates);

    if (!user || user.length === 0) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    const updatedUser = user[0];

    res.json({
      user: {
        userId: updatedUser.user_id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.display_name,
        bio: updatedUser.bio,
        avatarUrl: updatedUser.avatar_url,
        settings: updatedUser.settings
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update profile',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;