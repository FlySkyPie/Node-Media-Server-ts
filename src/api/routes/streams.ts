import express from 'express';
import * as streamController from '../controllers/streams';

export default (context: any) => {
  let router = express.Router();
  router.post('/trans', streamController.postStreamTrans.bind(context));
  router.post('/trans', (req,rep,next)=>{});
  router.get('/', streamController.getStreams.bind(context));
  router.get('/:app/:stream', streamController.getStream.bind(context));
  router.delete('/:app/:stream', streamController.delStream.bind(context));
  return router;
};
