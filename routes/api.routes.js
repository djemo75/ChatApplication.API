const router = require('express').Router();
const AuthRoutes = require('./auth.routes');
const UserRoutes = require('./user.routes');
const Sequelize = require('sequelize');

router.use('/auth', AuthRoutes);
router.use('/users', UserRoutes);

// General error handling
router.use(function (error, req, res, next) {
  // Show only first validation error from model validations
  if (
    typeof error === 'object' &&
    Array.isArray(error.errors) &&
    error.errors.length
  ) {
    error = {
      statusCode: error.errors[0].type === 'Validation error' ? 400 : 500,
      message: error.errors[0].message,
    };
  }

  const status = error.statusCode || 500;
  const message = error.message;
  return res.status(status).json({ message: message });
});

module.exports = router;
