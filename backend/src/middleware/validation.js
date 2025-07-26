const Joi = require('joi');

// Generic validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

// Validation schemas
const schemas = {
  // User registration
  register: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.alphanum': 'Username can only contain letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 50 characters'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      }),
    displayName: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Display name is required',
        'string.max': 'Display name cannot exceed 100 characters'
      })
  }),

  // User login
  login: Joi.object({
    username: Joi.string()
      .required()
      .messages({
        'any.required': 'Username or email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      }),
    deviceInfo: Joi.object({
      userAgent: Joi.string().optional(),
      timezone: Joi.string().optional(),
      platform: Joi.string().optional()
    }).optional()
  }),

  // Image upload metadata
  imageUpload: Joi.object({
    title: Joi.string()
      .min(1)
      .max(255)
      .required()
      .messages({
        'string.min': 'Image title is required',
        'string.max': 'Title cannot exceed 255 characters'
      }),
    description: Joi.string()
      .max(2000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Description cannot exceed 2000 characters'
      }),
    tags: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(20)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 20 tags',
        'string.max': 'Each tag cannot exceed 50 characters'
      }),
    privacy: Joi.string()
      .valid('public', 'followers', 'private')
      .default('public')
      .messages({
        'any.only': 'Privacy level must be public, followers, or private'
      })
  }),

  // Profile update
  profileUpdate: Joi.object({
    displayName: Joi.string()
      .min(1)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Display name cannot be empty',
        'string.max': 'Display name cannot exceed 100 characters'
      }),
    bio: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Bio cannot exceed 500 characters'
      }),
    settings: Joi.object().optional()
  }),

  // Comment creation
  createComment: Joi.object({
    content: Joi.string()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Comment cannot be empty',
        'string.max': 'Comment cannot exceed 1000 characters'
      }),
    coordinates: Joi.object({
      x: Joi.number().min(0).required(),
      y: Joi.number().min(0).required()
    }).optional()
  }),

  // Edit session creation
  createEditSession: Joi.object({
    editType: Joi.string()
      .valid('solo', 'collaborative')
      .default('solo')
      .messages({
        'any.only': 'Edit type must be solo or collaborative'
      }),
    invitedUsers: Joi.array()
      .items(Joi.string())
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot invite more than 10 users'
      }),
    permissions: Joi.object({
      allowDownload: Joi.boolean().default(true),
      allowFork: Joi.boolean().default(true),
      expiresIn: Joi.number().min(300).max(86400).default(3600) // 5 minutes to 24 hours
    }).optional()
  }),

  // Search query
  search: Joi.object({
    q: Joi.string()
      .min(1)
      .max(200)
      .optional()
      .messages({
        'string.min': 'Search query cannot be empty',
        'string.max': 'Search query cannot exceed 200 characters'
      }),
    tags: Joi.alternatives()
      .try(
        Joi.string(),
        Joi.array().items(Joi.string())
      )
      .optional(),
    user: Joi.string().optional(),
    color: Joi.string().optional(),
    sort: Joi.string()
      .valid('relevance', 'date', 'views', 'likes')
      .default('relevance')
      .messages({
        'any.only': 'Sort must be relevance, date, views, or likes'
      }),
    limit: Joi.number()
      .min(1)
      .max(50)
      .default(20)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
      }),
    offset: Joi.number()
      .min(0)
      .default(0)
      .messages({
        'number.min': 'Offset cannot be negative'
      })
  }),

  // Canvas operation
  canvasOperation: Joi.object({
    operation: Joi.object({
      type: Joi.string()
        .valid('stroke', 'erase', 'fill', 'transform', 'filter', 'layer')
        .required(),
      layerId: Joi.string().required(),
      data: Joi.object().required()
    }).required(),
    revision: Joi.number().required()
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number()
      .min(1)
      .default(1)
      .messages({
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
  })
};

// Validation middleware exports
const validateRegistration = validate(schemas.register);
const validateLogin = validate(schemas.login);
const validateImageUpload = validate(schemas.imageUpload);
const validateProfileUpdate = validate(schemas.profileUpdate);
const validateComment = validate(schemas.createComment);
const validateEditSession = validate(schemas.createEditSession);
const validateSearch = validate(schemas.search, 'query');
const validateCanvasOperation = validate(schemas.canvasOperation);
const validatePagination = validate(schemas.pagination, 'query');

module.exports = {
  validate,
  schemas,
  validateRegistration,
  validateLogin,
  validateImageUpload,
  validateProfileUpdate,
  validateComment,
  validateEditSession,
  validateSearch,
  validateCanvasOperation,
  validatePagination
};