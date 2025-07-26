// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { statusCode: 404, message };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { statusCode: 400, message };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { statusCode: 400, message };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { statusCode: 401, message };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { statusCode: 401, message };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { statusCode: 413, message };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { statusCode: 400, message };
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    const message = 'Duplicate entry for unique field';
    error = { statusCode: 409, message };
  }

  if (err.code === '23503') { // Foreign key violation
    const message = 'Referenced resource does not exist';
    error = { statusCode: 400, message };
  }

  if (err.code === '23502') { // Not null violation
    const message = 'Required field is missing';
    error = { statusCode: 400, message };
  }

  if (err.code === '23514') { // Check violation
    const message = 'Invalid field value';
    error = { statusCode: 400, message };
  }

  res.status(error.statusCode || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: error.message || 'Server Error',
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = { errorHandler };