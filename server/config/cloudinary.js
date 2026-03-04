const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('stream');

require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store file in memory first, then stream to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = 'fyp-uploads') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };