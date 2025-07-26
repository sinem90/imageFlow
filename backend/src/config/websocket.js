const jwt = require('jsonwebtoken');
const { executeQuerySingle } = require('./database');

// Store active connections
const activeConnections = new Map();
const editingSessions = new Map();

const setupWebSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await executeQuerySingle(
        'SELECT user_id, username, display_name, avatar_url FROM users WHERE user_id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.user.username} connected`);
    
    // Store connection
    activeConnections.set(socket.user.user_id, {
      socket,
      user: socket.user,
      connectedAt: new Date()
    });

    // Handle joining edit sessions
    socket.on('join_edit_session', async (data) => {
      try {
        const { sessionId } = data;
        
        // Verify session exists and user has permission
        const session = await executeQuerySingle(`
          SELECT es.*, sp.permissions 
          FROM edit_sessions es
          LEFT JOIN session_participants sp ON es.session_id = sp.session_id AND sp.user_id = $2
          WHERE es.session_id = $1 AND es.is_active = true AND es.expires_at > NOW()
        `, [sessionId, socket.user.user_id]);

        if (!session) {
          socket.emit('error', { message: 'Session not found or expired' });
          return;
        }

        // Check if user is owner or participant
        const isOwner = session.owner_id === socket.user.user_id;
        if (!isOwner && !session.permissions) {
          socket.emit('error', { message: 'Permission denied' });
          return;
        }

        // Join the session room
        socket.join(sessionId);
        
        // Add to editing sessions
        if (!editingSessions.has(sessionId)) {
          editingSessions.set(sessionId, {
            participants: new Map(),
            cursors: new Map(),
            operations: []
          });
        }

        const sessionData = editingSessions.get(sessionId);
        sessionData.participants.set(socket.user.user_id, {
          user: socket.user,
          socket,
          joinedAt: new Date(),
          cursor: { x: 0, y: 0 }
        });

        // Assign cursor color
        const cursorColors = ['#FF6B35', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'];
        const colorIndex = sessionData.participants.size % cursorColors.length;
        const cursorColor = cursorColors[colorIndex];

        // Update database
        await executeQuerySingle(`
          INSERT INTO session_participants (session_id, user_id, cursor_color)
          VALUES ($1, $2, $3)
          ON CONFLICT (session_id, user_id) 
          DO UPDATE SET last_active_at = CURRENT_TIMESTAMP, cursor_color = $3
        `, [sessionId, socket.user.user_id, cursorColor]);

        // Notify all participants
        const participants = Array.from(sessionData.participants.values()).map(p => ({
          userId: p.user.user_id,
          username: p.user.username,
          displayName: p.user.display_name,
          cursorColor,
          isOwner: p.user.user_id === session.owner_id
        }));

        socket.emit('session_joined', {
          sessionId,
          participants,
          cursorColor
        });

        socket.to(sessionId).emit('participant_joined', {
          participant: {
            userId: socket.user.user_id,
            username: socket.user.username,
            displayName: socket.user.display_name,
            cursorColor,
            isOwner: socket.user.user_id === session.owner_id
          }
        });

        console.log(`👥 User ${socket.user.username} joined edit session ${sessionId}`);

      } catch (error) {
        console.error('Error joining edit session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Handle cursor movement
    socket.on('cursor_move', (data) => {
      const { sessionId, position, tool } = data;
      
      if (editingSessions.has(sessionId)) {
        const sessionData = editingSessions.get(sessionId);
        const participant = sessionData.participants.get(socket.user.user_id);
        
        if (participant) {
          participant.cursor = { ...position, tool };
          
          socket.to(sessionId).emit('cursor_update', {
            userId: socket.user.user_id,
            position,
            tool
          });
        }
      }
    });

    // Handle canvas operations
    socket.on('canvas_operation', async (data) => {
      try {
        const { sessionId, operation, revision } = data;
        
        if (!editingSessions.has(sessionId)) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const sessionData = editingSessions.get(sessionId);
        
        // Add operation ID and timestamp
        const processedOperation = {
          ...operation,
          id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: socket.user.user_id,
          timestamp: new Date().toISOString(),
          revision
        };

        // Store operation
        sessionData.operations.push(processedOperation);

        // Broadcast to all participants in the session
        socket.to(sessionId).emit('operation_received', {
          operation: processedOperation
        });

        // Acknowledge to sender
        socket.emit('operation_acknowledged', {
          operationId: processedOperation.id
        });

        console.log(`🎨 Canvas operation by ${socket.user.username} in session ${sessionId}`);

      } catch (error) {
        console.error('Error processing canvas operation:', error);
        socket.emit('error', { message: 'Failed to process operation' });
      }
    });

    // Handle leaving edit session
    socket.on('leave_edit_session', (data) => {
      const { sessionId } = data;
      leaveEditSession(socket, sessionId);
    });

    // Handle notifications subscription
    socket.on('subscribe_notifications', () => {
      socket.join(`notifications_${socket.user.user_id}`);
      console.log(`🔔 User ${socket.user.username} subscribed to notifications`);
    });

    // Handle activity feed subscription
    socket.on('subscribe_activity_feed', () => {
      socket.join(`activity_${socket.user.user_id}`);
      console.log(`📰 User ${socket.user.username} subscribed to activity feed`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.user.username} disconnected`);
      
      // Remove from active connections
      activeConnections.delete(socket.user.user_id);
      
      // Leave all edit sessions
      for (const [sessionId, sessionData] of editingSessions.entries()) {
        if (sessionData.participants.has(socket.user.user_id)) {
          leaveEditSession(socket, sessionId);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for user ${socket.user.username}:`, error);
    });
  });

  // Helper function to leave edit session
  function leaveEditSession(socket, sessionId) {
    if (editingSessions.has(sessionId)) {
      const sessionData = editingSessions.get(sessionId);
      sessionData.participants.delete(socket.user.user_id);
      
      socket.leave(sessionId);
      socket.to(sessionId).emit('participant_left', {
        userId: socket.user.user_id
      });

      // Clean up empty sessions
      if (sessionData.participants.size === 0) {
        editingSessions.delete(sessionId);
        console.log(`🗑️ Cleaned up empty session ${sessionId}`);
      }

      console.log(`👋 User ${socket.user.username} left edit session ${sessionId}`);
    }
  }

  // Utility functions for sending notifications
  const sendNotificationToUser = (userId, notification) => {
    io.to(`notifications_${userId}`).emit('notification', notification);
  };

  const sendActivityUpdate = (userId, activity) => {
    io.to(`activity_${userId}`).emit('activity_update', activity);
  };

  const broadcastToFollowers = (userId, data) => {
    // This would require querying followers and sending to each
    // Implementation depends on followers query
  };

  return {
    sendNotificationToUser,
    sendActivityUpdate,
    broadcastToFollowers,
    getActiveConnections: () => activeConnections,
    getEditingSessions: () => editingSessions
  };
};

module.exports = { setupWebSocket };