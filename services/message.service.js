const db = require('../models');
const normalizePropertyNames = require('../utils/objects');
const Sequelize = require('sequelize');
const { Op, QueryTypes } = require('sequelize');
const Message = db.messages;
const User = db.users;
const Friendship = db.friendships;
const Resource = db.resources;

exports.getMessages = async ({ pageSize, pageNumber, userId, addresseeId }) => {
  try {
    const messages = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          {
            requesterId: userId,
            addresseeId: addresseeId,
          },
          {
            requesterId: addresseeId,
            addresseeId: userId,
          },
        ],
      },
      order: [['createdAt', 'DESC']],
      offset: pageNumber * pageSize,
      limit: pageSize,
    });

    return messages;
  } catch (e) {
    throw Error(e);
  }
};

exports.getLastChattedUsers = async ({ pageSize, pageNumber, userId }) => {
  try {
    // const users = await User.findAndCountAll({
    //   where: {
    //     id: {
    //       [Op.not]: userId,
    //     },
    //   },
    //   offset: pageNumber * pageSize,
    //   limit: pageSize,
    //   attributes: ['id', 'username', 'email', 'createdAt'],
    //   include: [
    //     {
    //       model: Message,
    //       as: 'messageAddressee',
    //       where: {
    //         id: {
    //           [Op.ne]: null,
    //         },
    //         createdAt: {
    //           [Op.eq]: Sequelize.literal(
    //             `SELECT id, content, max(createdAt) from messages.requesterId='1' OR messages.addresseeId='1'  group by id ORDER BY createdAt DESC`
    //           ),
    //         },
    //         [Op.or]: {
    //           requesterId: userId,
    //           addresseeId: userId,
    //         },
    //       },
    //       // order: [[Sequelize.fn('max', Sequelize.col('createdAt')), 'ASC']],
    //       // order: [
    //       //   ['id', 'DESC'],
    //       //   [{ model: Message, as: 'messageAddressee' }, 'createdAt', 'DESC'],
    //       // ],
    //     },
    //     // [
    //     //   // Note the wrapping parentheses in the call below!
    //     //   Sequelize.literal(`(
    //     //     SELECT max('messages.createdAt') as maxCreatedAt, 'messages'.id,  'messages'.requesterId, 'messages'.addresseeId, 'messages'.content, 'messages'.createdAt
    //     //     FROM Message as messages
    //     //     GROUP BY 'messages'.id,  'messages'.requesterId, 'messages'.addresseeId, 'messages'.content,  'messages'.createdAt
    //     //   ORDER BY 'messages'.createdAt DESC
    //     //   )`),
    //     //   'messageObject',
    //     // ],
    //     {
    //       model: Resource,
    //       as: 'avatar',
    //     },
    //   ],

    //   // order: [{ model: Message, as: 'messageAddressee' }, 'createdAt', 'DESC'],
    //   group: ['Users.username'],
    //   required: false,
    // }).then((result) => ({ count: result.count.length, rows: result.rows }));

    const result = await db.sequelize.query(
      `SELECT COUNT(*) as total FROM (SELECT users.id FROM users 
      LEFT JOIN  
      (
          SELECT *
          FROM messages
          WHERE messages.requesterId=:userId OR messages.addresseeId=:userId
          GROUP BY messages.id, messages.requesterId, messages.addresseeId, messages.content, messages.createdAt
          ORDER BY messages.createdAt DESC
      ) as ms
      ON users.id=ms.requesterId OR users.id=ms.addresseeId 
      WHERE users.id!=:userId AND ms.id IS NOT NULL 
      GROUP BY users.id) as us;`,
      {
        replacements: { userId },
        type: QueryTypes.SELECT,
      }
    );

    const count = result[0].total;

    let users = await db.sequelize.query(
      `SELECT users.id, users.username, users.email, 
      ms.id AS 'lastMessage.id', ms.messageType AS 'lastMessage.messageType', ms.content AS 'lastMessage.content', ms.requesterId AS 'lastMessage.requesterId', ms.addresseeId AS 'lastMessage.addresseeId', ms.resourceId AS 'lastMessage.resourceId', ms.createdAt AS 'lastMessage.createdAt', ms.updatedAt AS 'lastMessage.updatedAt',
      avatar.id AS 'avatar.id', avatar.type AS 'avatar.type', avatar.name AS 'avatar.name', avatar.path AS 'avatar.path', avatar.createdAt AS 'avatar.createdAt', avatar.updatedAt AS 'avatar.updatedAt'
      FROM users 
      LEFT JOIN  
      (
          SELECT *
          FROM messages
          WHERE messages.requesterId=:userId OR messages.addresseeId=:userId
          GROUP BY messages.id, messages.requesterId, messages.addresseeId, messages.content, messages.createdAt
          ORDER BY messages.createdAt DESC
      ) as ms
      ON users.id=ms.requesterId OR users.id=ms.addresseeId
      LEFT OUTER JOIN 
      (
        SELECT * FROM resources
      )as avatar ON users.avatarId = avatar.id
      WHERE users.id!=:userId AND ms.id IS NOT NULL 
      GROUP BY users.id
      LIMIT :limit OFFSET :offset;`,
      {
        replacements: {
          userId,
          limit: pageSize,
          offset: pageNumber * pageSize,
        },
        type: QueryTypes.SELECT,
      }
    );

    users = users.map((user) => {
      return normalizePropertyNames(user);
    });

    return { count, rows: users };
  } catch (e) {
    throw Error(e);
  }
};

exports.createMessage = async (message) => {
  try {
    return await Message.create(message);
  } catch (e) {
    throw Error(e);
  }
};
