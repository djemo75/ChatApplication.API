const UserService = require('../services/user.service');
const BaseError = require('../models/baseError.model');

exports.getUsers = async (req, res, next) => {
  try {
    const { userId } = req;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const pageNumber = parseInt(req.query.pageNumber - 1) || 0;
    const { searchString } = req.query;

    const users = await UserService.getUsers({
      pageSize,
      pageNumber,
      searchString,
      userId,
    });

    return res.send(users);
  } catch (error) {
    next(error);
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const { username } = req;

    const user = await UserService.getUserByCriteria({ username });
    if (!user) {
      throw new BaseError('There is no user with this username!', 400);
    }

    return res.send(user);
  } catch (error) {
    next(error);
  }
};

exports.getUserFriends = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req;
    const isRequestAccepted = req.query.isRequestAccepted
      ? req.query.isRequestAccepted === 'true'
      : undefined;
    const friends = await UserService.getUserFriends(id, isRequestAccepted);

    return res.send(friends);
  } catch (error) {
    next(error);
  }
};

exports.sendFriendshipRequest = async (req, res, next) => {
  try {
    const { userId } = req;
    const addresseeId = parseInt(req.params.id);

    if (userId === addresseeId) {
      throw new BaseError(
        'You cannot send friendship request to yourself!',
        400
      );
    }

    const adresseeUser = await UserService.getUserByCriteria({
      id: addresseeId,
    });
    if (!adresseeUser) {
      throw new BaseError('User not found!', 400);
    }

    // From my perspective
    const sentRequest = await UserService.getFriendship({
      requesterId: userId,
      addresseeId: addresseeId,
    });

    // From other perspective
    const receivedRequest = await UserService.getFriendship({
      requesterId: addresseeId,
      addresseeId: userId,
    });

    if (sentRequest || receivedRequest) {
      throw new BaseError('There is an invitation for friendship!', 400);
    }

    const result = await UserService.sendFriendshipRequest({
      requesterId: userId,
      addresseeId: adresseeUser.id,
    });

    return res.send(result);
  } catch (error) {
    next(error);
  }
};

exports.cancelFriendshipRequest = async (req, res, next) => {
  try {
    const { userId } = req;
    const addresseeId = req.params.id;

    // From my perspective
    const sentRequest = await UserService.getFriendship({
      requesterId: userId,
      addresseeId: addresseeId,
    });

    // From other perspective
    const receivedRequest = await UserService.getFriendship({
      requesterId: addresseeId,
      addresseeId: userId,
    });

    if (!sentRequest && !receivedRequest) {
      throw new BaseError('The friendship request not found!', 400);
    }

    if (sentRequest) {
      await UserService.cancelFriendshipRequest({
        requesterId: userId,
        addresseeId: addresseeId,
      });

      // { message: 'You have removed the friendship request.' }
      return res.send();
    }

    if (receivedRequest) {
      await UserService.cancelFriendshipRequest({
        requesterId: addresseeId,
        addresseeId: userId,
      });

      // { message: 'You have declined the friend request.' }
      return res.send();
    }
  } catch (error) {
    next(error);
  }
};

exports.acceptFriendshipRequest = async (req, res, next) => {
  try {
    const { userId } = req;
    const addresseeId = req.params.id;

    const adresseeUser = await UserService.getUserByCriteria({
      id: addresseeId,
    });
    if (!adresseeUser) {
      throw new BaseError('User not found!', 400);
    }

    const friendship = await UserService.getFriendship({
      requesterId: adresseeUser.id,
      addresseeId: userId,
    });
    if (!friendship) {
      throw new BaseError('The friendship request not found!', 400);
    }

    if (friendship.isRequestAccepted === true) {
      throw new BaseError('You have already accepted the friend request!', 400);
    }

    friendship.isRequestAccepted = true;
    await friendship.save();

    return res.send({ message: 'The friendship request accepted!' });
  } catch (error) {
    next(error);
  }
};

exports.getFriendship = async (req, res, next) => {
  try {
    const { userId } = req;
    const addresseeId = req.params.friendId;

    const friendship = await UserService.getFriendship({
      requesterId: userId,
      addresseeId,
    });
    if (!friendship) {
      throw new BaseError('The friendship not found!', 400);
    }

    return res.send(friendship);
  } catch (error) {
    next(error);
  }
};
