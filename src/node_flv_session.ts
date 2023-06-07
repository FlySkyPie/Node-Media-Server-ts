//
//  Created by Mingliang Chen on 17/8/4.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
import URL from 'url';

import Logger from './node_core_logger';
import context, { playerSessions } from './node_core_ctx';
import NodeCoreUtils from './node_core_utils';

type IPacket = {
  header: {
    length: number;
    timestamp: number;
    type: number;
  },
  payload: Buffer | null;
};

const createPacket = (payload: Buffer | null = null, type = 0, time = 0): IPacket => ({
  header: {
    length: payload ? payload.length : 0,
    timestamp: time,
    type: type
  },
  payload: payload
});

class NodeFlvSession {
  public config: any;
  public req: any;
  public res: any;
  public id: any;
  public ip: any;
  public playStreamPath: any;
  public playArgs: any;
  public isStarting: boolean;
  public isPlaying: boolean;
  public isIdling: boolean;
  public TAG: any;
  public numPlayCache: any;
  public connectCmdObj: any;
  public connectTime: any;

  constructor(config: any, req: any, res: any) {
    this.config = config;
    this.req = req;
    this.res = res;
    this.id = NodeCoreUtils.generateNewSessionID();
    this.ip = this.req.socket.remoteAddress;

    this.playStreamPath = '';
    this.playArgs = null;

    this.isStarting = false;
    this.isPlaying = false;
    this.isIdling = false;

    if (this.req.nmsConnectionType === 'ws') {
      this.res.cork = this.res._socket.cork.bind(this.res._socket);
      this.res.uncork = this.res._socket.uncork.bind(this.res._socket);
      this.res.on('close', this.onReqClose.bind(this));
      this.res.on('error', this.onReqError.bind(this));
      this.res.write = this.res.send;
      this.res.end = this.res.close;
      this.TAG = 'websocket-flv';
    } else {
      this.res.cork = this.res.socket.cork.bind(this.res.socket);
      this.res.uncork = this.res.socket.uncork.bind(this.res.socket);
      this.req.socket.on('close', this.onReqClose.bind(this));
      this.req.on('error', this.onReqError.bind(this));
      this.TAG = 'http-flv';
    }

    this.numPlayCache = 0;
    playerSessions.set(this.id, this);
  }

  run() {
    let method = this.req.method;
    let urlInfo = URL.parse(this.req.url, true);
    let streamPath = urlInfo.pathname!.split('.')[0];
    this.connectCmdObj = { ip: this.ip, method, streamPath, query: urlInfo.query };
    this.connectTime = new Date();
    this.isStarting = true;
    Logger.log(`[${this.TAG} connect] id=${this.id} ip=${this.ip} args=${JSON.stringify(urlInfo.query)}`);
    context.nodeEvent.emit('preConnect', this.id, this.connectCmdObj);
    if (!this.isStarting) {
      this.stop();
      return;
    }
    context.nodeEvent.emit('postConnect', this.id, this.connectCmdObj);

    if (method === 'GET') {
      this.playStreamPath = streamPath;
      this.playArgs = urlInfo.query;

      this.onPlay();
    } else {
      this.stop();
    }
  }

  stop() {
    if (this.isStarting) {
      this.isStarting = false;
      let publisherId = context.publishers.get(this.playStreamPath);
      if (publisherId !== null) {
        context.publisherSessions.get(publisherId)!.players.delete(this.id);
        context.nodeEvent.emit('donePlay', this.id, this.playStreamPath, this.playArgs);
      }
      Logger.log(`[${this.TAG} play] Close stream. id=${this.id} streamPath=${this.playStreamPath}`);
      Logger.log(`[${this.TAG} disconnect] id=${this.id}`);
      context.nodeEvent.emit('doneConnect', this.id, this.connectCmdObj);
      this.res.end();
      context.idlePlayers.delete(this.id);
      context.publisherSessions.delete(this.id);
    }
  }

  onReqClose() {
    this.stop();
  }

