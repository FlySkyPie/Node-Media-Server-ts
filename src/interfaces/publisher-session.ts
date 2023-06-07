

export interface IPublisherSession {
    players?: any | undefined;

    isFirstAudioReceived: boolean;

    isFirstVideoReceived: boolean;

    metaData: Buffer;

    audioCodec: number;

    videoCodec: number;

    aacSequenceHeader: Buffer;

    avcSequenceHeader: Buffer;

    flvGopCacheQueue: any;

    rtmpGopCacheQueue: any;

    parserPacket: any;

    sendStatusMessage: (...arg: any) => void;

    playStreamId: any;

    flush: () => void;
}