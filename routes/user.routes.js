const router = require('express').Router();
const UserController = require('../controllers/user.controller');
const MessageController = require('../controllers/message.controller');
const isAuthenticated = require('../middlewares/isAuthenticated');

router.get('/', isAuthenticated, UserController.getUsers);

router.get('/:id/profile', isAuthenticated, UserController.getUserProfileById);

router.get(
  '/profile',
  isAuthenticated,
  UserController.getUserProfileByUsername
);

router.put('/profile', isAuthenticated, UserController.editUser);

// Friends
router.get('/:id/friends', isAuthenticated, UserController.getUserFriends);

router.get(
  '/:id/friends/:friendId',
  isAuthenticated,
  UserController.getFriendship
);

router.post(
  '/:id/friends',
  isAuthenticated,
  UserController.sendFriendshipRequest
);

router.put(
  '/:id/friends',
  isAuthenticated,
  UserController.acceptFriendshipRequest
);

router.delete(
  '/:id/friends',
  isAuthenticated,
  UserController.cancelFriendshipRequest
);

// Messages
router.get('/:id/messages', isAuthenticated, MessageController.getMessages);

router.post('/:id/messages', isAuthenticated, MessageController.createMessage);

router.get(
  '/:id/messages/:messageId',
  isAuthenticated,
  UserController.getUserProfileById
);

router.delete(
  '/:id/messages/:messageId',
  isAuthenticated,
  UserController.cancelFriendshipRequest
);

router.delete(
  '/:id/messages/clear',
  isAuthenticated,
  UserController.cancelFriendshipRequest
);

router.get(
  '/lastChattedUsers',
  isAuthenticated,
  MessageController.getLastChattedUsers
);

module.exports = router;
