import express from 'express';
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  likePost,
  commentPost
} from '../controllers/posts.js';
//import { verifyToken } from '../middleware/auth.js';
import { isAuthenticated } from '../middleware//firebase.middleware.js';
import fileUploader from '../config/cloudinary.config.js';
import { UploadPic } from '../controllers/auth.js';

const router = express.Router();

/* READ */
/* {/posts/{...}} */
router.get('/', isAuthenticated, getFeedPosts);

router.get('/:userId', isAuthenticated, getUserPosts);

/* UPLOAD && CREATE POST */
router.post('/upload', isAuthenticated, fileUploader.single('file'), UploadPic);
router.post('/create', isAuthenticated, createPost);

/* UPDATE */
router.patch('/:id/like', isAuthenticated, likePost);

router.post('/:id/comment', isAuthenticated, commentPost);

export default router;
