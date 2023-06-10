

export interface IPublisherSession {
    players?: any | undefined;

    isFirstAudioReceived: boolean;

    isFirstVideoReceived: boolean;

    metaData: Buffer | null;

    audioCodec: number;

    videoCodec: number;

    aacSequenceHeader: Buffer | null;

    avcSequenceHeader: Buffer | null;

    flvGopCacheQueue: any;

    rtmpGopCacheQueue: any;

    parserPacket: any;

    playStreamId: any;

    isLocal: any;

    sendStatusMessage: (...arg: any) => void;

    flush: () => void;
}