const UserService = require('../services/user.service');

module.exports = (io) => {
  const setUserStatus = async (userId, status, onlineUsers) => {
    if (!status) {
      onlineUsers = onlineUsers.filter(
        (onlineUser) => onlineUser.userId !== userId
      );
    }

    const user = await UserService.getUserByCriteria({ id: userId });
    user.isOnline = status;
    await user.save();
    await sendFriendListToOnlineUsers(io, onlineUsers);
  };

  const fetchOnlineUsers = (userId) => {
    const socket = this;
    return async function () {
      console.log('socket', socket);
      const onlineFriends = await UserService.getUserFriends(userId, true);
      await socket.emit('user:fetchOnlineUsers', onlineFriends);
    };
  };

  const sendFriendListToOnlineUsers = async (io, onlineUsers) => {
    // send the list only to my friends
    await onlineUsers.forEach(async (onlineUser) => {
      const onlineFriends = await UserService.getUserFriends(
        onlineUser.userId,
        true
      );
      await io
        .to(onlineUser.socketId)
        .emit('fetchOnlineUsersResponse', onlineFriends);
    });
  };

  return {
    setUserStatus,
    fetchOnlineUsers,
  };
};
