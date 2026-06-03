import express from 'express';
import Conversation from '../models/Conversation.model.js';
import User from '../models/User.model.js';
import { isAuthenticated } from '../middleware/firebase.middleware.js';
const router = express.Router();

//new conv

router.post('/', isAuthenticated, async (req, res) => {
  try {
    const senderId = req.authUserId;
    const { receiverId } = req.body;

    if (!receiverId || receiverId === senderId) {
      return res.status(400).json({ message: 'Valid receiverId is required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const existingConversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] }
    });

    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }

    const newConversation = new Conversation({
      members: [senderId, receiverId]
    });
    const savedConversation = await newConversation.save();
    res.status(201).json(savedConversation);
  } catch (error) {
    console.log('Error Sending message:', error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
});

//get conversation includes two userID

router.get('/find/:firstUserId/:secondUserId', isAuthenticated, async (req, res) => {
  try {
    const { firstUserId, secondUserId } = req.params;

    if (![firstUserId, secondUserId].includes(req.authUserId)) {
      return res.status(403).json({ message: 'You cannot read this conversation' });
    }

    const conversation = await Conversation.findOne({
      members: { $all: [firstUserId, secondUserId] }
    });
    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json(err);
    console.log('Error fetching messages:', err);
  }
});

//get user conversations list by id

router.get('/:userId', isAuthenticated, async (req, res) => {
  try {
    if (req.params.userId !== req.authUserId) {
      return res
        .status(403)
        .json({ message: 'You cannot read these conversations' });
    }

    const conversation = await Conversation.find({
      members: { $in: [req.params.userId] }
    });
    res.status(200).json(conversation);
  } catch (error) {
    console.log('Error Fetching messages:', error);
    res.status(500).json({ message: 'Error fetching conversations' });
  }
});

export default router;
