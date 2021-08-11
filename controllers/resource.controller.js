const BaseError = require('../models/baseError.model');
const ResourceService = require('../services/resource.service');

exports.saveResource = async (req, res, next) => {
  const { file } = req;

  try {
    if (!file) {
      throw new BaseError('You must select a file', 400);
    }

    const response = await ResourceService.createResource({
      type: file.mimetype,
      name: file.filename,
      path: `/resources/uploads/${file.filename}`,
    });

    return res.send(response);
  } catch (error) {
    next(error);
  }
};

exports.getResourceById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const resource = await ResourceService.getResourceById(id);

    return res.send(resource);
  } catch (error) {
    next(error);
  }
};
