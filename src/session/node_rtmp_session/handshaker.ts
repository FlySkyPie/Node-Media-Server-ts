import { Transform, TransformCallback } from "stream";
import Net from "net";

import * as HandshakeUtils from "./node_rtmp_handshake";

enum HandshakeState {
  Inital,
  S0,
  S1,
  S2,
}

const RTMP_HANDSHAKE_SIZE = 1536;

export class HandShaker extends Transform {
  private state: HandshakeState = HandshakeState.Inital;

  /**
   * Stored handshake data size.
   */
  private handshakeBytes: number = 0;

  /**
   * Store data send from client, used to send back to complte the handshake.
   */
  private handshakeBuffer = Buffer.alloc(RTMP_HANDSHAKE_SIZE);

  constructor(private socket: Net.Socket) {
    super();
  }

  _transform(data: Buffer, _: BufferEncoding, callback: TransformCallback) {
    console.log("_transform", data.length);
    if (this.state === HandshakeState.S2) {
      this.push(data);
      callback();
      return;
    }

    let leftBytes = data.length;
    let progressBytes = 0;
    let n = 0;
    while (leftBytes > 0) {
      switch (this.state) {
        case HandshakeState.Inital:
          const char = data[progressBytes];
          if (char !== 0x03) {
            throw new Error(`Invalid frist byte: ${char.toString(16)}`);
          }

          this.state = HandshakeState.S0;
          this.handshakeBytes = 0;
          leftBytes -= 1;
          progressBytes += 1;
          break;
        case HandshakeState.S0:
          // if (!this.handshakePayload) {
          //   throw new Error("this.handshakePayload is null.");
          // }
          // Logger.log('RTMP_HANDSHAKE_0');
          n = RTMP_HANDSHAKE_SIZE - this.handshakeBytes;
          n = n <= leftBytes ? n : leftBytes;

          // n = Math.min(RTMP_HANDSHAKE_SIZE - this.handshakeBytes, leftBytes);

          data.copy(
            this.handshakeBuffer,
            this.handshakeBytes,
            progressBytes,
            progressBytes + n
          );
          this.handshakeBytes += n;
          leftBytes -= n;
          progressBytes += n;
          if (this.handshakeBytes === RTMP_HANDSHAKE_SIZE) {
            this.state = HandshakeState.S1;
            this.handshakeBytes = 0;
            let s0s1s2 = HandshakeUtils.generateS0S1S2(this.handshakeBuffer);

            this.socket.write(s0s1s2);

            console.log("HandshakeState.S0");
          }
          break;
        case HandshakeState.S1:
          if (!this.handshakeBuffer) {
            throw new Error("this.handshakePayload is null.");
          }
          // Logger.log('RTMP_HANDSHAKE_1');
          n = RTMP_HANDSHAKE_SIZE - this.handshakeBytes;
          n = n <= leftBytes ? n : leftBytes;
          data.copy(
            this.handshakeBuffer,
            this.handshakeBytes,
            progressBytes,
            n
          );
          this.handshakeBytes += n;
          leftBytes -= n;
          progressBytes += n;
          if (this.handshakeBytes === RTMP_HANDSHAKE_SIZE) {
            this.state = HandshakeState.S2;
            this.handshakeBytes = 0;
            // this.handshakePayload = null;

            console.log("HandshakeState.S1");
          }
          break;
        // case HandshakeState.S2:
        default:
          // Logger.log('RTMP_HANDSHAKE_2');

          this.push(data.subarray(progressBytes, data.length));
          callback();
          return;
      }
    }

    callback();

    // let pendingBytes = chunk.length;
    // let progress = 0;
    // let readablePayload = 0;
    // while (pendingBytes > 0) {
    //   switch (this.state) {
    //     case Handshake.Inital:
    //       // Read C0
    //       const char = chunk.subarray(progress, progress + 1)[0];
    //       if (char !== 0x03) {
    //         throw new Error(`Invalid version: ${char}`);
    //       }

    //       this.state = Handshake.S0;

    //       pendingBytes -= 1;
    //       progress += 1;
    //       break;
    //     case Handshake.S0:
    //       // Read C1
    //       readablePayload = RTMP_HANDSHAKE_SIZE - this.handshakeBytes;
    //       readablePayload =
    //         readablePayload <= pendingBytes ? readablePayload : pendingBytes;
    //       chunk.copy(
    //         this.handshakeBuffer,
    //         this.handshakeBytes,
    //         progress,
    //         progress + readablePayload
    //       );
    //       this.handshakeBytes += readablePayload;

    //       pendingBytes -= readablePayload;
    //       progress += readablePayload;
    //       if (this.handshakeBytes === RTMP_HANDSHAKE_SIZE) {
    //         this.state = Handshake.S1;
    //         this.handshakeBytes = 0;

    //         // Wrtie S0 and S1
    //         let c0c1 = Crypto.randomBytes(1537);
    //         c0c1.writeUInt8(3);
    //         c0c1.writeUInt32BE(Date.now() / 1000, 1);
    //         c0c1.writeUInt32BE(0, 5);
    //         this.socket.write(c0c1);
    //       }
    //       break;
    //     case Handshake.S1:
    //       // Read C2
    //       readablePayload = RTMP_HANDSHAKE_SIZE - this.handshakeBytes;
    //       readablePayload =
    //         readablePayload <= pendingBytes ? readablePayload : pendingBytes;
    //       chunk.copy(
    //         this.handshakeBuffer,
    //         this.handshakeBytes,
    //         progress,
    //         readablePayload
    //       );
    //       this.handshakeBytes += readablePayload;
    //       pendingBytes -= readablePayload;
    //       progress += readablePayload;
    //       if (this.handshakeBytes === RTMP_HANDSHAKE_SIZE) {
    //         this.state = Handshake.S2;
    //         this.handshakeBytes = 0;

    //         // Wrtie S2
    //         this.socket.write(this.handshakeBuffer);
    //       }
    //       break;
    //     case Handshake.S2:
    //       this.push(chunk.subarray(progress, chunk.length));
    //       return;
    //   }
    // }
  }

  // _flush(callback: TransformCallback) {
  //   console.log("_flush")
  // }
}
