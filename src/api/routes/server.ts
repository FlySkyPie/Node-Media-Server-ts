import express from 'express';
import serverController from '../controllers/server';

export default (context) => {
  let router = express.Router();
  router.get('/', serverController.getInfo.bind(context));
  return router;
};
