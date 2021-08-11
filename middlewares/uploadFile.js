const multer = require('multer');
const BaseError = require('../models/baseError.model');

const imageFilter = (req, file, next) => {
  if (file.mimetype.startsWith('image')) {
    next(null, true);
  } else {
    next(new BaseError('Please upload only images', 400));
  }
};

const audioFilter = (req, file, next) => {
  if (file.mimetype.startsWith('audio')) {
    next(null, true);
  } else {
    next(new BaseError('Please upload only audios', 400));
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + '/resources/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const uploadImageFile = multer({ storage: storage, fileFilter: imageFilter });
const uploadAudioFile = multer({ storage: storage, fileFilter: audioFilter });
module.exports = { uploadImageFile, uploadAudioFile };
