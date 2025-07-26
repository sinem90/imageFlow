const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query, executeQuery, executeQuerySingle, transaction } = require('../config/database');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Hash refresh token for storage
const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// POST /api/v1/auth/register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if username or email already exists
    const existingUser = await executeQuerySingle(`
      SELECT user_id, username, email FROM users 
      WHERE username = $1 OR email = $2
    `, [username, email]);

    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      return res.status(409).json({
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: `A user with this ${field} already exists`,
          field,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await transaction(async (client) => {
      const newUser = await client.query(`
        INSERT INTO users (username, email, password_hash, display_name)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id, username, email, display_name, avatar_url, created_at
      `, [username, email, passwordHash, displayName]);

      // Create initial user stats entry
      await client.query(`
        INSERT INTO user_stats (user_id, image_count, follower_count, following_count, total_views)
        VALUES ($1, 0, 0, 0, 0)
      `, [newUser.rows[0].user_id]);

      return newUser.rows[0];
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    // Store refresh token
    const hashedRefreshToken = hashRefreshToken(refreshToken);
    const deviceInfo = req.body.deviceInfo || {};
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await executeQuery(`
      INSERT INTO user_sessions (user_id, refresh_token_hash, device_info, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [user.user_id, hashedRefreshToken, JSON.stringify(deviceInfo), req.ip, expiresAt]);

    // Remove sensitive data from response
    delete user.password_hash;

    res.status(201).json({
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        followerCount: 0,
        followingCount: 0,
        emailVerified: false
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hour in seconds
      },
      verificationRequired: true
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        code: 'REGISTRATION_ERROR',
        message: 'Failed to create user account',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password, deviceInfo = {} } = req.body;

    // Find user by username or email
    const user = await executeQuerySingle(`
      SELECT u.*, us.image_count, us.follower_count, us.following_count
      FROM users u
      LEFT JOIN user_stats us ON u.user_id = us.user_id
      WHERE (u.username = $1 OR u.email = $1) AND u.is_active = true
    `, [username]);

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    // Store refresh token
    const hashedRefreshToken = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await executeQuery(`
      INSERT INTO user_sessions (user_id, refresh_token_hash, device_info, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [user.user_id, hashedRefreshToken, JSON.stringify(deviceInfo), req.ip, expiresAt]);

    // Update last login
    await executeQuery(`
      UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1
    `, [user.user_id]);

    // Remove sensitive data from response
    delete user.password_hash;

    res.json({
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        createdAt: user.created_at,
        lastLoginAt: new Date().toISOString(),
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
        imageCount: user.image_count || 0,
        emailVerified: user.email_verified,
        settings: user.settings
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 3600 // 1 hour in seconds
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'LOGIN_ERROR',
        message: 'Login failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if refresh token exists in database
    const hashedRefreshToken = hashRefreshToken(refreshToken);
    const session = await executeQuerySingle(`
      SELECT s.*, u.username, u.email, u.display_name, u.avatar_url, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.refresh_token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP
    `, [hashedRefreshToken]);

    if (!session || !session.is_active) {
      return res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Session has expired or user is inactive',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(session.user_id);

    // Update refresh token in database (token rotation)
    const newHashedRefreshToken = hashRefreshToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await executeQuery(`
      UPDATE user_sessions 
      SET refresh_token_hash = $1, expires_at = $2, last_active_at = CURRENT_TIMESTAMP
      WHERE session_id = $3
    `, [newHashedRefreshToken, newExpiresAt, session.session_id]);

    res.json({
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600 // 1 hour in seconds
      },
      user: {
        userId: session.user_id,
        username: session.username,
        email: session.email,
        displayName: session.display_name,
        avatarUrl: session.avatar_url
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: {
        code: 'REFRESH_ERROR',
        message: 'Failed to refresh token',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove specific session
      const hashedRefreshToken = hashRefreshToken(refreshToken);
      await executeQuery(`
        DELETE FROM user_sessions 
        WHERE user_id = $1 AND refresh_token_hash = $2
      `, [req.user.user_id, hashedRefreshToken]);
    } else {
      // Remove all sessions for user (logout from all devices)
      await executeQuery(`
        DELETE FROM user_sessions WHERE user_id = $1
      `, [req.user.user_id]);
    }

    res.json({
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        code: 'LOGOUT_ERROR',
        message: 'Failed to logout',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// GET /api/v1/auth/verify
router.get('/verify', authenticate, async (req, res) => {
  try {
    // Get fresh user data with stats
    const user = await executeQuerySingle(`
      SELECT u.*, us.image_count, us.follower_count, us.following_count, us.total_views
      FROM users u
      LEFT JOIN user_stats us ON u.user_id = us.user_id
      WHERE u.user_id = $1
    `, [req.user.user_id]);

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    res.json({
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at,
        followerCount: user.follower_count || 0,
        followingCount: user.following_count || 0,
        imageCount: user.image_count || 0,
        totalViews: user.total_views || 0,
        emailVerified: user.email_verified,
        settings: user.settings
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: {
        code: 'VERIFICATION_ERROR',
        message: 'Failed to verify token',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: {
          code: 'EMAIL_REQUIRED',
          message: 'Email address is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const user = await executeQuerySingle(`
      SELECT user_id, email FROM users WHERE email = $1 AND is_active = true
    `, [email]);

    // Always return success to prevent email enumeration
    if (user) {
      // In a real application, you would:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send email with reset link
      console.log(`Password reset requested for user: ${user.user_id}`);
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: {
        code: 'FORGOT_PASSWORD_ERROR',
        message: 'Failed to process password reset request',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// GET /api/v1/auth/sessions
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await executeQuery(`
      SELECT session_id, device_info, ip_address, created_at, last_active_at, expires_at
      FROM user_sessions 
      WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
      ORDER BY last_active_at DESC
    `, [req.user.user_id]);

    res.json({
      sessions: sessions.map(session => ({
        sessionId: session.session_id,
        deviceInfo: session.device_info,
        ipAddress: session.ip_address,
        createdAt: session.created_at,
        lastActiveAt: session.last_active_at,
        expiresAt: session.expires_at,
        isCurrent: req.sessionId === session.session_id // Would need to track this
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      error: {
        code: 'SESSIONS_ERROR',
        message: 'Failed to retrieve sessions',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;