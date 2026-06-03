import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import { PassThrough } from 'stream';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const allowedMimeTypes = ['image/jpeg', 'image/png'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG images are allowed'));
    }

    return cb(null, true);
  }
});

const uploadToCloudinary = file =>
  new Promise((resolve, reject) => {
    const cloudinaryUpload = cloudinary.uploader.upload_stream(
      {
        folder: 'Pic4Paws',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    const stream = new PassThrough();
    stream.end(file.buffer);
    stream.pipe(cloudinaryUpload);
  });

const fileUploader = {
  single(fieldName) {
    return [
      upload.single(fieldName),
      async (req, res, next) => {
        if (!req.file) {
          return next();
        }

        try {
          const result = await uploadToCloudinary(req.file);
          req.file.path = result.secure_url;
          req.file.filename = result.public_id;
          return next();
        } catch (error) {
          return next(error);
        }
      }
    ];
  }
};

export default fileUploader;
