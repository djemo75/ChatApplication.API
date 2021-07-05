module.exports = (sequelize, DataTypes) => {
  return sequelize.define('friendships', {
    isRequestAccepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
};
