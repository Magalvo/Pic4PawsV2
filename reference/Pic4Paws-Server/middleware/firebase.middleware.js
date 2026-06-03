import auth from '../config/firebase.config.js';
import User from '../models/User.model.js';

export async function isAuthenticated(req, res, next) {
  const [scheme, token] = req.headers.authorization?.split(' ') || [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    const authUser =
      (await User.findById(decodedToken.uid).catch(() => null)) ||
      (decodedToken.email
        ? await User.findOne({ email: decodedToken.email.toLowerCase() })
        : null);

    if (!authUser) {
      return res.status(401).json({ message: 'Authenticated user not found' });
    }

    req.user = decodedToken;
    req.authUser = authUser;
    req.authUserId = authUser._id.toString();
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
}
