module.exports = (sequelize, DataTypes) => {
  return sequelize.define('users', {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isNotNull(value) {
          if (!value) {
            throw new Error('Username is required.');
          }
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Email is not valid.',
        },
        isNotNull(value) {
          if (!value) {
            throw new Error('Email is required.');
          }
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      validate: {
        isNotNull(value) {
          if (!value) {
            throw new Error('Password is required.');
          }
        },
      },
    },
    refreshToken: DataTypes.STRING,
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
};
