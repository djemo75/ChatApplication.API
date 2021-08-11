const UserService = require('../services/user.service');
const MessageService = require('../services/message.service');
const BaseError = require('../models/baseError.model');

exports.getMessages = async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const pageNumber = parseInt(req.query.pageNumber - 1) || 0;

    const user = await UserService.getUserByCriteria({ id });
    if (!user) {
      throw new BaseError('There is no user with this id!', 400);
    }

    const messages = await MessageService.getMessages({
      pageSize,
      pageNumber,
      userId,
      addresseeId: id,
    });

    return res.send(messages);
  } catch (error) {
    next(error);
  }
};

exports.getLastChattedUsers = async (req, res, next) => {
  try {
    const { userId } = req;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const pageNumber = parseInt(req.query.pageNumber - 1) || 0;

    const users = await MessageService.getLastChattedUsers({
      pageSize,
      pageNumber,
      userId,
    });

    return res.send(users);
  } catch (error) {
    next(error);
  }
};

exports.createMessage = async (req, res, next) => {
  try {
    const { userId } = req;
    const { id } = req.params;
    const { messageType, content } = req.body;

    const user = await UserService.getUserByCriteria({ id });
    if (!user) {
      throw new BaseError('There is no user with this id!', 400);
    }

    if (!['text', 'voice', 'image'].includes(messageType)) {
      throw new BaseError('Please provide correct message type!', 400);
    }

    if (messageType === 'text' && !content) {
      throw new BaseError('Please provide content!', 400);
    }

    const message = {
      messageType,
      content,
      requesterId: userId,
      addresseeId: id,
    };

    const result = await MessageService.createMessage(message);

    return res.send(result);
  } catch (error) {
    next(error);
  }
};
