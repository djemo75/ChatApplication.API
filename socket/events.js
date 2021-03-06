const UserService = require('../services/user.service');
const MessageService = require('../services/message.service');
const BaseError = require('../models/baseError.model');

let onlineUsers = [];

const applyEvents = (io) => {
  io.on('connection', (socket) => {
    socket.sendBuffer = [];
    const userId = Number(socket.handshake.query.userId);
    onlineUsers.push({ userId, socketId: socket.id });

    socket.on('user:setStatusToOnline', async () => {
      const user = await UserService.getUserByCriteria({ id: userId });
      user.isOnline = true;
      user.lastOnlineDate = new Date();
      await user.save();
      await sendFriendListToOnlineUsers(io, onlineUsers);
    });

    socket.on('user:fetchFriends', async () => {
      const onlineFriends = await UserService.getUserFriends(userId, true);
      await socket.emit('user:fetchFriends', onlineFriends);
    });

    socket.on('user:fetchFriendRequests', async () => {
      const requests = await UserService.getUserFriends(
        userId,
        false,
        undefined,
        false
      );
      await socket.emit('user:fetchFriendRequests', requests);
    });

    // Friendship actions
    socket.on('sendFriendRequest', async (data, callback) => {
      try {
        const addresseeId = Number(data.id);

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

        const friendship = await UserService.sendFriendshipRequest({
          requesterId: userId,
          addresseeId: adresseeUser.id,
        });

        const currentOnlineUser = onlineUsers.find(
          (onlineUser) => onlineUser.userId === addresseeId
        );
        if (currentOnlineUser) {
          await io
            .to(currentOnlineUser.socketId)
            .emit('user:setFriendshipStatus', { id: userId, friendship });

          const requests = await UserService.getUserFriends(
            addresseeId,
            false,
            undefined,
            false
          );

          await io
            .to(currentOnlineUser.socketId)
            .emit('user:fetchFriendRequests', requests);

          await socket.to(currentOnlineUser.socketId).emit('notification', {
            type: 'info',
            message: 'You have a new friend request',
          });
        }

        callback({ statusCode: 'ok' });
      } catch (error) {
        callback(error);
      }
    });

    socket.on('cancelFriendRequest', async (data, callback) => {
      try {
        const addresseeId = Number(data.id);

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
        }

        if (receivedRequest) {
          await UserService.cancelFriendshipRequest({
            requesterId: addresseeId,
            addresseeId: userId,
          });
        }

        const myRequests = await UserService.getUserFriends(
          userId,
          false,
          undefined,
          false
        );
        await socket.emit('user:fetchFriendRequests', myRequests);

        const currentOnlineUser = onlineUsers.find(
          (onlineUser) => onlineUser.userId === addresseeId
        );
        if (currentOnlineUser) {
          await io
            .to(currentOnlineUser.socketId)
            .emit('user:setFriendshipStatus', { id: userId });

          const requests = await UserService.getUserFriends(
            addresseeId,
            false,
            undefined,
            false
          );

          await io
            .to(currentOnlineUser.socketId)
            .emit('user:fetchFriendRequests', requests);
        }

        await sendFriendListToOnlineUsers(io, onlineUsers);

        callback({ statusCode: 'ok' });
      } catch (error) {
        callback(error);
      }
    });

    socket.on('acceptFriendRequest', async (data, callback) => {
      try {
        const addresseeId = Number(data.id);

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
          throw new BaseError(
            'You have already accepted the friend request!',
            400
          );
        }

        friendship.isRequestAccepted = true;
        await friendship.save();

        const myRequests = await UserService.getUserFriends(
          userId,
          false,
          undefined,
          false
        );
        await socket.emit('user:fetchFriendRequests', myRequests);

        const currentOnlineUser = onlineUsers.find(
          (onlineUser) => onlineUser.userId === addresseeId
        );
        if (currentOnlineUser) {
          await io
            .to(currentOnlineUser.socketId)
            .emit('user:setFriendshipStatus', { id: userId, friendship });

          const requests = await UserService.getUserFriends(
            addresseeId,
            false,
            undefined,
            false
          );

          await io
            .to(currentOnlineUser.socketId)
            .emit('user:fetchFriendRequests', requests);

          await socket.to(currentOnlineUser.socketId).emit('notification', {
            type: 'info',
            message: `${adresseeUser.username} accepted your friend request`,
          });
        }

        await sendFriendListToOnlineUsers(io, onlineUsers);

        callback({ statusCode: 'ok' });
      } catch (error) {
        callback(error);
      }
    });

    // Messages
    socket.on('message:create', async (data, callback) => {
      try {
        const addresseeId = Number(data.id);
        const { messageType, content, resourceId } = data;

        const user = await UserService.getUserByCriteria({ id: addresseeId });
        if (!user) {
          throw new BaseError('There is no user with this id!', 400);
        }

        if (!['text', 'audio', 'image'].includes(messageType)) {
          throw new BaseError('Please provide correct message type!', 400);
        }

        if (messageType === 'text' && !content) {
          throw new BaseError('Please provide content!', 400);
        }

        if (['image', 'audio'].includes(messageType) && !resourceId) {
          throw new BaseError('Please provide resource id!', 400);
        }

        const message = {
          messageType,
          content,
          requesterId: userId,
          addresseeId,
          resourceId,
        };

        const result = await MessageService.createMessage(message);

        const currentOnlineUser = onlineUsers.find(
          (onlineUser) => onlineUser.userId === addresseeId
        );
        if (currentOnlineUser) {
          const myProfile = await UserService.getUserByCriteria({ id: userId });
          await io
            .to(currentOnlineUser.socketId)
            .emit('message:receive', { user: myProfile, message: result });
        }

        callback({ message: result, statusCode: 'ok' });
      } catch (error) {
        callback(error);
      }
    });

    socket.on('disconnect', async () => {
      onlineUsers = onlineUsers.filter(
        (onlineUser) => onlineUser.userId !== userId
      );
      const user = await UserService.getUserByCriteria({ id: userId });
      user.isOnline = false;
      user.lastOnlineDate = new Date();
      await user.save();
      await sendFriendListToOnlineUsers(io, onlineUsers);
    });

    const sendFriendListToOnlineUsers = async (io, onlineUsers) => {
      // send the list only to my friends
      await onlineUsers.forEach(async (onlineUser) => {
        const onlineFriends = await UserService.getUserFriends(
          onlineUser.userId,
          true
        );

        if (onlineFriends.some((friend) => friend.id === userId)) {
          await io
            .to(onlineUser.socketId)
            .emit('user:fetchFriends', onlineFriends);
        }
      });
    };
  });
};

module.exports = applyEvents;
