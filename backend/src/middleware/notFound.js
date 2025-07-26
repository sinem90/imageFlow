// 404 Not Found middleware
const notFound = (req, res, next) => {
  res.status(404).json({
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
      method: req.method,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = { notFound };