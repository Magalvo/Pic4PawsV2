import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import postRoutes from './routes/posts.routes.js';
import petRoutes from './routes/pets.routes.js';
import conversationRoutes from './routes/conversations.routes.js';
import messageRoutes from './routes/messages.routes.js';
import apiPetRoutes from './routes/apiPet.routes.js';
import breedRoutes from './routes/breeds.routes.js';
import { register } from './controllers/auth.js';
import { createPost } from './controllers/posts.js';
import { isAuthenticated } from './middleware/firebase.middleware.js';

import User from './models/User.model.js';
import Post from './models/Posts.model.js';
import { users, posts } from './data/index.js';

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

/* CORS CONFIGURATION */
const FRONTEND_URL = process.env.ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: [FRONTEND_URL]
  })
);

/* FILE STORAGE */
/* const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/assets');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage }); */

/* ROUTES WITH FILES */
//app.post('/auth/register', upload.single('picture'), register);
//app.post('/posts', isAuthenticated, upload.single('picture'), createPost); //verifyToken

/* ROUTES */
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/pets', petRoutes);
app.use('/conversations', conversationRoutes);
app.use('/messages', messageRoutes);
app.use('/animals', apiPetRoutes);
app.use('/breeds', breedRoutes);

/* MONGOOSE SETUP */
const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/social-paws';

const PORT = process.env.PORT || 6001;

mongoose
  .connect(MONGO_URI)
  .then(x => {
    const dbName = x.connections[0].name;
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    console.log(`Connected to Mongo! Database name: "${dbName}"`);
  })
  .catch(err => {
    console.error('Error connecting to mongo: ', err);
  });

/* User.insertMany(users);
    Post.insertMany(posts);
 */
