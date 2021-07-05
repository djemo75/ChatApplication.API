const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const BaseError = require('../models/baseError.model');
const authConfig = require('../configs/auth.config');
const UserService = require('../services/user.service');

exports.register = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    const usernameCheck = await UserService.getUserByCriteria({ username });
    if (usernameCheck) {
      throw new BaseError('Username exists', 400);
    }

    const emailCheck = await UserService.getUserByCriteria({ email });
    if (emailCheck) {
      throw new BaseError('Email exists', 400);
    }

    if (!password) {
      throw new BaseError('Password is required', 400);
    }

    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.PASSWORD_SECRET_KEY
    ).toString();
    await UserService.createUser({
      username,
      email,
      password: encryptedPassword,
    });

    return res.send({ message: 'User was registered successfully!' });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const user = await UserService.getUserByCriteria({ username });
    if (!user) {
      throw new BaseError('There is no user with this username!', 400);
    }

    const decryptedPassword = CryptoJS.AES.decrypt(
      user.password,
      authConfig.passwordSecretKey
    ).toString(CryptoJS.enc.Utf8);

    if (decryptedPassword !== password) {
      throw new BaseError('The password is wrong!', 400);
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    const accessToken = jwt.sign(
      tokenPayload,
      authConfig.accessTokenSecretKey,
      {
        expiresIn: authConfig.accessTokenLifeTime,
      }
    );
    const refreshToken = jwt.sign(
      tokenPayload,
      authConfig.refreshTokenSecretKey,
      {
        expiresIn: authConfig.refreshTokenLifeTime,
      }
    );

    user.refreshToken = refreshToken;
    await user.save();

    const response = {
      message: 'User successfully logged in!',
      accessToken,
      refreshToken,
    };

    return res.send(response);
  } catch (error) {
    next(error);
  }
};

exports.getNewRefreshToken = async (req, res, next) => {
  const currentRefreshToken = req.body.refreshToken;

  try {
    if (!currentRefreshToken) {
      throw new BaseError('Provide refresh token', 400);
    }

    // Find user by refresh token
    const user = await UserService.getUserByCriteria({
      refreshToken: currentRefreshToken,
    });
    if (!user) {
      throw new BaseError('Refresh token is invalid', 400);
    }

    // Check token
    jwt.verify(currentRefreshToken, authConfig.refreshTokenSecretKey);

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    // Generate new tokens
    const accessToken = jwt.sign(
      tokenPayload,
      authConfig.accessTokenSecretKey,
      {
        expiresIn: authConfig.accessTokenLifeTime,
      }
    );
    const refreshToken = jwt.sign(
      tokenPayload,
      authConfig.refreshTokenSecretKey,
      {
        expiresIn: authConfig.refreshTokenLifeTime,
      }
    );

    // Save the new refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    const response = { accessToken, refreshToken };

    return res.send(response);
  } catch (error) {
    next(error);
  }
};
