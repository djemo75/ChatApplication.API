module.exports = (sequelize, DataTypes) => {
  return sequelize.define('resources', {
    type: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    path: {
      type: DataTypes.STRING,
    },
  });
};
