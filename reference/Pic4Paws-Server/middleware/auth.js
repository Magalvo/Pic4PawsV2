import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res, next) => {
  try {
    let authToken = req.header('Authorization');

    if (!authToken) {
      return res.status(403).send('Access Denied');
    }

    if (authToken.startsWith('Bearer ')) {
      authToken = authToken.slice(7, authToken.length).trimLeft();
    }

    const verified = jwt.verify(authToken, process.env.JWT_SECRET);

    req.user = verified;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message }, next(error));
  }
};
