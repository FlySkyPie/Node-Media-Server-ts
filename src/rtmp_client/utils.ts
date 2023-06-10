
type IParams = {
    fmt?: number;
    cid?: number;
    type?: number;
    timestamp?: number;
    payload: Buffer;
}

type IRtmpPacket = {
    header: {
        fmt: number,
        cid: number,
        timestamp: number,
        length: number,
        type?: number,
        stream_id?: number
    },
    clock: number,
    delta: number;
    payload: Buffer,
    capacity: number,
    bytes: number
}

export const createRtmpPacket = ({ fmt = 0, cid = 0, type, payload }: IParams): IRtmpPacket => ({
    header: {
        fmt: fmt,
        cid: cid,
        timestamp: 0,
        length: payload.length,
        type,
        stream_id: 0
    },
    clock: 0,
    delta: 0,
    payload,
    capacity: 0,
    bytes: 0
});