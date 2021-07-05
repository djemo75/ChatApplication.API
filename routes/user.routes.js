const router = require('express').Router();
const UserController = require('../controllers/user.controller');
const isAuthenticated = require('../middlewares/isAuthenticated');

router.get('/', isAuthenticated, UserController.getUsers);
router.get('/profile', isAuthenticated, UserController.getUserProfile);
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

module.exports = router;
