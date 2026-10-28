const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { ApiError } = require('./errors');

const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const safeExtension = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (req, file, callback) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const extension = safeExtension[file.mimetype] || path.extname(file.originalname).toLowerCase();
    callback(null, `profile-${req.user?._id || 'user'}-${unique}${extension}`);
  }
});

const fileFilter = (_req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return callback(new ApiError(400, 'Upload a JPG, PNG, WEBP or GIF image'), false);
  }
  callback(null, true);
};

const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024, files: 1 }
}).single('profileImage');

module.exports = { uploadProfileImage, uploadsDir };
