import express from 'express';
import Message from '../models/Message.model.js';
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    
  } catch (error) {
    console.log('apiPets:', error);
  }
});

export default router;
