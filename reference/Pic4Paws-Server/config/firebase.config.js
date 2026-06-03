import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
    clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
    privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const auth = admin.auth(app);
export default auth;
