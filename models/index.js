'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      !file.startsWith('baseError') &&
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Users - Friendship Relationship
db.users.hasOne(db.friendships, {
  foreignKey: 'requesterId',
  as: 'requester',
});
db.users.hasOne(db.friendships, {
  foreignKey: 'addresseeId',
  as: 'addressee',
});

db.friendships.belongsTo(db.users, {
  foreignKey: 'requesterId',
  as: 'requester',
});
db.friendships.belongsTo(db.users, {
  foreignKey: 'addresseeId',
  as: 'addressee',
});

// Users - Messages Relationship
db.users.hasOne(db.messages, {
  foreignKey: 'requesterId',
  as: 'messageRequester',
});
db.users.hasOne(db.messages, {
  foreignKey: 'addresseeId',
  as: 'messageAddressee',
});

db.messages.belongsTo(db.users, {
  foreignKey: 'requesterId',
  as: 'messageRequester',
});
db.messages.belongsTo(db.users, {
  foreignKey: 'addresseeId',
  as: 'messageAddressee',
});

// Users - Resources Relationship
db.users.belongsTo(db.resources, { foreignKey: 'avatarId', as: 'avatar' });
db.users.belongsTo(db.resources, { foreignKey: 'coverId', as: 'cover' });

// Messages - Resources Relationship
db.messages.belongsTo(db.resources, {
  foreignKey: 'resourceId',
  as: 'resource',
});

module.exports = db;
