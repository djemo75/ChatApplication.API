const jwt = require('jsonwebtoken');
const authConfig = require('../configs/auth.config');

const isAuthenticated = (req, res, next) => {
  const authHeaders = req.get('Authorization');
  if (!authHeaders) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  const accessToken = req.get('Authorization').split(' ')[1];

  try {
    const tokenData = jwt.verify(accessToken, authConfig.accessTokenSecretKey);

    req.userId = tokenData.id;
    req.username = tokenData.username;
    req.email = tokenData.email;
    next();
  } catch (error) {
    let message = 'Token is invalid';
    if (error.name === 'TokenExpiredError') {
      message = 'The token has expired';
    }
    return res.status(401).json({ error });
  }
};

module.exports = isAuthenticated;
