import express from 'express';

import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  findByEmail,
  updateUser
} from '../controllers/users.js';

import { isAuthenticated } from '../middleware/firebase.middleware.js';

const router = express.Router();

/* Read */
/* /user/{...} */
router.get('/:userId', isAuthenticated, getUser);
router.get('/:userId/friends', isAuthenticated, getUserFriends);
router.get('/', isAuthenticated, findByEmail);

/* Update */
router.put('/:userId', isAuthenticated, updateUser);
router.patch('/:id/:friendId', isAuthenticated, addRemoveFriend);

export default router;
