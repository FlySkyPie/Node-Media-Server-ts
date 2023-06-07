//
//  Created by Mingliang Chen on 17/8/1.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//

import Https from 'https';

import Package from '../package.json';

import Logger from './node_core_logger';
import NodeRtmpServer from './node_rtmp_server';
import NodeHttpServer from './node_http_server';
import NodeTransServer from './node_trans_server';
import NodeRelayServer from './node_relay_server';
import NodeFissionServer from './node_fission_server';
import { nodeEvent, publisherSessions } from './node_core_ctx';

type IConfig = {
  logType: any;
  rtmp: any;
  http: any;
  trans: any;
  cluster: any;
  relay: any;
  fission: any;
};

class NodeMediaServer {
  public config: IConfig;
  public nrs: any;
  public nhs: any;
  public nts: any;
  public nls: any;
  public nfs: any;

  constructor(config: any) {
    this.config = config;
  }

  public run() {
    Logger.setLogType(this.config.logType);
    Logger.log(`Node Media Server v${Package.version}`);
    if (this.config.rtmp) {
      this.nrs = new NodeRtmpServer(this.config);
      this.nrs.run();
    }

    if (this.config.http) {
      this.nhs = new NodeHttpServer(this.config);
      this.nhs.run();
    }

    if (this.config.trans) {
      if (this.config.cluster) {
        Logger.log('NodeTransServer does not work in cluster mode');
      } else {
        this.nts = new NodeTransServer(this.config);
        this.nts.run();
      }
    }

    if (this.config.relay) {
      if (this.config.cluster) {
        Logger.log('NodeRelayServer does not work in cluster mode');
      } else {
        this.nls = new NodeRelayServer(this.config);
        this.nls.run();
      }
    }

    if (this.config.fission) {
      if (this.config.cluster) {
        Logger.log('NodeFissionServer does not work in cluster mode');
      } else {
        this.nfs = new NodeFissionServer(this.config);
        this.nfs.run();
      }
    }

    process.on('uncaughtException', function (err) {
      Logger.error('uncaughtException', err);
    });

    process.on('SIGINT', function () {
      process.exit();
    });

    Https.get('https://registry.npmjs.org/node-media-server', function (res) {
      let size = 0;
      let chunks: any[] = [];
      res.on('data', function (chunk) {
        size += chunk.length;
        chunks.push(chunk);
      });
      res.on('end', function () {
        let data = Buffer.concat(chunks, size);
        let jsonData = JSON.parse(data.toString());
        let latestVersion = jsonData['dist-tags']['latest'];
        let latestVersionNum = latestVersion.split('.')[0] << 16 | latestVersion.split('.')[1] << 8 | latestVersion.split('.')[2] & 0xff;
        let thisVersionNum =
          parseInt(Package.version.split('.')[0]) << 16 |
          parseInt(Package.version.split('.')[1]) << 8 |
          parseInt(Package.version.split('.')[2]) &
          0xff;
        if (thisVersionNum < latestVersionNum) {
          Logger.log(`There is a new version ${latestVersion} that can be updated`);
        }
      });
    }).on('error', function (e) {
    });
  }

  public on(eventName: any, listener: any) {
    nodeEvent.on(eventName, listener);
  }

  public stop() {
    if (this.nrs) {
      this.nrs.stop();
    }
    if (this.nhs) {
      this.nhs.stop();
    }
    if (this.nls) {
      this.nls.stop();
    }
    if (this.nfs) {
      this.nfs.stop();
    }
  }

  public getSession(id: any) {
    return publisherSessions.get(id);
  }
}

export default NodeMediaServer;