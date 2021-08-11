module.exports = (sequelize, DataTypes) => {
  return sequelize.define('messages', {
    messageType: {
      type: DataTypes.STRING,
    },
    content: {
      type: DataTypes.TEXT,
    },
  });
};
