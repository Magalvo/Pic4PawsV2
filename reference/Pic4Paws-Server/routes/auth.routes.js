import express from 'express';
import { google, login, UploadPic, register } from '../controllers/auth.js';
import fileUploader from '../config/cloudinary.config.js';
const router = express.Router();

router.post('/login', login);

router.post('/register', register);

router.post('/signup-google', google);

router.post('/upload', fileUploader.single('file'), UploadPic);

export default router;
