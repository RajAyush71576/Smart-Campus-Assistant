const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'smart-campus/misc';
    let resource_type = 'auto';

    if (file.mimetype === 'application/pdf') {
      folder = 'smart-campus/assignments';
      resource_type = 'raw';
    } else if (file.mimetype.startsWith('image/')) {
      folder = 'smart-campus/images';
      resource_type = 'image';
    }

    return {
      folder,
      resource_type,
      allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'],
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '-').replace(/\.[^/.]+$/, '')}`,
    };
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

module.exports = { cloudinary, upload };
