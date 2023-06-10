import EventEmitter from 'events';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

import Logger from '../node_core_logger';

type IConfig = {
  rtmpPort: any;
  streamApp: any;
  streamName: any;
  model: any;
  ffmpeg: any;
  streamPath: any;
};

class NodeFissionSession extends EventEmitter {
  public conf: IConfig;
  public ffmpeg_exec?: ChildProcessWithoutNullStreams;

  constructor(conf: IConfig) {
    super();
    this.conf = conf;
  }

  run() {
    let inPath = 'rtmp://127.0.0.1:' + this.conf.rtmpPort + this.conf.streamPath;
    let argv = ['-i', inPath];
    for (let m of this.conf.model) {
      let x264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-maxrate', m.vb, '-bufsize', m.vb, '-g', parseInt(m.vf) * 2, '-r', m.vf, '-s', m.vs];
      let aac = ['-c:a', 'aac', '-b:a', m.ab];
      let outPath = ['-f', 'flv', 'rtmp://127.0.0.1:' + this.conf.rtmpPort + '/' + this.conf.streamApp + '/' + this.conf.streamName + '_' + m.vs.split('x')[1]];
      argv.splice(argv.length, 0, ...x264);
      argv.splice(argv.length, 0, ...aac);
      argv.splice(argv.length, 0, ...outPath);
    }

    argv = argv.filter((n) => { return n; });
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
      Logger.log('[Fission end] ' + this.conf.streamPath);
      this.emit('end');
    });
  }

  end() {
    this.ffmpeg_exec?.kill();
  }
}

export default NodeFissionSession;