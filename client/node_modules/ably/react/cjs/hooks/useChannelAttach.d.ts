import type * as Ably from 'ably';
interface ChannelAttachResult {
    connectionState: Ably.ConnectionState;
}
export declare function useChannelAttach(channel: Ably.RealtimeChannel, ablyId: string | undefined, skip: boolean): ChannelAttachResult;
export {};
