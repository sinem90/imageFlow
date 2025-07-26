const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, optionalAuth, requireImageAccess } = require('../middleware/auth');
const { validateImageUpload } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// POST /api/v1/images/upload - Upload image
router.post('/upload', authenticate, upload.single('image'), validateImageUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No image file provided',
          timestamp: new Date().toISOString()
        }
      });
    }

    const { title, description, tags, privacy } = req.body;

    // TODO: Implement image processing pipeline
    // - Generate thumbnails
    // - Extract metadata
    // - Analyze colors
    // - Create initial version

    res.status(202).json({
      message: 'Image upload initiated',
      imageId: 'temp_id',
      uploadStatus: 'processing',
      processingSteps: [
        { step: 'upload', status: 'complete' },
        { step: 'validation', status: 'complete' },
        { step: 'thumbnail', status: 'pending' },
        { step: 'analysis', status: 'pending' },
        { step: 'indexing', status: 'pending' }
      ],
      estimatedTime: 15
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      error: {
        code: 'UPLOAD_ERROR',
        message: 'Failed to upload image',
        timestamp: new Date().toISOString()
      }
    });
  }
});

// GET /api/v1/images/:imageId - Get image details
router.get('/:imageId', optionalAuth, requireImageAccess, async (req, res) => {
  try {
    // Image data is attached by requireImageAccess middleware
    const image = req.image;

    res.json({
      image: {
        imageId: image.image_id,
        title: image.title,
        description: image.description,
        ownerId: image.user_id,
        ownerUsername: image.owner_username,
        uploadedAt: image.uploaded_at,
        lastEditedAt: image.last_edited_at,
        dimensions: {
          width: image.width,
          height: image.height
        },
        fileSize: image.file_size,
        format: image.mime_type,
        privacy: image.privacy_level,
        stats: {
          views: image.view_count,
          likes: 0, // TODO: Calculate from likes table
          comments: 0 // TODO: Calculate from comments table
        },
        urls: {
          original: `/uploads/${image.storage_path}`,
          thumbnail: image.thumbnail_paths?.thumbnail || '',
          display: image.thumbnail_paths?.display || ''
        }
      }
    });

  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      error: {
        code: 'IMAGE_ERROR',
        message: 'Failed to retrieve image',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;