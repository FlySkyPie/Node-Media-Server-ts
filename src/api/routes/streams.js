import express from 'express';
import streamController from '../controllers/streams';

export default (context) => {
  let router = express.Router();
  router.post('/trans', streamController.postStreamTrans.bind(context));
  router.get('/', streamController.getStreams.bind(context));
  router.get('/:app/:stream', streamController.getStream.bind(context));
  router.delete('/:app/:stream', streamController.delStream.bind(context));
  return router;
};
