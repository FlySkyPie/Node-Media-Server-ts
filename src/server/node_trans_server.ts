//
//  Created by Mingliang Chen on 18/3/9.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
import fs from 'fs';
import _ from 'lodash';
import mkdirp from 'mkdirp';


import Logger from '../node_core_logger';

import NodeTransSession from '../session/node_trans_session';
import context from '../node_core_ctx';
import { getFFmpegVersion, getFFmpegUrl } from '../node_core_utils';

class NodeTransServer {
  public config: any;
  public transSessions: any;

  constructor(config: any) {
    this.config = config;
    this.transSessions = new Map();
  }

  async run() {
    try {
      mkdirp.sync(this.config.http.mediaroot);
      fs.accessSync(this.config.http.mediaroot, fs.constants.W_OK);
    } catch (error) {
      Logger.error(`Node Media Trans Server startup failed. MediaRoot:${this.config.http.mediaroot} cannot be written.`);
      return;
    }

    try {
      fs.accessSync(this.config.trans.ffmpeg, fs.constants.X_OK);
    } catch (error) {
      Logger.error(`Node Media Trans Server startup failed. ffmpeg:${this.config.trans.ffmpeg} cannot be executed.`);
      return;
    }

    let version: string = await getFFmpegVersion(this.config.trans.ffmpeg) as string;
    if (version === '' || parseInt(version.split('.')[0]) < 4) {
      Logger.error('Node Media Trans Server startup failed. ffmpeg requires version 4.0.0 above');
      Logger.error('Download the latest ffmpeg static program:', getFFmpegUrl());
      return;
    }

    let i = this.config.trans.tasks.length;
    let apps = '';
    while (i--) {
      apps += this.config.trans.tasks[i].app;
      apps += ' ';
    }
    context.nodeEvent.on('postPublish', this.onPostPublish.bind(this));
    context.nodeEvent.on('donePublish', this.onDonePublish.bind(this));
    Logger.log(`Node Media Trans Server started for apps: [ ${apps}] , MediaRoot: ${this.config.http.mediaroot}, ffmpeg version: ${version}`);
  }

  onPostPublish(id: any, streamPath?: any, args?: any) {
    let regRes = /\/(.*)\/(.*)/gi.exec(streamPath);
    let [app, name] = _.slice(regRes, 1);
    let i = this.config.trans.tasks.length;
    while (i--) {
      let conf = { ...this.config.trans.tasks[i] };
      conf.ffmpeg = this.config.trans.ffmpeg;
      conf.mediaroot = this.config.http.mediaroot;
      conf.rtmpPort = this.config.rtmp.port;
      conf.streamPath = streamPath;
      conf.streamApp = app;
      conf.streamName = name;
      conf.args = args;
      if (app === conf.app) {
        let session = new NodeTransSession(conf);
        this.transSessions.set(id, session);
        session.on('end', () => {
          this.transSessions.delete(id);
        });
        session.run();
      }
    }
  }

  onDonePublish(id: any, streamPath?: any, args?: any) {
    let session = this.transSessions.get(id);
    if (session) {
      session.end();
    }
  }
}

export default NodeTransServer;
