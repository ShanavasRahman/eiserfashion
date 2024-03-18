const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const imageProcessingMiddleware = async (req, res, next) => {
  if (!req.files) {
    return next();
  }

  try {
    const areAllFilesImages = await Promise.all(
      req.files.map(async (file) => {
        const isImage = await isImageFile(file.buffer);

        if (!isImage) {
          throw new Error('All files must be image files.');
        }

        const buffer = await sharp(file.buffer)
          .resize({ width: 300, height: 300 })
          .toBuffer();

        return { buffer, originalname: file.originalname };
      })
    );

    const savedImages = await Promise.all(
      areAllFilesImages.map(async (image) => {
        const filename = `${Date.now()}-${image.originalname}`;
        const imagePath = path.join(__dirname, '..', 'public', 'product', filename);
        await sharp(image.buffer).toFile(imagePath);
        return `/public/product/${filename}`;
      })
    );

    req.processedImages = savedImages;
    next();
  } catch (err) {
    console.error(err);

    // Handle the error using Swal.fire for a user-friendly notification
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: err.message,
    });

    // Pass the error to the next middleware/handler
    next(err);
  }
};

// Helper function to check if a buffer is an image file using 'sharp'
const isImageFile = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!metadata.format;
  } catch (error) {
    console.error('Error checking if file is an image:', error);
    return false;
  }
};





module.exports = { upload, imageProcessingMiddleware };
    