  onReqError(e: any) {
    this.stop();
  }

  reject() {
    Logger.log(`[${this.TAG} reject] id=${this.id}`);
    this.stop();
  }

  onPlay() {
    context.nodeEvent.emit('prePlay', this.id, this.playStreamPath, this.playArgs);
    if (!this.isStarting) {
      return;
    }
    if (this.config.auth !== undefined && this.config.auth.play) {
      let results = NodeCoreUtils.verifyAuth(this.playArgs.sign, this.playStreamPath, this.config.auth.secret);
      if (!results) {
        Logger.log(`[${this.TAG} play] Unauthorized. id=${this.id} streamPath=${this.playStreamPath} sign=${this.playArgs.sign}`);
        this.res.statusCode = 403;
        this.res.end();
        return;
      }
    }

    if (!context.publishers.has(this.playStreamPath)) {
      Logger.log(`[${this.TAG} play] Stream not found. id=${this.id} streamPath=${this.playStreamPath} `);
      context.idlePlayers.add(this.id);
      this.isIdling = true;
      return;
    }

    this.onStartPlay();
  }

  onStartPlay() {
    let publisherId = context.publishers.get(this.playStreamPath);
    let publisher = context.publisherSessions.get(publisherId);

    if (!publisher) {
      throw new Error("publisher is undefined!");
    }

    let players = publisher.players;
    players.add(this.id);

    //send FLV header
    let FLVHeader = Buffer.from([0x46, 0x4c, 0x56, 0x01, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00]);
    if (publisher.isFirstAudioReceived) {
      FLVHeader[4] |= 0b00000100;
    }

    if (publisher.isFirstVideoReceived) {
      FLVHeader[4] |= 0b00000001;
    }
    this.res.write(FLVHeader);

    //send Metadata
    if (publisher.metaData != null) {
      let packet = createPacket(publisher.metaData, 18);
      let tag = NodeFlvSession.createFlvTag(packet);
      this.res.write(tag);
    }

    //send aacSequenceHeader
    if (publisher.audioCodec == 10) {
      let packet = createPacket(publisher.aacSequenceHeader, 8);
      let tag = NodeFlvSession.createFlvTag(packet);
      this.res.write(tag);
    }

    //send avcSequenceHeader
    if (publisher.videoCodec == 7 || publisher.videoCodec == 12) {
      let packet = createPacket(publisher.avcSequenceHeader, 9);
      let tag = NodeFlvSession.createFlvTag(packet);
      this.res.write(tag);
    }

    //send gop cache
    if (publisher.flvGopCacheQueue != null) {
      for (let tag of publisher.flvGopCacheQueue) {
        this.res.write(tag);
      }
    }

    this.isIdling = false;
    this.isPlaying = true;
    Logger.log(`[${this.TAG} play] Join stream. id=${this.id} streamPath=${this.playStreamPath} `);
    context.nodeEvent.emit('postPlay', this.id, this.playStreamPath, this.playArgs);
  }

  static createFlvTag(packet: IPacket) {
    let PreviousTagSize = 11 + packet.header.length;
    let tagBuffer = Buffer.alloc(PreviousTagSize + 4);
    tagBuffer[0] = packet.header.type;
    tagBuffer.writeUIntBE(packet.header.length, 1, 3);
    tagBuffer[4] = (packet.header.timestamp >> 16) & 0xff;
    tagBuffer[5] = (packet.header.timestamp >> 8) & 0xff;
    tagBuffer[6] = packet.header.timestamp & 0xff;
    tagBuffer[7] = (packet.header.timestamp >> 24) & 0xff;
    tagBuffer.writeUIntBE(0, 8, 3);
    tagBuffer.writeUInt32BE(PreviousTagSize, PreviousTagSize);

    if (!packet.payload) {
      throw new Error('packet.payload is null');
    }

    packet.payload.copy(tagBuffer, 11, 0, packet.header.length);
    return tagBuffer;
  }
}

export default NodeFlvSession;
