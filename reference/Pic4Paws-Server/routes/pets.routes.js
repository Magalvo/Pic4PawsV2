import express from 'express';

//import { verifyToken } from '../middleware/auth.js';
import { isAuthenticated } from '../middleware//firebase.middleware.js';
import fileUploader from '../config/cloudinary.config.js';
import {
  UploadImg,
  createPet,
  getPet,
  getPets,
  updatePet,
  deletePet
} from '../controllers/pets.js';

const router = express.Router();

router.post('/', isAuthenticated, createPet);

router.get('/', getPets);

router.get('/:id', isAuthenticated, getPet);

router.put('/:id', isAuthenticated, updatePet);

router.delete('/:id', isAuthenticated, deletePet);

router.post('/upload', isAuthenticated, fileUploader.single('file'), UploadImg);

export default router;
