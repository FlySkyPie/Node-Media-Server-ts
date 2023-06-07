export type IRtmpPacket = {
    header: {
        fmt: number,
        cid: number,
        timestamp: number,
        length: number,
        type: number,
        stream_id: number
    },
    clock: number,
    payload: null | Buffer,
    capacity: number,
    bytes: number
};