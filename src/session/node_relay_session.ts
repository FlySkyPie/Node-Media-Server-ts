import EventEmitter from 'events';
import { spawn } from 'child_process';

import Logger from '../node_core_logger';
import NodeCoreUtils from '../node_core_utils';

const RTSP_TRANSPORT = ['udp', 'tcp', 'udp_multicast', 'http'];

class NodeRelaySession extends EventEmitter {
  public conf: any;
  public id: any;
  public ts: any;
  public TAG: any;
  public ffmpeg_exec: any;
  public emit: any;

  constructor(conf: any) {
    super();
    this.conf = conf;
    this.id = NodeCoreUtils.generateNewSessionID();
    this.ts = Date.now() / 1000 | 0;
    this.TAG = 'relay';
  }

  run() {
    let format = this.conf.ouPath.startsWith('rtsp://') ? 'rtsp' : 'flv';
    let argv = ['-re', '-i', this.conf.inPath, '-c', 'copy', '-f', format, this.conf.ouPath];
    if (this.conf.inPath[0] === '/' || this.conf.inPath[1] === ':') {
      argv.unshift('-1');
      argv.unshift('-stream_loop');
    }

    if (this.conf.inPath.startsWith('rtsp://') && this.conf.rtsp_transport) {
      if (RTSP_TRANSPORT.indexOf(this.conf.rtsp_transport) > -1) {
        argv.unshift(this.conf.rtsp_transport);
        argv.unshift('-rtsp_transport');
      }
    }

    Logger.log('[relay task] id=' + this.id, 'cmd=ffmpeg', argv.join(' '));

    this.ffmpeg_exec = spawn(this.conf.ffmpeg, argv);
    this.ffmpeg_exec.on('error', (e: any) => {
      Logger.ffdebug(e);
    });

    this.ffmpeg_exec.stdout.on('data', (data: any) => {
      Logger.ffdebug(`FF_LOG:${data}`);
    });

    this.ffmpeg_exec.stderr.on('data', (data: any) => {
      Logger.ffdebug(`FF_LOG:${data}`);
    });

    this.ffmpeg_exec.on('close', (code: any) => {
      Logger.log('[relay end] id=' + this.id, 'code=' + code);
      this.emit('end', this.id);
    });
  }

  end() {
    this.ffmpeg_exec.kill();
  }
}

export default NodeRelaySession;
