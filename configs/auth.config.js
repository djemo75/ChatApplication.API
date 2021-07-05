require('dotenv').config();

module.exports = {
  secret: process.env.SECRET_KEY,
  passwordSecretKey: process.env.PASSWORD_SECRET_KEY,
  accessTokenSecretKey: process.env.ACCESS_TOKEN_SECRET_KEY,
  refreshTokenSecretKey: process.env.REFRESH_TOKEN_SECRET_KEY,
  accessTokenLifeTime: '1h',
  refreshTokenLifeTime: '7d',
};
