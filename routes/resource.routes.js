const router = require('express').Router();
const isAuthenticated = require('../middlewares/isAuthenticated');
const ResourceController = require('../controllers/resource.controller');
const {
  uploadImageFile,
  uploadAudioFile,
} = require('../middlewares/uploadFile');

router.post(
  '/images/upload',
  isAuthenticated,
  uploadImageFile.single('file'),
  ResourceController.saveResource
);

router.post(
  '/audios/upload',
  isAuthenticated,
  uploadAudioFile.single('file'),
  ResourceController.saveResource
);

router.get('/:id', ResourceController.getResourceById);

module.exports = router;
