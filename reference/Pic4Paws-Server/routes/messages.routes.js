import express from 'express';
import Message from '../models/Message.model.js';
import Conversation from '../models/Conversation.model.js';
import { isAuthenticated } from '../middleware/firebase.middleware.js';
const router = express.Router();

//Add

router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.conversationId || !message?.text?.trim()) {
      return res
        .status(400)
        .json({ message: 'conversationId and text are required' });
    }

    const conversation = await Conversation.findById(message.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.members.includes(req.authUserId)) {
      return res.status(403).json({ message: 'You cannot write to this conversation' });
    }

    const newMessage = new Message({
      sender: req.authUserId,
      text: message.text.trim(),
      conversationId: message.conversationId
    });
    const savedMessage = await newMessage.save();
    res.status(200).json(savedMessage);
  } catch (error) {
    console.log('Error Saving Message:', error);
    res.status(500).json({ message: 'Error saving message' });
  }
});

//get

router.get('/:conversationId', isAuthenticated, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.members.includes(req.authUserId)) {
      return res.status(403).json({ message: 'You cannot read this conversation' });
    }

    const messages = await Message.find({
      conversationId: req.params.conversationId
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log('Error getting Messages:', error);
    res.status(500).json({ message: 'Error getting messages' });
  }
});

export default router;
