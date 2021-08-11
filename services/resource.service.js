const db = require('../models');
const Resource = db.resources;

exports.getResourceById = async (id) => {
  try {
    return await Resource.findOne({ where: { id } });
  } catch (e) {
    throw Error(e);
  }
};

exports.createResource = async (resource) => {
  try {
    return await Resource.create(resource);
  } catch (e) {
    throw Error(e);
  }
};
