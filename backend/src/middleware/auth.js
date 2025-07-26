const jwt = require('jsonwebtoken');
const { executeQuerySingle } = require('../config/database');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user from database to ensure they still exist and are active
      const user = await executeQuerySingle(`
        SELECT user_id, username, email, display_name, avatar_url, is_active, email_verified
        FROM users 
        WHERE user_id = $1
      `, [decoded.userId]);

      if (!user) {
        return res.status(401).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User associated with token not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          error: {
            code: 'ACCOUNT_DEACTIVATED',
            message: 'User account has been deactivated',
            timestamp: new Date().toISOString()
          }
        });
      }

      // Attach user to request object
      req.user = user;
      next();

    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
            timestamp: new Date().toISOString()
          }
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        throw jwtError;
      }
    }

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await executeQuerySingle(`
      SELECT user_id, username, email, display_name, avatar_url, is_active, email_verified
      FROM users 
      WHERE user_id = $1 AND is_active = true
    `, [decoded.userId]);

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};

// Email verification required middleware
const requireEmailVerification = (req, res, next) => {
  if (!req.user.email_verified) {
    return res.status(403).json({
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification is required to access this resource',
        timestamp: new Date().toISOString()
      }
    });
  }
  next();
};

// Admin role middleware
const requireAdmin = async (req, res, next) => {
  try {
    // Check if user has admin role (you'd need to add a roles system)
    const adminCheck = await executeQuerySingle(`
      SELECT user_id FROM users 
      WHERE user_id = $1 AND settings->>'role' = 'admin'
    `, [req.user.user_id]);

    if (!adminCheck) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Administrator privileges required',
          timestamp: new Date().toISOString()
        }
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      error: {
        code: 'PERMISSION_CHECK_ERROR',
        message: 'Failed to verify permissions',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Resource ownership middleware
const requireOwnership = (resourceParam = 'id', resourceTable = 'images', resourceField = 'image_id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceParam];
      
      const resource = await executeQuerySingle(`
        SELECT user_id FROM ${resourceTable} WHERE ${resourceField} = $1
      `, [resourceId]);

      if (!resource) {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Resource not found',
            timestamp: new Date().toISOString()
          }
        });
      }

      if (resource.user_id !== req.user.user_id) {
        return res.status(403).json({
          error: {
            code: 'RESOURCE_ACCESS_DENIED',
            message: 'You do not have permission to access this resource',
            timestamp: new Date().toISOString()
          }
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        error: {
          code: 'OWNERSHIP_CHECK_ERROR',
          message: 'Failed to verify resource ownership',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};

// Image access permission middleware (respects privacy settings)
const requireImageAccess = async (req, res, next) => {
  try {
    const imageId = req.params.imageId || req.params.id;
    
    const image = await executeQuerySingle(`
      SELECT i.*, u.username as owner_username
      FROM images i
      JOIN users u ON i.user_id = u.user_id
      WHERE i.image_id = $1 AND i.is_deleted = false
    `, [imageId]);

    if (!image) {
      return res.status(404).json({
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check access permissions
    let hasAccess = false;

    if (image.privacy_level === 'public') {
      hasAccess = true;
    } else if (req.user) {
      if (image.user_id === req.user.user_id) {
        // Owner always has access
        hasAccess = true;
      } else if (image.privacy_level === 'followers') {
        // Check if user follows the image owner
        const followCheck = await executeQuerySingle(`
          SELECT 1 FROM follows 
          WHERE follower_id = $1 AND following_id = $2
        `, [req.user.user_id, image.user_id]);
        
        hasAccess = !!followCheck;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: {
          code: 'IMAGE_ACCESS_DENIED',
          message: 'You do not have permission to access this image',
          timestamp: new Date().toISOString()
        }
      });
    }

    req.image = image;
    next();

  } catch (error) {
    console.error('Image access check error:', error);
    return res.status(500).json({
      error: {
        code: 'ACCESS_CHECK_ERROR',
        message: 'Failed to verify image access',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Session validation for edit sessions
const requireEditSession = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    
    const session = await executeQuerySingle(`
      SELECT es.*, sp.permissions 
      FROM edit_sessions es
      LEFT JOIN session_participants sp ON es.session_id = sp.session_id AND sp.user_id = $2
      WHERE es.session_id = $1 AND es.is_active = true AND es.expires_at > NOW()
    `, [sessionId, req.user.user_id]);

    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Edit session not found or expired',
          timestamp: new Date().toISOString()
        }
      });
    }

    // Check if user is owner or participant
    const isOwner = session.owner_id === req.user.user_id;
    if (!isOwner && !session.permissions) {
      return res.status(403).json({
        error: {
          code: 'SESSION_ACCESS_DENIED',
          message: 'You do not have permission to access this edit session',
          timestamp: new Date().toISOString()
        }
      });
    }

    req.session = session;
    req.isSessionOwner = isOwner;
    next();

  } catch (error) {
    console.error('Edit session check error:', error);
    return res.status(500).json({
      error: {
        code: 'SESSION_CHECK_ERROR',
        message: 'Failed to verify edit session access',
        timestamp: new Date().toISOString()
      }
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireEmailVerification,
  requireAdmin,
  requireOwnership,
  requireImageAccess,
  requireEditSession
};