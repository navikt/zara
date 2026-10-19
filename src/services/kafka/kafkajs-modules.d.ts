/**
 * Minimal type declarations for the kafkajs internals used by kafkajs-internals.ts. kafkajs does not
 * ship types for these modules, and only the parts we actually use are declared.
 */

declare module 'kafkajs/src/protocol/encoder.js' {
    export default class Encoder {
        writeInt16(value: number): Encoder
        writeInt32(value: number): Encoder
        writeString(value: string | null): Encoder
        writeArray(array: Encoder[]): Encoder
        writeArray(array: number[], type: 'int32'): Encoder
        get buffer(): Buffer
    }
}

declare module 'kafkajs/src/protocol/decoder.js' {
    export default class Decoder {
        constructor(buffer: Buffer)
        readInt16(): number
        readInt32(): number
        readString(): string
        readArray<T>(reader: (decoder: Decoder) => T): T[]
    }
}

declare module 'kafkajs/src/protocol/error.js' {
    import { KafkaJSProtocolError } from 'kafkajs'

    export function createErrorFromCode(code: number): KafkaJSProtocolError
}
