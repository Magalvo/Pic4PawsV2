const dotenv = require('dotenv');
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config();

const PORT = process.env.PORT || 8900;
const FRONTEND_URL = process.env.FRONT_END_URL || 'http://localhost:3000';
const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social-paws';

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
    clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
    privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const User = mongoose.model(
  'User',
  new mongoose.Schema(
    {
      email: String
    },
    { collection: 'users' }
  )
);

const Conversation = mongoose.model(
  'Conversation',
  new mongoose.Schema(
    {
      members: [String]
    },
    { collection: 'conversations' }
  )
);

const onlineUsers = new Map();

const getOnlineUsers = () =>
  Array.from(onlineUsers.entries()).map(([userId, socketId]) => ({
    userId,
    socketId
  }));

const resolveAuthenticatedUser = async token => {
  const decodedToken = await admin.auth(firebaseApp).verifyIdToken(token);
  const authUser =
    (await User.findById(decodedToken.uid).catch(() => null)) ||
    (decodedToken.email
      ? await User.findOne({ email: decodedToken.email.toLowerCase() })
      : null);

  if (!authUser) {
    throw new Error('Authenticated user not found');
  }

  return authUser._id.toString();
};

mongoose
  .connect(MONGO_URI)
  .then(() => {
    const io = new Server(PORT, {
      cors: {
        origin: FRONTEND_URL
      }
    });

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        socket.userId = await resolveAuthenticatedUser(token);
        return next();
      } catch {
        return next(new Error('Invalid authentication token'));
      }
    });

    io.on('connection', socket => {
      onlineUsers.set(socket.userId, socket.id);
      io.emit('getUsers', getOnlineUsers());

      socket.on(
        'sendMessage',
        async ({ senderId, receiverId, conversationId, text }) => {
          if (senderId !== socket.userId || !receiverId || !conversationId) {
            return;
          }

          const conversation = await Conversation.findById(conversationId);
          const isParticipant =
            conversation?.members.includes(senderId) &&
            conversation?.members.includes(receiverId);

          if (!isParticipant) {
            return;
          }

          const receiverSocketId = onlineUsers.get(receiverId);

          if (receiverSocketId) {
            io.to(receiverSocketId).emit('getMessage', {
              senderId,
              conversationId,
              text
            });
          }
        }
      );

      socket.on('disconnect', () => {
        if (onlineUsers.get(socket.userId) === socket.id) {
          onlineUsers.delete(socket.userId);
        }

        io.emit('getUsers', getOnlineUsers());
      });
    });

    console.log(`Socket server listening on port ${PORT}`);
  })
  .catch(error => {
    console.error('Error connecting socket server to Mongo:', error);
    process.exit(1);
  });
