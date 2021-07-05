const db = require('../models');
const { Op } = require('sequelize');
const User = db.users;
const Friendship = db.friendships;

exports.getUsers = async ({
  pageSize,
  pageNumber,
  searchString = '',
  userId,
}) => {
  try {
    // const users = await Friendship.findAndCountAll({
    //   offset: pageNumber * pageSize,
    //   limit: pageSize,
    //   attributes: ['isRequestAccepted'],
    //   include: [
    //     {
    //       model: User,
    //       as: 'requester',

    //       required: false,
    //       attributes: ['id', 'username', 'email', 'createdAt'],
    //       where: {
    //         // id: {
    //         //   [Op.not]: userId,
    //         // },
    //         [Op.or]: {
    //           username: {
    //             [Op.like]: `%${searchString}%`,
    //           },
    //           email: {
    //             [Op.like]: `%${searchString}%`,
    //           },
    //         },
    //       },
    //     },
    //     {
    //       model: User,
    //       as: 'addressee',

    //       required: false,
    //       attributes: ['id', 'username', 'email', 'createdAt'],
    //       where: {
    //         // id: {
    //         //   [Op.not]: userId,
    //         // },
    //         [Op.or]: {
    //           username: {
    //             [Op.like]: `%${searchString}%`,
    //           },
    //           email: {
    //             [Op.like]: `%${searchString}%`,
    //           },
    //         },
    //       },
    //     },
    //   ],
    // });

    const users = await User.findAndCountAll({
      where: {
        id: {
          [Op.not]: userId,
        },
        [Op.or]: {
          username: {
            [Op.like]: `%${searchString}%`,
          },
          email: {
            [Op.like]: `%${searchString}%`,
          },
        },
      },
      offset: pageNumber * pageSize,
      limit: pageSize,
      attributes: ['id', 'username', 'email', 'createdAt'],
      include: [
        {
          model: Friendship,
          as: 'requester',
          attributes: ['requesterId', 'addresseeId', 'isRequestAccepted'],
          where: {
            [Op.or]: {
              requesterId: userId,
              addresseeId: userId,
            },
          },
          required: false,
        },
        {
          model: Friendship,
          as: 'addressee',
          attributes: ['requesterId', 'addresseeId', 'isRequestAccepted'],
          where: {
            [Op.or]: {
              requesterId: userId,
              addresseeId: userId,
            },
          },
          required: false,
        },
      ],
    }).then((data) => {
      return {
        count: data.count,
        rows: data.rows.map((row) => ({
          id: row.id,
          username: row.username,
          email: row.email,
          createdAt: row.createdAt,
          friendship: row.addressee || row.requester,
        })),
      };
    });

    return users;
  } catch (e) {
    throw Error(e);
  }
};

exports.getUserByCriteria = async (criteria) => {
  try {
    return await User.findOne({ where: criteria });
  } catch (e) {
    throw Error(e);
  }
};

exports.createUser = async (user) => {
  try {
    return await User.create(user);
  } catch (e) {
    throw Error(e);
  }
};

exports.sendFriendshipRequest = async (friendship) => {
  try {
    return await Friendship.create(friendship);
  } catch (e) {
    throw Error(e);
  }
};

exports.cancelFriendshipRequest = async ({ requesterId, addresseeId }) => {
  try {
    return await Friendship.destroy({ where: { requesterId, addresseeId } });
  } catch (e) {
    throw Error(e);
  }
};

exports.getFriendship = async (criteria) => {
  try {
    return await Friendship.findOne({ where: criteria });
  } catch (e) {
    throw Error(e);
  }
};

exports.getUserFriends = async (
  id,
  isRequestAccepted,
  isOnline,
  isMyRequest
) => {
  let whereConditions = {
    [Op.or]: {
      requesterId: id,
      addresseeId: id,
    },
  };

  if (isMyRequest !== undefined) {
    if (isMyRequest) {
      whereConditions = { requesterId: id };
    } else {
      whereConditions = { addresseeId: id };
    }
  }

  if (isRequestAccepted !== undefined) {
    whereConditions.isRequestAccepted = isRequestAccepted;
  }

  const userWhereConditions = {};
  if (isOnline !== undefined) {
    userWhereConditions.isOnline = isOnline;
  }

  try {
    const data = await Friendship.findAll({
      where: whereConditions,
      attributes: [
        'id',
        'requesterId',
        'addresseeId',
        'isRequestAccepted',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: User,
          as: 'addressee',
          attributes: ['id', 'username', 'email', 'isOnline'],
          where: userWhereConditions,
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'username', 'email', 'isOnline'],
          where: userWhereConditions,
        },
      ],
    });

    const result = data.map((row) => {
      let modifiedRow = {
        friendship: {
          id: row.id,
          requesterId: row.requesterId,
          addresseeId: row.addresseeId,
          isRequestAccepted: row.isRequestAccepted,
        },
      };

      if (row.addressee.id === Number(id)) {
        modifiedRow = {
          ...modifiedRow,
          id: row.requester.id,
          username: row.requester.username,
          email: row.requester.email,
          isOnline: row.requester.isOnline,
        };
      } else {
        modifiedRow = {
          ...modifiedRow,
          id: row.addressee.id,
          username: row.addressee.username,
          email: row.addressee.email,
          isOnline: row.addressee.isOnline,
        };
      }

      return modifiedRow;
    });

    return result;
  } catch (e) {
    throw Error(e);
  }
};
