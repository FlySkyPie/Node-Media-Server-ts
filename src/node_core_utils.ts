//
//  Created by Mingliang Chen on 17/8/23.
//  illuspas[a]gmail.com
//  Copyright (c) 2018 Nodemedia. All rights reserved.
//
import Crypto from 'crypto';

import { spawn } from 'child_process';
import context from './node_core_ctx';

function generateNewSessionID() {
  let sessionID = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWKYZ0123456789';
  const numPossible = possible.length;
  do {
    for (let i = 0; i < 8; i++) {
      sessionID += possible.charAt((Math.random() * numPossible) | 0);
    }
  } while (context.publisherSessions.has(sessionID));
  return sessionID;
}

function genRandomName() {
  let name = '';
  const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const numPossible = possible.length;
  for (let i = 0; i < 4; i++) {
    name += possible.charAt((Math.random() * numPossible) | 0);
  }

  return name;
}

function verifyAuth(signStr: string | undefined, streamId: string, secretKey: string) {
  if (signStr === undefined) {
    return false;
  }
  let now = Date.now() / 1000 | 0;
  let exp = parseInt(signStr.split('-')[0]);
  let shv = signStr.split('-')[1];
  let str = streamId + '-' + exp + '-' + secretKey;
  if (exp < now) {
    return false;
  }
  let md5 = Crypto.createHash('md5');
  let ohv = md5.update(str).digest('hex');
  return shv === ohv;
}

export function getFFmpegVersion(ffpath: string) {
  return new Promise((resolve, reject) => {
    let ffmpeg_exec = spawn(ffpath, ['-version']);
    let version = '';
    ffmpeg_exec.on('error', (e: any) => {
      reject(e);
    });
    ffmpeg_exec.stdout.on('data', (data) => {
      try {
        version = data.toString().split(/(?:\r\n|\r|\n)/g)[0].split('\ ')[2];
      } catch (e) {
      }
    });
    ffmpeg_exec.on('close', (code) => {
      resolve(version);
    });
  });
}

export function getFFmpegUrl() {
  let url = '';
  switch (process.platform) {
    case 'darwin':
      url = 'https://ffmpeg.zeranoe.com/builds/macos64/static/ffmpeg-latest-macos64-static.zip';
      break;
    case 'win32':
      url = 'https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-latest-win64-static.zip | https://ffmpeg.zeranoe.com/builds/win32/static/ffmpeg-latest-win32-static.zip';
      break;
    case 'linux':
      url = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-i686-static.tar.xz';
      break;
    default:
      url = 'http://ffmpeg.org/download.html';
      break;
  }
  return url;
}

export default {
  generateNewSessionID,
  verifyAuth,
  genRandomName,
  getFFmpegVersion,
  getFFmpegUrl
};