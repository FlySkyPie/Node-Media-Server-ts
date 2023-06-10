import express from 'express';
import * as serverController from '../controllers/server';

export default (context: any) => {
  let router = express.Router();
  router.get('/', serverController.getInfo.bind(context));
  return router;
};
